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
import { QueueService } from 'src/queue/queue.service';
import { CreateAttendance } from 'src/utils/interfaces';

@Injectable()
export class AttendancesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  async createAttendance(
    createAttendanceDto: CreateAttendanceDto,
    user: TokenPayload,
  ) {
    console.log('🚀 === CREATE ATTENDANCE START ===');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('👤 User ID:', user.userId);

    try {
      const { studentId, sessionId, learningDate, classId, ...rest } =
        createAttendanceDto;

      console.log('📋 Input data:', {
        studentId,
        sessionId,
        learningDate,
        classId,
        rest,
        userId: user.userId,
      });

      // Normalize learningDate to start of day for comparison
      const normalizedLearningDate = new Date(learningDate);
      normalizedLearningDate.setHours(0, 0, 0, 0);

      console.log('📅 Date normalization:', {
        original: learningDate,
        normalized: normalizedLearningDate,
        originalType: typeof learningDate,
        normalizedType: typeof normalizedLearningDate,
      });

      // First, let's check if the session exists at all
      console.log('🔍 Step 1: Checking if session exists...');
      const basicSession = await this.prismaService.session.findFirst({
        where: { id: sessionId },
        include: { class: true },
      });

      console.log('✅ Basic session check result:', {
        sessionFound: !!basicSession,
        sessionId: sessionId,
        sessionData: basicSession
          ? {
              id: basicSession.id,
              sessionKey: basicSession.sessionKey,
              status: basicSession.status,
              validFrom: basicSession.validFrom,
              validTo: basicSession.validTo,
              classId: basicSession.classId,
              classStatus: basicSession.class?.status,
              className: basicSession.class?.name,
            }
          : null,
      });

      if (!basicSession) {
        console.log('❌ ERROR: Basic session not found');
        throw new NotFoundException(`Session with ID ${sessionId} not found`);
      }

      console.log('🔍 Step 2: Finding session with detailed criteria...');
      let foundSession = await this.prismaService.session.findFirst({
        where: {
          id: sessionId,
          // status: 'ACTIVE',
          // OR: [
          //   // Sessions valid on learning date (compare by date only)
          //   {
          //     validFrom: {
          //       lte: normalizedLearningDate,
          //     },
          //     validTo: {
          //       gte: normalizedLearningDate,
          //     },
          //   },
          //   // Sessions valid from before and still active (compare by date only)
          //   {
          //     validFrom: {
          //       lte: normalizedLearningDate,
          //     },
          //     validTo: null,
          //   },
          // ],
        },
        include: {
          class: true,
        },
      });

      console.log('✅ Detailed session query result:', {
        foundSession: !!foundSession,
        sessionData: foundSession
          ? {
              id: foundSession.id,
              sessionKey: foundSession.sessionKey,
              status: foundSession.status,
              validFrom: foundSession.validFrom,
              validTo: foundSession.validTo,
              classId: foundSession.classId,
              classStatus: foundSession.class?.status,
              className: foundSession.class?.name,
            }
          : null,
      });

      // Additional check: normalize validFrom and validTo for comparison
      console.log('🔍 Step 3: Manual date validation...');
      let sessionValidForDate = false;
      if (basicSession) {
        const sessionValidFrom = basicSession.validFrom
          ? new Date(basicSession.validFrom)
          : null;
        const sessionValidTo = basicSession.validTo
          ? new Date(basicSession.validTo)
          : null;

        if (sessionValidFrom) {
          sessionValidFrom.setHours(0, 0, 0, 0);
        }
        if (sessionValidTo) {
          sessionValidTo.setHours(23, 59, 59, 999);
        }

        sessionValidForDate =
          sessionValidFrom &&
          sessionValidFrom <= normalizedLearningDate &&
          (!sessionValidTo || sessionValidTo >= normalizedLearningDate);

        console.log('📅 Manual date validation result:', {
          sessionValidFrom: sessionValidFrom,
          sessionValidTo: sessionValidTo,
          normalizedLearningDate: normalizedLearningDate,
          sessionValidForDate: sessionValidForDate,
          comparison: {
            validFromLte: sessionValidFrom
              ? sessionValidFrom <= normalizedLearningDate
              : false,
            validToGte: sessionValidTo
              ? sessionValidTo >= normalizedLearningDate
              : true,
          },
        });
      }

      console.log('📊 Session validation summary:', {
        sessionFound: !!foundSession,
        sessionValidForDate: sessionValidForDate,
        basicSessionExists: !!basicSession,
        basicSessionHasClass: !!basicSession?.class,
        foundSessionHasClass: !!foundSession?.class,
        sessionData: foundSession
          ? {
              id: foundSession.id,
              sessionKey: foundSession.sessionKey,
              status: foundSession.status,
              validFrom: foundSession.validFrom,
              validTo: foundSession.validTo,
              classId: foundSession.classId,
              classStatus: foundSession.class?.status,
              className: foundSession.class?.name,
              learningDate: normalizedLearningDate,
            }
          : null,
        queryConditions: {
          sessionId,
          status: 'ACTIVE',
          learningDate: normalizedLearningDate,
          validFromLte: normalizedLearningDate,
          validToGte: normalizedLearningDate,
          validToNull: null,
        },
      });

      // Use manual validation if Prisma query fails but session should be valid
      if (
        !foundSession &&
        sessionValidForDate &&
        basicSession &&
        basicSession.class
      ) {
        console.log(
          '🔄 Using manual validation - session is valid for this date',
        );
        foundSession = basicSession;
        console.log('✅ Session set from basic session:', {
          sessionId: foundSession.id,
          sessionKey: foundSession.sessionKey,
        });
      }

      if (!foundSession || !foundSession.class) {
        console.log('❌ ERROR: Session or class not found');
        console.log('Session found:', !!foundSession);
        console.log('Class found:', !!foundSession?.class);
        console.log('Session valid for date:', sessionValidForDate);
        throw new NotFoundException('No related session or class found');
      }

      const sessionClassId = foundSession.class.id;
      console.log('🏫 Session class info:', {
        sessionClassId: sessionClassId,
        className: foundSession.class.name,
        classStatus: foundSession.class.status,
      });

      console.log('🔍 Step 4: Checking student class relationship...');
      const studentClass = await this.prismaService.studentClass.findFirst({
        where: {
          studentId: studentId,
          classId: sessionClassId,
          status: 'ACTIVE',
        },
        include: {
          student: true,
        },
      });

      console.log('✅ Student class check result:', {
        studentClassFound: !!studentClass,
        queryParams: {
          studentId: studentId,
          classId: sessionClassId,
          status: 'ACTIVE',
        },
        studentClassData: studentClass
          ? {
              studentClassId: studentClass.id,
              studentId: studentClass.studentId,
              classId: studentClass.classId,
              status: studentClass.status,
              studentStatus: studentClass.student?.status,
              studentName: studentClass.student?.name,
            }
          : null,
      });

      if (!studentClass) {
        console.log('❌ ERROR: Student does not belong to this class');
        console.log('Failed query params:', {
          studentId: studentId,
          classId: sessionClassId,
          status: 'ACTIVE',
        });
        throw new BadRequestException(
          'The student does not belong to this class',
        );
      }

      // Always create attendance record, regardless of isAttend
      const { isAttend } = rest;
      console.log('📝 Step 5: Creating attendance record...');
      console.log('Attendance data to create:', {
        isAttend: isAttend,
        noteAttendance: rest.noteAttendance || '',
        learningDate: learningDate,
        createdBy: user.userId,
        sessionId: sessionId,
        studentId: studentId,
      });

      const createdAttendance = await this.prismaService.attendance.create({
        data: {
          isAttend,
          noteAttendance: rest.noteAttendance || '',
          learningDate,
          createdBy: { connect: { id: user.userId } },
          session: { connect: { id: sessionId } },
          student: { connect: { id: studentId } },
        },
      });

      console.log('✅ Attendance created successfully:', {
        attendanceId: createdAttendance.id,
        isAttend: createdAttendance.isAttend,
        noteAttendance: createdAttendance.noteAttendance,
        learningDate: createdAttendance.learningDate,
        createdAt: createdAttendance.createdAt,
      });

      // Only calculate/update payment if isAttend is true
      if (!isAttend) {
        console.log(
          '⚠️ Attendance created with isAttend = false, skipping payment update',
        );
        return {
          createdAttendance,
          payment: null,
          message:
            'Attendance created with isAttend = false, payment not updated.',
        };
      }

      console.log('💰 Step 6: Processing payment for attendance...');
      // TASK: update payment based on attendance //
      // Xác định tháng và năm của buổi học từ learningDate
      const attendanceDate = new Date(learningDate);
      const attendanceMonth = attendanceDate.getMonth() + 1;
      const attendanceYear = attendanceDate.getFullYear();

      console.log('📅 Payment calculation params:', {
        attendanceDate: attendanceDate,
        attendanceMonth: attendanceMonth,
        attendanceYear: attendanceYear,
        studentId: studentId,
        sessionAmount: foundSession.amount,
        studentDebt: studentClass.student.debt,
        paymentDateRange: {
          from: new Date(attendanceYear, attendanceMonth - 1, 1),
          to: new Date(attendanceYear, attendanceMonth, 1),
        },
      });

      let payment = await this.prismaService.payment.findFirst({
        where: {
          studentId,
          createdAt: {
            gte: new Date(attendanceYear, attendanceMonth - 1, 1),
            lt: new Date(attendanceYear, attendanceMonth, 1),
          },
        },
      });

      console.log('🔍 Existing payment check:', {
        paymentFound: !!payment,
        paymentData: payment
          ? {
              id: payment.id,
              totalAttend: payment.totalAttend,
              totalMonthAmount: payment.totalMonthAmount,
              totalPayment: payment.totalPayment,
              status: payment.status,
              createdAt: payment.createdAt,
            }
          : null,
      });

      if (!payment) {
        // Nếu chưa có Payment, tạo mới
        console.log('🆕 Creating new payment record...');
        const newPaymentData = {
          totalAttend: 1,
          totalMonthAmount: foundSession.amount,
          totalPayment: foundSession.amount + studentClass.student.debt,
          status: 'SAVED',
          studentId: studentId,
        };
        console.log('📋 New payment data:', newPaymentData);

        payment = await this.prismaService.payment.create({
          data: {
            totalAttend: 1,
            totalMonthAmount: foundSession.amount,
            totalPayment: foundSession.amount + studentClass.student.debt,
            status: 'SAVED',
            student: { connect: { id: studentId } },
          },
        });

        console.log('✅ New payment created:', {
          paymentId: payment.id,
          totalAttend: payment.totalAttend,
          totalMonthAmount: payment.totalMonthAmount,
          totalPayment: payment.totalPayment,
          status: payment.status,
        });
      } else {
        // Nếu đã có Payment, cập nhật thêm buổi học mới
        console.log('🔄 Updating existing payment...');
        const updateData = {
          totalAttend: { increment: 1 },
          totalMonthAmount: { increment: foundSession.amount },
          totalPayment: { increment: foundSession.amount },
        };
        console.log('📋 Payment update data:', updateData);
        console.log('📊 Current payment values:', {
          currentTotalAttend: payment.totalAttend,
          currentTotalMonthAmount: payment.totalMonthAmount,
          currentTotalPayment: payment.totalPayment,
          sessionAmount: foundSession.amount,
        });

        payment = await this.prismaService.payment.update({
          where: { id: payment.id },
          data: {
            totalAttend: { increment: 1 },
            totalMonthAmount: { increment: foundSession.amount },
            totalPayment: { increment: foundSession.amount },
          },
        });

        console.log('✅ Payment updated:', {
          paymentId: payment.id,
          newTotalAttend: payment.totalAttend,
          newTotalMonthAmount: payment.totalMonthAmount,
          newTotalPayment: payment.totalPayment,
        });
      }

      // Cập nhật attendance với paymentId
      console.log('🔗 Step 7: Linking attendance to payment...');
      console.log('Linking data:', {
        attendanceId: createdAttendance.id,
        paymentId: payment.id,
      });

      const updatedAttendance = await this.prismaService.attendance.update({
        where: { id: createdAttendance.id },
        data: { payment: { connect: { id: payment.id } } },
      });

      console.log('✅ Attendance linked to payment:', {
        attendanceId: updatedAttendance.id,
        paymentId: updatedAttendance.paymentId,
        isAttend: updatedAttendance.isAttend,
      });

      console.log('🎉 === CREATE ATTENDANCE SUCCESS ===');
      console.log('📊 Final result:', {
        attendance: {
          id: updatedAttendance.id,
          isAttend: updatedAttendance.isAttend,
          learningDate: updatedAttendance.learningDate,
          paymentId: updatedAttendance.paymentId,
        },
        payment: {
          id: payment.id,
          totalAttend: payment.totalAttend,
          totalMonthAmount: payment.totalMonthAmount,
          totalPayment: payment.totalPayment,
        },
      });

      return {
        createdAttendance: updatedAttendance,
        payment: payment ?? 'No payment updated',
      };
    } catch (error) {
      console.error('💥 === CREATE ATTENDANCE ERROR ===');
      console.error('📅 Timestamp:', new Date().toISOString());
      console.error('👤 User ID:', user.userId);
      console.error('📋 Input data:', createAttendanceDto);
      console.error('❌ Error type:', error.constructor.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);

      if (error instanceof NotFoundException) {
        console.error('🔍 Not Found Error - Resource not found');
      } else if (error instanceof BadRequestException) {
        console.error('⚠️ Bad Request Error - Invalid input data');
      } else {
        console.error('🚨 Unexpected Error - System error');
      }

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
          totalAttend: payment.totalAttend - 1,
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
          totalAttend: payment.totalAttend + 1,
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
    const { attendances } = updateBatchAttendanceDto;

    try {
      // Lấy tất cả attendance records trước để kiểm tra
      const attendanceIds = attendances.map((a) => a.attendanceId);
      const existingAttendances = await this.prismaService.attendance.findMany({
        where: {
          id: { in: attendanceIds },
        },
        include: {
          session: {
            include: {
              class: true,
            },
          },
          student: true,
        },
      });

      if (existingAttendances.length !== attendanceIds.length) {
        const foundIds = existingAttendances.map((a) => a.id);
        const missingIds = attendanceIds.filter((id) => !foundIds.includes(id));
        throw new NotFoundException(
          `Attendance records not found: ${missingIds.join(', ')}`,
        );
      }

      // Kiểm tra và cập nhật từng điểm danh
      const updatePromises = attendances.map(async (attendance) => {
        const { attendanceId } = attendance;
        const existingAttendance = existingAttendances.find(
          (a) => a.id === attendanceId,
        );

        if (!existingAttendance) {
          throw new NotFoundException(
            `Attendance record not found with id ${attendanceId}`,
          );
        }

        const { studentId } = existingAttendance;

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
          const attendanceMonth =
            existingAttendance.learningDate.getMonth() + 1;
          const attendanceYear = existingAttendance.learningDate.getFullYear();

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
                  totalAttend: { decrement: 1 },
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
                  totalAttend: { increment: 1 },
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

  /**
   * Process batch attendance through queue system
   */
  async processBatchAttendances(
    attendances: CreateAttendance[],
    user: TokenPayload,
  ) {
    try {
      console.log(
        `🚀 Processing batch attendance with ${attendances.length} records`,
      );

      // Process through queue
      const result = await this.queueService.processAttendances(
        attendances,
        user,
      );

      console.log(`✅ Batch processing initiated:`, result);

      return {
        ...result,
        message: `Batch processing initiated for ${attendances.length} attendances`,
      };
    } catch (error) {
      console.error(`❌ Error in batch processing:`, error);
      throw new BadRequestException(
        `Failed to process batch: ${error.message}`,
      );
    }
  }

  /**
   * Get batch status
   */
  async getBatchStatus(batchId: string) {
    try {
      return await this.queueService.getBatchStatus(batchId);
    } catch (error) {
      console.error(`❌ Error getting batch status:`, error);
      throw new BadRequestException(
        `Failed to get batch status: ${error.message}`,
      );
    }
  }
}
