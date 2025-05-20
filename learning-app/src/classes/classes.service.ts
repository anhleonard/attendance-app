import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(ClassesService.name);

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
      this.logger.log(`Starting to create class: ${createClassDto.name}`);
      this.logger.debug(`Class data: ${JSON.stringify(rest)}`);
      this.logger.debug(`Sessions data: ${JSON.stringify(sessions)}`);

      const createdClass = await this.prismaService.class.create({
        data: {
          ...rest,
          createdBy: { connect: { id: user.userId } },
        },
      });

      this.logger.log(`Successfully created class with ID: ${createdClass.id}`);

      let createdNewSessions = [];
      if (sessions.length > 0 && createdClass) {
        this.logger.log(`Creating ${sessions.length} sessions for class ${createdClass.id}`);
        
        for (const session of sessions) {
          try {
            const createdSession = await this.sessionsService.createSession(
              createdClass.id,
              session,
            );
            createdNewSessions.push(createdSession);
            this.logger.debug(`Created session ${createdSession.id} for class ${createdClass.id}`);
          } catch (sessionError) {
            this.logger.error(
              `Failed to create session for class ${createdClass.id}: ${sessionError.message}`,
              sessionError.stack,
              {
                classId: createdClass.id,
                sessionData: session,
                error: sessionError,
              }
            );
            throw new BadRequestException(
              `Failed to create session: ${sessionError.message}`
            );
          }
        }
      }

      this.logger.log(`Successfully created all sessions for class ${createdClass.id}`);
      return {
        ...createdClass,
        sessions: createdNewSessions,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create class: ${error.message}`,
        error.stack,
        {
          classData: createClassDto,
          userId: user.userId,
          error: error,
        }
      );
      throw new BadRequestException(error.message);
    }
  }

  async updateClass(updateClassDto: UpdateClassDto) {
    const { id: classId, sessions, ...rest } = updateClassDto;

    try {
      const updatedClass = await this.prismaService.class.update({
        where: { id: classId },
        data: { ...rest },
      });

      // nếu không có update sessions thì return luôn, chỉ update các thông tin khác của class
      if (!sessions) {
        return;
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

      const sessionKeys = [
        SessionKey.SESSION_7, // Chủ nhật
        SessionKey.SESSION_1, // Thứ 2
        SessionKey.SESSION_2, // Thứ 3
        SessionKey.SESSION_3, // Thứ 4
        SessionKey.SESSION_4, // Thứ 5
        SessionKey.SESSION_5, // Thứ 6
        SessionKey.SESSION_6, // Thứ 7
      ];

      const definedStatus = learningDate
        ? sessionKeys[new Date(learningDate).getDay()]
        : undefined;

      const whereCondition: Prisma.ClassWhereInput = {
        name:
          name === ''
            ? undefined
            : name
              ? { contains: name, mode: 'insensitive' }
              : undefined,
        status: status || undefined,
        ...(definedStatus
          ? {
              sessions: {
                some: {
                  sessionKey: definedStatus,
                  status: 'ACTIVE',
                },
              },
            }
          : {}),
      };

      const findManyArgs: Prisma.ClassFindManyArgs = {
        where: whereCondition,
        include: {
          sessions: {
            where: {
              sessionKey: definedStatus,
              status: 'ACTIVE',
            },
            include: learningDate
              ? {
                  attendances: {
                    where: {
                      learningDate: {
                        gte: new Date(learningDate.setHours(0, 0, 0, 0)),
                        lt: new Date(learningDate.setHours(23, 59, 59, 999)),
                      },
                    },
                  },
                }
              : {},
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

      return {
        total,
        data,
      };
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
