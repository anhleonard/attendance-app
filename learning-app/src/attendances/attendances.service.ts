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

      const foundSession = await this.prismaService.session.findFirst({
        where: {
          id: sessionId,
        },
        include: {
          class: true,
        },
      });

      if (!foundSession || !foundSession.class) {
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

      if (!studentClass) {
        throw new BadRequestException(
          'The student does not belong to this class',
        );
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

      // TASK: update payment based on attendance //
      const { isAttend } = createdAttendance;

      // Nếu học sinh không tham gia, không cập nhật payment
      if (!isAttend) return createdAttendance;

      // Xác định tháng và năm của buổi học từ learningDate
      const attendanceMonth = learningDate.getMonth() + 1;
      const attendanceYear = learningDate.getFullYear();

      // Lấy Payment hiện tại của tháng
      let payment = await this.prismaService.payment.findFirst({
        where: {
          studentId,
          createdAt: {
            gte: new Date(attendanceYear, attendanceMonth - 1, 1), // Ngày đầu tháng
            lt: new Date(attendanceYear, attendanceMonth, 1), // Ngày đầu tháng sau
          },
        },
      });

      if (!payment) {
        // Nếu chưa có Payment, tạo mới
        payment = await this.prismaService.payment.create({
          data: {
            totalSessions: 1,
            totalMonthAmount: foundSession.amount,
            totalPayment: foundSession.amount + studentClass.student.debt,
            status: 'SAVED',
            student: { connect: { id: studentId } },
          },
        });
      } else {
        // Nếu đã có Payment, chỉ cộng thêm buổi học mới và số tiền mới
        payment = await this.prismaService.payment.update({
          where: { id: payment.id },
          data: {
            totalSessions: { increment: 1 }, // Cộng thêm 1 buổi học
            totalMonthAmount: { increment: foundSession.amount }, // Cộng thêm tiền buổi học mới
            totalPayment: {
              increment: foundSession.amount, // Cộng dồn vào tổng tiền cần thanh toán, chỗ này do cộng dồn với payment nên không có debt ở đây
            },
          },
        });
      }

      // Cập nhật attendance với paymentId
      await this.prismaService.attendance.update({
        where: { id: createdAttendance.id },
        data: { payment: { connect: { id: payment.id } } },
      });

      return {
        createdAttendance,
        payment: payment ?? 'No payment updated',
      };
    } catch (error) {
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

    if (rest.isAttend === foundAttendance.isAttend) {
      return rest.noteAttendance !== foundAttendance.noteAttendance
        ? await this.prismaService.attendance.update({
            where: { id: attendanceId },
            data: {
              noteAttendance: rest.noteAttendance,
              updatedBy: { connect: { id: user.userId } },
            },
          })
        : {
            message: 'Nothing to update',
          };
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
        orderBy: {
          learningDate: 'desc',
        },
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
            where: { status: 'ACTIVE' },
          },
        },
      });

      if (!foundClass) {
        throw new NotFoundException('Class not found');
      }

      // Lấy danh sách học sinh đang học trong lớp
      const activeStudents = await this.prismaService.studentClass.findMany({
        where: {
          classId,
          status: 'ACTIVE',
        },
        include: {
          student: true,
        },
      });

      const activeStudentIds = new Set(
        activeStudents.map((sc) => sc.studentId),
      );

      // Kiểm tra và cập nhật từng điểm danh
      const updatePromises = attendances.map(async (attendance) => {
        const { studentId, sessionId, attendanceId } = attendance;

        // Kiểm tra học sinh có thuộc lớp không
        if (!activeStudentIds.has(studentId)) {
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
