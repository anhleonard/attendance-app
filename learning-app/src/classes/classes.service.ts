import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { TokenPayload } from 'src/auth/token-payload/token-payload.auth';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { UpdateClassDto } from './dto/update-class.dto';
import { FilterClassDto } from './dto/filter-class.dto';
import { Prisma } from '@prisma/client';
import { SessionKey, SessionStatus } from 'src/utils/enums';

export interface CalendarResponse {
  [date: string]: any[];
}

@Injectable()
export class ClassesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sessionsService: SessionsService,
  ) {}

  async findClass(id: number) {
    try {
      return await this.prismaService.class.findFirst({
        where: {
          id,
        },
        include: {
          sessions: {
            where: {
              status: SessionStatus.ACTIVE,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createClass(createClassDto: CreateClassDto, user: TokenPayload) {
    const { sessions, ...rest } = createClassDto;
    try {
      const createdClass = await this.prismaService.class.create({
        data: {
          ...rest,
          createdBy: { connect: { id: user.userId } },
        },
      });

      let createdNewSessions = [];
      if (sessions.length > 0 && createdClass) {
        for (const session of sessions) {
          try {
            const createdSession = await this.sessionsService.createSession(
              createdClass.id,
              session,
            );
            createdNewSessions.push(createdSession);
          } catch (sessionError) {
            throw new BadRequestException(
              `Failed to create session: ${sessionError.message}`,
            );
          }
        }
      }

      return {
        ...createdClass,
        sessions: createdNewSessions,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateClass(updateClassDto: UpdateClassDto) {
    const { id: classId, sessions, status, ...rest } = updateClassDto;

    try {
      // Nếu đang cập nhật status thành INACTIVE, kiểm tra điều kiện
      if (status === 'INACTIVE') {
        // Lấy danh sách học sinh đang active trong lớp
        const activeStudentsInClass =
          await this.prismaService.studentClass.findMany({
            where: {
              classId,
              status: 'ACTIVE',
              student: {
                status: 'ACTIVE', // Chỉ lấy học sinh đang active
              },
            },
            include: {
              student: true,
            },
          });

        // Nếu có học sinh đang active trong lớp, không cho phép inactive
        if (activeStudentsInClass.length > 0) {
          throw new BadRequestException(
            'Cannot disable class while there are active students in it',
          );
        }

        // Kiểm tra xem có học sinh nào trong lớp không
        const allStudentsInClass =
          await this.prismaService.studentClass.findMany({
            where: {
              classId,
              status: 'ACTIVE',
            },
            include: {
              student: true,
            },
          });

        // Nếu không có học sinh nào trong lớp, cho phép inactive
        if (allStudentsInClass.length === 0) {
          // Tiếp tục với việc update class
        } else {
          // Kiểm tra xem tất cả học sinh trong lớp có đều inactive không
          const hasAllInactiveStudents = allStudentsInClass.every(
            (sc) => sc.student.status === 'INACTIVE',
          );

          if (!hasAllInactiveStudents) {
            throw new BadRequestException(
              'Cannot disable class while there are active students in it',
            );
          }
        }
      }

      const updatedClass = await this.prismaService.class.update({
        where: { id: classId },
        data: { ...rest, status },
      });

      // nếu không có update sessions thì return luôn, chỉ update các thông tin khác của class
      if (!sessions) {
        return updatedClass;
      }

      // Chỉ lấy danh sách sessions đang ACTIVE của class
      const activeSessions = await this.prismaService.session.findMany({
        where: { classId, status: 'ACTIVE' },
      });

      // Tạo map để tra cứu nhanh các session hiện tại theo sessionKey
      const activeSessionsMap = new Map(
        activeSessions.map((s) => [s.sessionKey, s]),
      );

      const newSessionKeys = sessions.map((s) => s.sessionKey);

      let createdNewSessions = [];
      let unchangedSessions = [];
      let sessionsToClose = [];

      for (const session of sessions) {
        const existingSession = activeSessionsMap.get(session.sessionKey);

        if (existingSession) {
          // Nếu session không thay đổi thì giữ nguyên
          if (
            existingSession.startTime === session.startTime &&
            existingSession.endTime === session.endTime &&
            existingSession.amount === session.amount
          ) {
            unchangedSessions.push(existingSession);
            continue;
          }

          // Nếu có thay đổi, đánh dấu session này cần đóng
          sessionsToClose.push(existingSession.id);
        }

        // Tạo session mới
        const createdSession = await this.sessionsService.createSession(
          classId,
          session,
        );
        createdNewSessions.push(createdSession);
      }

      // Đóng các session cũ không có trong danh sách mới
      const sessionsToCloseIds = activeSessions
        .filter((s) => !newSessionKeys.includes(s.sessionKey as SessionKey))
        .map((s) => s.id);

      const allSessionsToClose = [...sessionsToClose, ...sessionsToCloseIds];

      if (allSessionsToClose.length > 0) {
        await this.prismaService.session.updateMany({
          where: { id: { in: allSessionsToClose } },
          data: { status: 'CLOSED' },
        });
      }

      return {
        ...updatedClass,
        sessions: [...unchangedSessions, ...createdNewSessions],
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findClasses(filterClassDto: FilterClassDto) {
    try {
      const {
        name,
        status,
        page = 1,
        rowPerPage = 10,
        learningDate,
        fetchAll = false,
        month,
        year,
      } = filterClassDto;

      // If no learningDate provided, use normal class search
      if (!learningDate) {
        const whereCondition: Prisma.ClassWhereInput = {
          name:
            name === ''
              ? undefined
              : name
                ? { contains: name, mode: 'insensitive' }
                : undefined,
          status: status || undefined,
        };

        const findManyArgs: Prisma.ClassFindManyArgs = {
          where: whereCondition,
          include: {
            sessions: {
              where: { status: 'ACTIVE' },
            },
          },
        };

        if (!fetchAll) {
          findManyArgs.skip = (page - 1) * rowPerPage;
          findManyArgs.take = rowPerPage;
        }

        const [data, total] = await Promise.all([
          this.prismaService.class.findMany(findManyArgs),
          this.prismaService.class.count({ where: whereCondition }),
        ]);

        return { total, data };
      }

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const targetDate = new Date(learningDate);
      targetDate.setHours(0, 0, 0, 0);

      // For future dates, use session schedule
      if (targetDate >= currentDate) {
        const sessionKeys = [
          SessionKey.SESSION_7, // Chủ nhật
          SessionKey.SESSION_1, // Thứ 2
          SessionKey.SESSION_2, // Thứ 3
          SessionKey.SESSION_3, // Thứ 4
          SessionKey.SESSION_4, // Thứ 5
          SessionKey.SESSION_5, // Thứ 6
          SessionKey.SESSION_6, // Thứ 7
        ];

        const sessionKeyForDay = sessionKeys[targetDate.getDay()];

        const whereCondition: Prisma.ClassWhereInput = {
          name:
            name === ''
              ? undefined
              : name
                ? { contains: name, mode: 'insensitive' }
                : undefined,
          status: status || undefined,
          sessions: {
            some: {
              sessionKey: sessionKeyForDay,
              status: 'ACTIVE',
            },
          },
        };

        const findManyArgs: Prisma.ClassFindManyArgs = {
          where: whereCondition,
          include: {
            sessions: {
              where: {
                sessionKey: sessionKeyForDay,
                status: 'ACTIVE',
              },
            },
          },
        };

        if (!fetchAll) {
          findManyArgs.skip = (page - 1) * rowPerPage;
          findManyArgs.take = rowPerPage;
        }

        const [data, total] = await Promise.all([
          this.prismaService.class.findMany(findManyArgs),
          this.prismaService.class.count({ where: whereCondition }),
        ]);

        return { total, data };
      }

      // For past dates, use attendance records
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // First get all unique class IDs that have attendance records for this date
      const classesWithAttendance = await this.prismaService.attendance.groupBy(
        {
          by: ['sessionId'],
          where: {
            learningDate: {
              gte: startOfDay,
              lt: endOfDay,
            },
            session: {
              class: {
                status: status || undefined,
                ...(name
                  ? { name: { contains: name, mode: 'insensitive' } }
                  : {}),
              },
            },
          },
        },
      );

      // Get the class IDs from the sessions
      const sessions = await this.prismaService.session.findMany({
        where: {
          id: { in: classesWithAttendance.map((a) => a.sessionId) },
        },
        select: {
          classId: true,
        },
      });

      const classIds = [...new Set(sessions.map((s) => s.classId))];

      if (classIds.length === 0) {
        return { total: 0, data: [] };
      }

      // Then get the full class information for these classes
      const whereCondition: Prisma.ClassWhereInput = {
        id: { in: classIds },
        status: status || undefined,
        ...(name ? { name: { contains: name, mode: 'insensitive' } } : {}),
      };

      const findManyArgs: Prisma.ClassFindManyArgs = {
        where: whereCondition,
        include: {
          sessions: {
            where: { status: 'ACTIVE' },
            include: {
              attendances: {
                where: {
                  learningDate: {
                    gte: startOfDay,
                    lt: endOfDay,
                  },
                },
              },
            },
          },
        },
      };

      if (!fetchAll) {
        findManyArgs.skip = (page - 1) * rowPerPage;
        findManyArgs.take = rowPerPage;
      }

      const [data, total] = await Promise.all([
        this.prismaService.class.findMany(findManyArgs),
        this.prismaService.class.count({ where: whereCondition }),
      ]);

      return { total, data };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getCalendar(year: number, month: number): Promise<CalendarResponse> {
    try {
      // Get the first and last day of the month
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);

      // Generate all dates in the month
      const dates: Date[] = [];
      for (
        let date = new Date(firstDay);
        date <= lastDay;
        date.setDate(date.getDate() + 1)
      ) {
        dates.push(new Date(date));
      }

      // Get all active classes with their sessions
      const classes = await this.prismaService.class.findMany({
        where: {
          status: 'ACTIVE',
          sessions: {
            some: {
              status: SessionStatus.ACTIVE,
            },
          },
        },
        include: {
          sessions: {
            where: {
              status: SessionStatus.ACTIVE,
            },
            include: {
              attendances: true,
            },
          },
        },
      });

      // Map session keys to days of week
      const sessionKeyToDayMap = {
        [SessionKey.SESSION_1]: 1, // Monday
        [SessionKey.SESSION_2]: 2, // Tuesday
        [SessionKey.SESSION_3]: 3, // Wednesday
        [SessionKey.SESSION_4]: 4, // Thursday
        [SessionKey.SESSION_5]: 5, // Friday
        [SessionKey.SESSION_6]: 6, // Saturday
        [SessionKey.SESSION_7]: 0, // Sunday
      };

      // Organize classes by date
      const calendarData: CalendarResponse = {};

      for (const date of dates) {
        const dayOfWeek = date.getDay();
        const dateKey = date
          .toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
          .replace(/\//g, '.');

        // Set time range for the current date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Get session key for this day
        const sessionKeyForDay = Object.entries(sessionKeyToDayMap).find(
          ([_, day]) => day === dayOfWeek,
        )?.[0] as SessionKey;

        // Map classes with only sessions for this specific day
        const classesForDay = classes
          .filter((classItem) =>
            classItem.sessions.some(
              (session) => session.sessionKey === sessionKeyForDay,
            ),
          )
          .map((classItem) => ({
            ...classItem,
            sessions: classItem.sessions
              .filter((session) => session.sessionKey === sessionKeyForDay)
              .map((session) => {
                const { attendances, ...sessionData } = session;
                const dayAttendances = attendances.filter((attendance) => {
                  const attendanceDate = new Date(attendance.learningDate);
                  return (
                    attendanceDate >= startOfDay && attendanceDate <= endOfDay
                  );
                });
                return {
                  ...sessionData,
                  hasAttendance: dayAttendances.length > 0,
                };
              }),
          }));

        calendarData[dateKey] = classesForDay;
      }

      return calendarData;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
