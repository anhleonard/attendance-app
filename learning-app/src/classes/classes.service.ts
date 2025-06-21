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

      // Lấy danh sách sessions đang ACTIVE và có hiệu lực hiện tại của class
      const currentDate = new Date();
      const activeSessions = await this.prismaService.session.findMany({
        where: { 
          classId, 
          status: 'ACTIVE',
          OR: [
            // Sessions currently valid
            {
              validFrom: {
                lte: currentDate,
              },
              validTo: {
                gte: currentDate,
              },
            },
            // Sessions valid from before and still active
            {
              validFrom: {
                lte: currentDate,
              },
              validTo: null,
            },
          ],
        },
      });

      // Tạo map để tra cứu nhanh các session hiện tại theo sessionKey
      const activeSessionsMap = new Map(
        activeSessions.map((s) => [s.sessionKey, s]),
      );

      const newSessionKeys = sessions.map((s) => s.sessionKey);
      const validFromDate = new Date(); // Lịch mới có hiệu lực từ hôm nay

      console.log('=== UPDATE CLASS SESSION DEBUG ===');
      console.log('Valid from date:', validFromDate.toISOString());
      console.log('New session keys:', newSessionKeys);

      let createdNewSessions = [];
      let updatedSessions = [];

      for (const session of sessions) {
        const existingSession = activeSessionsMap.get(session.sessionKey);

        if (existingSession) {
          console.log(`Processing session ${session.sessionKey}:`, {
            existingId: existingSession.id,
            existingValidFrom: existingSession.validFrom,
            existingValidTo: existingSession.validTo,
            newStartTime: session.startTime,
            newEndTime: session.endTime,
            newAmount: session.amount
          });

          // Kiểm tra xem có thay đổi gì không
          const hasChanges = 
            existingSession.startTime !== session.startTime ||
            existingSession.endTime !== session.endTime ||
            existingSession.amount !== session.amount;

          console.log('Has changes:', hasChanges);

          if (!hasChanges) {
            // Nếu session không thay đổi thì giữ nguyên
            updatedSessions.push(existingSession);
            continue;
          }

          // Nếu có thay đổi, đóng session cũ và tạo session mới
          // Đảm bảo validTo < validFrom bằng cách set validTo = validFrom - 1 millisecond
          const terminateTime = new Date(); // Thời điểm session bị terminate

          console.log('Closing existing session:', {
            sessionId: existingSession.id,
            terminateTime: terminateTime.toISOString(),
            validFromDate: validFromDate.toISOString()
          });

          // Đóng session cũ TRƯỚC khi tạo session mới
          await this.prismaService.session.update({
            where: { id: existingSession.id },
            data: {
              validTo: terminateTime,
            },
          });

          // Tạo session mới với lịch học mới
          const newSessionData = {
            ...session,
            validFrom: validFromDate,
            validTo: null,
          };

          console.log('Creating new session:', {
            sessionKey: session.sessionKey,
            validFrom: validFromDate.toISOString(),
            validTo: null
          });

          const createdSession = await this.sessionsService.createSession(
            classId,
            newSessionData,
          );
          createdNewSessions.push(createdSession);
        } else {
          // Session mới hoàn toàn, tạo mới
          const newSessionData = {
            ...session,
            validFrom: validFromDate,
            validTo: null,
          };

          console.log('Creating completely new session:', {
            sessionKey: session.sessionKey,
            validFrom: validFromDate.toISOString(),
            validTo: null
          });

          const createdSession = await this.sessionsService.createSession(
            classId,
            newSessionData,
          );
          createdNewSessions.push(createdSession);
        }
      }

      // Đóng các session cũ không có trong danh sách mới
      const sessionsToCloseIds = activeSessions
        .filter((s) => !newSessionKeys.includes(s.sessionKey as SessionKey))
        .map((s) => s.id);

      if (sessionsToCloseIds.length > 0) {
        const terminateTime = new Date(); // Thời điểm session bị terminate

        console.log('Closing removed sessions:', {
          sessionIds: sessionsToCloseIds,
          terminateTime: terminateTime.toISOString(),
          validFromDate: validFromDate.toISOString()
        });

        await this.prismaService.session.updateMany({
          where: { id: { in: sessionsToCloseIds } },
          data: { 
            validTo: terminateTime,
          },
        });
      }

      console.log('=== UPDATE CLASS SESSION COMPLETE ===');

      return {
        ...updatedClass,
        sessions: [...updatedSessions, ...createdNewSessions],
        message: 'Class updated successfully with session schedule changes',
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
        hasHistories = false,
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

        const sessionsWhereCondition: Prisma.SessionWhereInput = {
          status: 'ACTIVE',
        };

        // Only filter out terminated sessions if hasHistories is false
        if (!hasHistories) {
          sessionsWhereCondition.validTo = null;
        }

        const findManyArgs: Prisma.ClassFindManyArgs = {
          where: whereCondition,
          include: {
            sessions: {
              where: sessionsWhereCondition,
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
        
        // Create start and end of target date
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const sessionsWhereCondition: Prisma.SessionWhereInput = {
          sessionKey: sessionKeyForDay,
          status: 'ACTIVE',
        };

        // Only filter out terminated sessions if hasHistories is false
        if (!hasHistories) {
          sessionsWhereCondition.validTo = null;
        }

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
              ...sessionsWhereCondition,
              OR: [
                // Sessions valid from before and still active
                {
                  validFrom: {
                    lte: endOfDay,
                  },
                },
                // Sessions that start on target date
                {
                  validFrom: {
                    gte: startOfDay,
                    lte: endOfDay,
                  },
                },
              ],
            },
          },
        };

        const findManyArgs: Prisma.ClassFindManyArgs = {
          where: whereCondition,
          include: {
            sessions: {
              where: {
                ...sessionsWhereCondition,
                OR: [
                  // Sessions valid from before and still active
                  {
                    validFrom: {
                      lte: endOfDay,
                    },
                  },
                  // Sessions that start on target date
                  {
                    validFrom: {
                      gte: startOfDay,
                      lte: endOfDay,
                    },
                  },
                ],
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

      const sessionsWhereCondition: Prisma.SessionWhereInput = {
        status: 'ACTIVE',
      };

      // Only filter out terminated sessions if hasHistories is false
      if (!hasHistories) {
        sessionsWhereCondition.validTo = null;
      }

      const findManyArgs: Prisma.ClassFindManyArgs = {
        where: whereCondition,
        include: {
          sessions: {
            where: sessionsWhereCondition,
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
      console.log('=== GET CALENDAR DEBUG ===');
      console.log('Input parameters:', { year, month });

      // Get the first and last day of the month
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);

      console.log('Month range:', {
        firstDay: firstDay.toISOString(),
        lastDay: lastDay.toISOString()
      });

      // Generate all dates in the month
      const dates: Date[] = [];
      for (
        let date = new Date(firstDay);
        date <= lastDay;
        date.setDate(date.getDate() + 1)
      ) {
        dates.push(new Date(date));
      }

      // Get current date for comparison
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      console.log('Current date (normalized):', currentDate.toISOString());

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

        // Special logging for date "20.06.2025"
        const isTargetDate = dateKey === '20.06.2025';
        if (isTargetDate) {
          console.log('=== PROCESSING TARGET DATE: 20.06.2025 ===');
          console.log('Date object:', date.toISOString());
          console.log('Day of week:', dayOfWeek);
          console.log('Date key:', dateKey);
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const sessionKeyForDay = Object.entries(sessionKeyToDayMap).find(
          ([_, day]) => day === dayOfWeek,
        )?.[0] as SessionKey;

        if (isTargetDate) {
          console.log('Session key for day:', sessionKeyForDay);
          console.log('Start of day:', startOfDay.toISOString());
          console.log('End of day:', endOfDay.toISOString());
        }

        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);
        const isCurrentOrFutureDate = compareDate >= currentDate;

        if (isTargetDate) {
          console.log('Compare date (normalized):', compareDate.toISOString());
          console.log('Is current or future date:', isCurrentOrFutureDate);
        }

        if (isCurrentOrFutureDate) {
          // For current or future dates: get classes with active sessions
          if (isTargetDate) {
            console.log('=== FETCHING CLASSES FOR FUTURE DATE ===');
            console.log('Query conditions:', {
              status: 'ACTIVE',
              sessionKey: sessionKeyForDay,
              sessionStatus: SessionStatus.ACTIVE
            });
          }

          const classes = await this.prismaService.class.findMany({
            where: {
              status: 'ACTIVE',
              sessions: {
                some: {
                  sessionKey: sessionKeyForDay,
                  OR: [
                    // Active sessions (validTo = null)
                    {
                      validTo: null,
                    },
                    // Terminated sessions that have attendance for this date
                    {
                      validTo: {
                        not: null,
                      },
                      attendances: {
                        some: {
                          learningDate: {
                            gte: startOfDay,
                            lte: endOfDay,
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
            include: {
              sessions: {
                where: {
                  sessionKey: sessionKeyForDay,
                  OR: [
                    // Active sessions (validTo = null)
                    {
                      validTo: null,
                    },
                    // Terminated sessions that have attendance for this date
                    {
                      validTo: {
                        not: null,
                      },
                      attendances: {
                        some: {
                          learningDate: {
                            gte: startOfDay,
                            lte: endOfDay,
                          },
                        },
                      },
                    },
                  ],
                },
                include: {
                  attendances: {
                    where: {
                      learningDate: {
                        gte: startOfDay,
                        lte: endOfDay,
                      },
                    },
                  },
                },
              },
            },
          });

          if (isTargetDate) {
            console.log('Classes found for future date:', classes.length);
            if (classes.length === 0) {
              console.log('No classes found with the query conditions');
              
              // Debug: Check if there are any active classes at all
              const allActiveClasses = await this.prismaService.class.findMany({
                where: { status: 'ACTIVE' },
                select: { id: true, name: true }
              });
              console.log('All active classes:', allActiveClasses);
              
              // Debug: Check if there are any sessions with the sessionKey
              const sessionsWithKey = await this.prismaService.session.findMany({
                where: { 
                  sessionKey: sessionKeyForDay,
                  status: SessionStatus.ACTIVE
                },
                select: { 
                  id: true, 
                  sessionKey: true, 
                  classId: true,
                  validFrom: true,
                  validTo: true
                }
              });
              console.log('Sessions with sessionKey:', sessionsWithKey);
              
              // Debug: Check if there are any sessions with validTo = null
              const activeSessions = await this.prismaService.session.findMany({
                where: { 
                  status: SessionStatus.ACTIVE,
                  validTo: null
                },
                select: { 
                  id: true, 
                  sessionKey: true, 
                  classId: true,
                  validFrom: true,
                  validTo: true
                }
              });
              console.log('All active sessions (validTo = null):', activeSessions);
            }
            classes.forEach((classItem, index) => {
              console.log(`Class ${index + 1}:`, {
                id: classItem.id,
                name: classItem.name,
                sessionsCount: classItem.sessions.length,
                sessions: classItem.sessions.map(s => ({
                  id: s.id,
                  sessionKey: s.sessionKey,
                  validFrom: s.validFrom,
                  validTo: s.validTo,
                  attendancesCount: s.attendances.length
                }))
              });
              
              // Additional debug: Check all sessions for this specific class
              if (classItem.sessions.length === 0) {
                console.log(`No sessions found for class ${classItem.id}, checking all sessions for this class...`);
                this.prismaService.session.findMany({
                  where: { 
                    classId: classItem.id,
                    sessionKey: sessionKeyForDay
                  },
                  select: { 
                    id: true, 
                    sessionKey: true, 
                    classId: true,
                    status: true,
                    validFrom: true,
                    validTo: true
                  }
                }).then(allSessions => {
                  console.log(`All sessions for class ${classItem.id} with sessionKey ${sessionKeyForDay}:`, allSessions);
                });
                
                // Debug: Check ALL sessions for this class regardless of sessionKey
                this.prismaService.session.findMany({
                  where: { 
                    classId: classItem.id
                  },
                  select: { 
                    id: true, 
                    sessionKey: true, 
                    classId: true,
                    status: true,
                    validFrom: true,
                    validTo: true
                  }
                }).then(allClassSessions => {
                  console.log(`ALL sessions for class ${classItem.id} (any sessionKey):`, allClassSessions);
                });
              }
            });
          }

          const classesForDay = classes.map((classItem) => {
            const validSessions = classItem.sessions.map((session) => {
              const { attendances, ...sessionData } = session;
              return {
                ...sessionData,
                hasAttendance: attendances.length > 0,
              };
            });

            return {
              ...classItem,
              sessions: validSessions,
            };
          });

          if (isTargetDate) {
            console.log('Final classes for day:', classesForDay.length);
            console.log('Final data:', JSON.stringify(classesForDay, null, 2));
          }

          calendarData[dateKey] = classesForDay;
        } else {
          // For past dates: only get classes that have attendance records
          if (isTargetDate) {
            console.log('=== FETCHING CLASSES FOR PAST DATE ===');
          }

          const classesWithAttendance = await this.prismaService.attendance.groupBy({
            by: ['sessionId'],
            where: {
              learningDate: {
                gte: startOfDay,
                lte: endOfDay,
              },
              session: {
                class: {
                  status: 'ACTIVE',
                },
              },
            },
          });

          if (isTargetDate) {
            console.log('Classes with attendance found:', classesWithAttendance.length);
            console.log('Attendance session IDs:', classesWithAttendance.map(a => a.sessionId));
          }

          if (classesWithAttendance.length === 0) {
            if (isTargetDate) {
              console.log('No classes with attendance found, returning empty array');
            }
            calendarData[dateKey] = [];
            continue;
          }

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

          if (isTargetDate) {
            console.log('Class IDs from sessions:', classIds);
          }

          if (classIds.length === 0) {
            if (isTargetDate) {
              console.log('No class IDs found, returning empty array');
            }
            calendarData[dateKey] = [];
            continue;
          }

          // Get the full class information for these classes
          const classes = await this.prismaService.class.findMany({
            where: {
              id: { in: classIds },
              status: 'ACTIVE',
            },
            include: {
              sessions: {
                where: {
                  status: SessionStatus.ACTIVE,
                  // Include both active and terminated sessions for past dates with attendance
                },
                include: {
                  attendances: {
                    where: {
                      learningDate: {
                        gte: startOfDay,
                        lte: endOfDay,
                      },
                    },
                  },
                },
              },
            },
          });

          if (isTargetDate) {
            console.log('Classes found for past date:', classes.length);
            classes.forEach((classItem, index) => {
              console.log(`Class ${index + 1}:`, {
                id: classItem.id,
                name: classItem.name,
                sessionsCount: classItem.sessions.length,
                sessions: classItem.sessions.map(s => ({
                  id: s.id,
                  sessionKey: s.sessionKey,
                  validFrom: s.validFrom,
                  validTo: s.validTo,
                  attendancesCount: s.attendances.length
                }))
              });
            });
          }

          const classesForDay = classes
            .map((classItem) => {
              const validSessions = classItem.sessions
                .filter((session) => {
                  // For past dates, we want to show sessions that had attendance
                  // So we check if this session has any attendance for this date
                  return session.attendances.length > 0;
                })
                .map((session) => {
                  const { attendances, ...sessionData } = session;
                  return {
                    ...sessionData,
                    hasAttendance: attendances.length > 0,
                  };
                });

              // Only return class if it has valid sessions for this day
              if (validSessions.length > 0) {
                return {
                  ...classItem,
                  sessions: validSessions,
                };
              }
              return null;
            })
            .filter(Boolean); // Remove null entries

          if (isTargetDate) {
            console.log('Final classes for past date:', classesForDay.length);
            console.log('Final data for past date:', JSON.stringify(classesForDay, null, 2));
          }

          calendarData[dateKey] = classesForDay;
        }
      }

      console.log('=== CALENDAR DATA COMPLETE ===');
      console.log('Calendar data keys:', Object.keys(calendarData));
      if (calendarData['20.06.2025']) {
        console.log('Target date data:', JSON.stringify(calendarData['20.06.2025'], null, 2));
      }

      return calendarData;
    } catch (error) {
      console.error('=== GET CALENDAR ERROR ===');
      console.error('Error in getCalendar:', error);
      throw new BadRequestException(error.message);
    }
  }
}
