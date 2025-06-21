import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { TokenPayload } from 'src/auth/token-payload/token-payload.auth';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { FilterAttendanceDto } from './dto/filter-attendance.dto';
import { Prisma } from '@prisma/client';
import { UpdateBatchAttendanceDto } from './dto/update-batch-attendance.dto';
import { sortVietnameseNames } from 'src/utils/functions';

@Injectable()
export class AttendancesService {
  constructor(private readonly prismaService: PrismaService) {}

  async createAttendance(
    createAttendanceDto: CreateAttendanceDto,
    user: TokenPayload,
  ) {
    try {
      const { studentId, sessionId, learningDate, ...rest } =
        createAttendanceDto;

      console.log('=== CREATE ATTENDANCE DEBUG ===');
      console.log('Input data:', {
        studentId,
        sessionId,
        learningDate,
        rest,
        userId: user.userId
      });

      // Normalize learningDate to start of day for comparison
      const normalizedLearningDate = new Date(learningDate);
      normalizedLearningDate.setHours(0, 0, 0, 0);

      console.log('Normalized learning date:', {
        original: learningDate,
        normalized: normalizedLearningDate
      });

      // First, let's check if the session exists at all
      const basicSession = await this.prismaService.session.findFirst({
        where: { id: sessionId },
        include: { class: true }
      });

      console.log('Basic session check:', {
        sessionFound: !!basicSession,
        sessionData: basicSession ? {
          id: basicSession.id,
          sessionKey: basicSession.sessionKey,
          status: basicSession.status,
          validFrom: basicSession.validFrom,
          validTo: basicSession.validTo,
          classId: basicSession.classId,
          classStatus: basicSession.class?.status
        } : null
      });

      let foundSession = await this.prismaService.session.findFirst({
        where: {
          id: sessionId,
          status: 'ACTIVE',
          OR: [
            // Sessions valid on learning date (compare by date only)
            {
              validFrom: {
                lte: normalizedLearningDate,
              },
              validTo: {
                gte: normalizedLearningDate,
              },
            },
            // Sessions valid from before and still active (compare by date only)
            {
              validFrom: {
                lte: normalizedLearningDate,
              },
              validTo: null,
            },
          ],
        },
        include: {
          class: true,
        },
      });

      // Additional check: normalize validFrom and validTo for comparison
      let sessionValidForDate = false;
      if (basicSession) {
        const sessionValidFrom = basicSession.validFrom ? new Date(basicSession.validFrom) : null;
        const sessionValidTo = basicSession.validTo ? new Date(basicSession.validTo) : null;
        
        if (sessionValidFrom) {
          sessionValidFrom.setHours(0, 0, 0, 0);
        }
        if (sessionValidTo) {
          sessionValidTo.setHours(23, 59, 59, 999);
        }

        sessionValidForDate = 
          sessionValidFrom && sessionValidFrom <= normalizedLearningDate &&
          (!sessionValidTo || sessionValidTo >= normalizedLearningDate);

        console.log('Manual date validation:', {
          sessionValidFrom: sessionValidFrom,
          sessionValidTo: sessionValidTo,
          normalizedLearningDate: normalizedLearningDate,
          sessionValidForDate: sessionValidForDate
        });
      }

      console.log('Detailed session check:', {
        sessionFound: !!foundSession,
        sessionValidForDate: sessionValidForDate,
        sessionData: foundSession ? {
          id: foundSession.id,
          sessionKey: foundSession.sessionKey,
          status: foundSession.status,
          validFrom: foundSession.validFrom,
          validTo: foundSession.validTo,
          classId: foundSession.classId,
          classStatus: foundSession.class?.status,
          learningDate: normalizedLearningDate
        } : null,
        queryConditions: {
          sessionId,
          status: 'ACTIVE',
          learningDate: normalizedLearningDate,
          validFromLte: normalizedLearningDate,
          validToGte: normalizedLearningDate,
          validToNull: null
        }
      });

      // Use manual validation if Prisma query fails but session should be valid
      if (!foundSession && sessionValidForDate && basicSession && basicSession.class) {
        console.log('Using manual validation - session is valid for this date');
        foundSession = basicSession;
      }

      if (!foundSession || !foundSession.class) {
        console.log('ERROR: Session or class not found');
        console.log('Session found:', !!foundSession);
        console.log('Class found:', !!foundSession?.class);
        console.log('Session valid for date:', sessionValidForDate);
        throw new NotFoundException('No related session or class found');
      }

      const classId = foundSession.class.id;

      const studentClass = await this.prismaService.studentClass.findFirst({
        where: {
          studentId: studentId,
          classId: classId,
          status: 'ACTIVE',
        },
        include: {
          student: true,
        },
      });

      console.log('Student class check:', {
        studentClassFound: !!studentClass,
        studentClassData: studentClass ? {
          studentId: studentClass.studentId,
          classId: studentClass.classId,
          status: studentClass.status,
          studentStatus: studentClass.student?.status
        } : null
      });

      if (!studentClass) {
        throw new BadRequestException(
          'The student does not belong to this class',
        );
      }

      // Check if isAttend is false - if so, don't create attendance record
      const { isAttend } = rest;
      if (!isAttend) {
        console.log('=== CREATE ATTENDANCE SKIPPED ===');
        console.log('isAttend is false, skipping attendance creation');
        return {
          message: 'Attendance creation skipped - student is not attending',
          isAttend: false,
        };
      }

      //sau khi từ session tìm ra lớp và xác nhận student thuộc class đó thì tạo attendance
      const createdAttendance = await this.prismaService.attendance.create({
        data: {
          ...rest,
          learningDate,
          createdBy: { connect: { id: user.userId } },
          session: { connect: { id: sessionId } },
          student: { connect: { id: studentId } },
        },
      });

      console.log('Attendance created successfully:', {
        attendanceId: createdAttendance.id,
        isAttend: createdAttendance.isAttend
      });

      // TASK: update payment based on attendance //
      // Note: Since we only create attendance when isAttend = true, we can simplify payment logic

      // Xác định tháng và năm của buổi học từ learningDate
      const attendanceDate = new Date(learningDate);
      const attendanceMonth = attendanceDate.getMonth() + 1;
      const attendanceYear = attendanceDate.getFullYear();

      console.log('Payment calculation:', {
        attendanceMonth,
        attendanceYear,
        isAttend: true, // Always true since we only create when attending
        sessionAmount: foundSession.amount,
        studentDebt: studentClass.student.debt
      });

      // Lấy Payment hiện tại của tháng
      let payment = await this.prismaService.payment.findFirst({
        where: {
          studentId,
          createdAt: {
            gte: new Date(attendanceYear, attendanceMonth - 1, 1),
            lt: new Date(attendanceYear, attendanceMonth, 1),
          },
        },
      });

      console.log('Existing payment check:', {
        paymentFound: !!payment,
        paymentData: payment ? {
          id: payment.id,
          totalSessions: payment.totalSessions,
          totalAttend: payment.totalAttend,
          totalMonthAmount: payment.totalMonthAmount,
          totalPayment: payment.totalPayment
        } : null
      });

      if (!payment) {
        // Nếu chưa có Payment, tạo mới
        try {
          payment = await this.prismaService.payment.create({
            data: {
              totalSessions: 1, // Tăng tổng số buổi đã điểm danh
              totalAttend: 1, // Tăng số buổi tham gia (luôn = 1 vì chỉ tạo khi đi học)
              totalMonthAmount: foundSession.amount, // Tính tiền cho buổi học
              totalPayment: foundSession.amount + studentClass.student.debt,
              status: 'SAVED',
              student: { connect: { id: studentId } },
            },
          });
          console.log('New payment created:', {
            paymentId: payment.id,
            totalSessions: payment.totalSessions,
            totalAttend: payment.totalAttend,
            totalMonthAmount: payment.totalMonthAmount,
            totalPayment: payment.totalPayment
          });
        } catch (error) {
          console.error('Error creating payment:', error);
          throw error;
        }
      } else {
        // Nếu đã có Payment, cập nhật thêm buổi học mới
        try {
          const updateData = {
            totalSessions: { increment: 1 }, // Tăng tổng số buổi đã điểm danh
            totalAttend: { increment: 1 }, // Tăng số buổi tham gia
            totalMonthAmount: { increment: foundSession.amount }, // Cộng tiền cho buổi học
            totalPayment: {
              increment: foundSession.amount, // Cộng tiền cho buổi học
            },
          };

          console.log('Updating existing payment:', updateData);

          payment = await this.prismaService.payment.update({
            where: { id: payment.id },
            data: updateData,
          });

          console.log('Payment updated successfully:', {
            paymentId: payment.id,
            totalSessions: payment.totalSessions,
            totalAttend: payment.totalAttend,
            totalMonthAmount: payment.totalMonthAmount,
            totalPayment: payment.totalPayment
          });
        } catch (error) {
          console.error('Error updating payment:', error);
          throw error;
        }
      }

      // Cập nhật attendance với paymentId
      const updatedAttendance = await this.prismaService.attendance.update({
        where: { id: createdAttendance.id },
        data: { payment: { connect: { id: payment.id } } },
      });

      console.log('=== CREATE ATTENDANCE SUCCESS ===');
      console.log('Final result:', {
        attendanceId: updatedAttendance.id,
        paymentId: payment.id,
        isAttend: updatedAttendance.isAttend
      });

      return {
        createdAttendance: updatedAttendance,
        payment: payment ?? 'No payment updated',
      };
    } catch (error) {
      console.error('=== CREATE ATTENDANCE ERROR ===');
      console.error('Error in createAttendance:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw new BadRequestException(error.message);
    }
  }

  async updateAttendance(
    updateAttendanceDto: UpdateAttendanceDto,
    user: TokenPayload,
  ) {
    const { attendanceId, ...rest } = updateAttendanceDto;

    const foundAttendance = await this.prismaService.attendance.findFirst({
      where: {
        id: attendanceId,
      },
      include: {
        session: true,
      },
    });

    if (!foundAttendance) {
      throw new NotFoundException('Attendance not found');
    }

    // Check if there are any changes to update
    const hasChanges =
      rest.isAttend !== foundAttendance.isAttend ||
      (rest.noteAttendance !== undefined &&
        rest.noteAttendance !== foundAttendance.noteAttendance);

    if (!hasChanges) {
      return {
        message: 'Nothing to update',
      };
    }

    // If only noteAttendance changed and isAttend remains the same
    if (
      rest.isAttend === foundAttendance.isAttend &&
      rest.noteAttendance !== undefined
    ) {
      return await this.prismaService.attendance.update({
        where: { id: attendanceId },
        data: {
          noteAttendance: rest.noteAttendance,
          updatedBy: { connect: { id: user.userId } },
        },
      });
    }

    // no permission to update for previous months
    const createdAt = new Date(foundAttendance.createdAt);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    if (
      createdAt.getMonth() !== currentMonth ||
      createdAt.getFullYear() !== currentYear
    ) {
      throw new BadRequestException(
        'Cannot update attendance from previous months',
      );
    }

    const { studentId } = foundAttendance;

    // Get Payment of current month
    const payment = await this.prismaService.payment.findFirst({
      where: {
        studentId,
        createdAt: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1),
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const isCurrentlyAttend = foundAttendance.isAttend;

    if (isCurrentlyAttend && !rest.isAttend) {
      // Nếu học sinh đang được điểm danh mà cập nhật lại là nghỉ => Trừ tiền
      await this.prismaService.payment.update({
        where: { id: payment.id },
        data: {
          totalSessions: payment.totalSessions - 1,
          totalMonthAmount:
            payment.totalMonthAmount - foundAttendance.session.amount,
          totalPayment: payment.totalPayment - foundAttendance.session.amount,
        },
      });
    }

    if (!isCurrentlyAttend && rest.isAttend) {
      // Nếu học sinh chưa được điểm danh mà cập nhật là đi học => Cộng tiền
      await this.prismaService.payment.update({
        where: { id: payment.id },
        data: {
          totalSessions: payment.totalSessions + 1,
          totalMonthAmount:
            payment.totalMonthAmount + foundAttendance.session.amount,
          totalPayment: payment.totalPayment + foundAttendance.session.amount,
        },
      });
    }

    // Cập nhật lại trạng thái của Attendance
    return await this.prismaService.attendance.update({
      where: { id: attendanceId },
      data: {
        isAttend: rest.isAttend,
        noteAttendance: rest.noteAttendance,
        updatedBy: { connect: { id: user.userId } },
      },
    });
  }

  async findAttendances(filterAttendanceDto: FilterAttendanceDto) {
    const {
      paymentId,
      isAttend,
      learningMonth,
      learningYear,
      classId,
      learningDate,
      page = 1,
      rowPerPage = 10,
    } = filterAttendanceDto;

    const whereCondition: Prisma.AttendanceWhereInput = {
      paymentId: paymentId || undefined,
      isAttend: isAttend || undefined,
      session: classId
        ? {
            classId: classId,
          }
        : undefined,
      learningDate: learningDate
        ? {
            gte: new Date(learningDate.setHours(0, 0, 0, 0)),
            lt: new Date(learningDate.setHours(23, 59, 59, 999)),
          }
        : learningMonth !== undefined && learningYear !== undefined
          ? {
              gte: new Date(learningYear, learningMonth - 1, 1), // Ngày đầu tháng
              lt: new Date(learningYear, learningMonth, 1), // Ngày đầu tháng tiếp theo
            }
          : undefined,
    };

    const [attendances, total] = await Promise.all([
      this.prismaService.attendance.findMany({
        where: whereCondition,
        include: {
          student: {
            select: {
              id: true,
              name: true,
            },
          },
          session: {
            select: {
              id: true,
              sessionKey: true,
              startTime: true,
              endTime: true,
              class: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [
          {
            isAttend: 'asc', // Sắp xếp theo trạng thái điểm danh: false (vắng) trước, true (có mặt) sau
          },
          {
            learningDate: 'desc', // Sau đó sắp xếp theo ngày học giảm dần
          },
        ],
        skip: (page - 1) * rowPerPage,
        take: rowPerPage,
      }),
      this.prismaService.attendance.count({ where: whereCondition }),
    ]);

    // Tính toán thống kê
    const statistic = {
      total: total,
      attended: await this.prismaService.attendance.count({
        where: {
          ...whereCondition,
          isAttend: true,
        },
      }),
      absent: await this.prismaService.attendance.count({
        where: {
          ...whereCondition,
          isAttend: false,
        },
      }),
    };

    return {
      statistic,
      total,
      page,
      rowPerPage,
      data: attendances,
    };
  }

  async updateBatchAttendances(
    updateBatchAttendanceDto: UpdateBatchAttendanceDto,
    user: TokenPayload,
  ) {
    const { classId, learningDate, attendances } = updateBatchAttendanceDto;

    try {
      // Kiểm tra xem lớp có tồn tại không
      const foundClass = await this.prismaService.class.findFirst({
        where: { id: classId },
        include: {
          sessions: {
            where: { 
              status: 'ACTIVE',
              OR: [
                // Sessions valid on learning date (with validFrom/validTo)
                {
                  validFrom: {
                    lte: new Date(learningDate),
                  },
                  validTo: {
                    gte: new Date(learningDate),
                  },
                },
                // Sessions valid from before and still active (with validFrom/validTo)
                {
                  validFrom: {
                    lte: new Date(learningDate),
                  },
                  validTo: null,
                },
                // Fallback for old data without validFrom/validTo
                {
                  validFrom: null,
                  validTo: null,
                },
              ],
            },
          },
        },
      });

      if (!foundClass) {
        throw new NotFoundException('Class not found');
      }

      // Chỉ kiểm tra học sinh đang học trong lớp nếu learningDate là ngày tương lai
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const targetDate = new Date(learningDate);
      targetDate.setHours(0, 0, 0, 0);

      let activeStudentIds: Set<number>;
      if (targetDate > currentDate) {
        // Lấy danh sách học sinh đang học trong lớp chỉ khi là ngày tương lai
        const activeStudents = await this.prismaService.studentClass.findMany({
          where: {
            classId,
            status: 'ACTIVE',
          },
          include: {
            student: true,
          },
        });

        activeStudentIds = new Set(activeStudents.map((sc) => sc.studentId));
      }

      // Kiểm tra và cập nhật từng điểm danh
      const updatePromises = attendances.map(async (attendance) => {
        const { studentId, sessionId, attendanceId } = attendance;

        // Chỉ kiểm tra học sinh có thuộc lớp không nếu là ngày tương lai
        if (targetDate > currentDate && !activeStudentIds.has(studentId)) {
          throw new BadRequestException(
            `Student ${studentId} does not belong to this class`,
          );
        }

        // Kiểm tra session có thuộc lớp không
        const session = foundClass.sessions.find((s) => s.id === sessionId);
        if (!session) {
          throw new BadRequestException(
            `Session ${sessionId} does not belong to this class`,
          );
        }

        // Kiểm tra attendance có tồn tại và thuộc về session/student này không
        const existingAttendance =
          await this.prismaService.attendance.findFirst({
            where: {
              id: attendanceId,
              studentId,
              sessionId,
              learningDate: {
                gte: new Date(learningDate.setHours(0, 0, 0, 0)),
                lt: new Date(learningDate.setHours(23, 59, 59, 999)),
              },
            },
            include: {
              session: true,
            },
          });

        if (!existingAttendance) {
          throw new NotFoundException(
            `Attendance record not found for student ${studentId} in session ${sessionId}`,
          );
        }

        // Cập nhật điểm danh
        const updatedAttendance = await this.prismaService.attendance.update({
          where: { id: attendanceId },
          data: {
            isAttend: attendance.isAttend,
            noteAttendance: attendance.noteAttendance,
            updatedBy: { connect: { id: user.userId } },
          },
        });

        // Cập nhật payment nếu cần
        if (existingAttendance.isAttend !== updatedAttendance.isAttend) {
          const { studentId } = existingAttendance;
          const attendanceMonth = learningDate.getMonth() + 1;
          const attendanceYear = learningDate.getFullYear();

          // Lấy Payment hiện tại của tháng
          const payment = await this.prismaService.payment.findFirst({
            where: {
              studentId,
              createdAt: {
                gte: new Date(attendanceYear, attendanceMonth - 1, 1),
                lt: new Date(attendanceYear, attendanceMonth, 1),
              },
            },
          });

          if (payment) {
            if (existingAttendance.isAttend && !updatedAttendance.isAttend) {
              // Nếu chuyển từ đi học sang vắng mặt
              await this.prismaService.payment.update({
                where: { id: payment.id },
                data: {
                  totalSessions: { decrement: 1 },
                  totalMonthAmount: {
                    decrement: existingAttendance.session.amount,
                  },
                  totalPayment: {
                    decrement: existingAttendance.session.amount,
                  },
                },
              });
            } else if (
              !existingAttendance.isAttend &&
              updatedAttendance.isAttend
            ) {
              // Nếu chuyển từ vắng mặt sang đi học
              await this.prismaService.payment.update({
                where: { id: payment.id },
                data: {
                  totalSessions: { increment: 1 },
                  totalMonthAmount: {
                    increment: existingAttendance.session.amount,
                  },
                  totalPayment: {
                    increment: existingAttendance.session.amount,
                  },
                },
              });
            }
          }
        }

        return updatedAttendance;
      });

      const updatedAttendances = await Promise.all(updatePromises);

      return {
        message: 'Successfully updated attendances',
        data: updatedAttendances,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
