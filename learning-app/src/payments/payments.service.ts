import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentStatus } from 'src/utils/enums';
import { FilterPaymentDto } from './dto/filter-payment.dto';
import { Prisma } from '@prisma/client';
import { FindDetailPaymentDto } from './dto/find-detail-payment.dto';
import { AttendancesService } from 'src/attendances/attendances.service';
import { FilterAttendanceDto } from 'src/attendances/dto/filter-attendance.dto';
import { Status } from 'src/utils/enums';
import { UpdateBatchPaymentsDto } from './dto/update-batch-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly attendancesService: AttendancesService,
  ) {}

  async updatePayment(updatePaymentDto: UpdatePaymentDto) {
    try {
      const { paymentId, status, paidAmount, paymentNote } = updatePaymentDto;

      const foundPayment = await this.prismaService.payment.findFirst({
        where: {
          id: paymentId,
        },
      });

      if (!foundPayment) {
        throw new NotFoundException('Payment not found');
      }

      switch (status) {
        case PaymentStatus.SENT:
          return await this.prismaService.payment.update({
            where: {
              id: paymentId,
            },
            data: {
              status: PaymentStatus.SENT,
              sentAt: new Date(),
              ...(paymentNote && {
                paymentNote: paymentNote,
              }),
            },
          });
        case PaymentStatus.PAYING:
          // If paidAmount is provided, it represents the total amount paid
          // (not incremental as the frontend sends the total new amount)
          const newPaidAmount = paidAmount || 0;
          const remainingDebt = foundPayment.totalPayment - newPaidAmount;

          // Determine status based on payment completion
          const finalStatus =
            remainingDebt <= 0 ? PaymentStatus.DONE : PaymentStatus.PAYING;

          return await this.prismaService.payment.update({
            where: {
              id: paymentId,
            },
            data: {
              status: finalStatus,
              paidPayment: newPaidAmount,
            },
          });
        case PaymentStatus.DONE:
          // Handle case where frontend directly sends DONE status
          // This means the payment is fully completed
          return await this.prismaService.payment.update({
            where: {
              id: paymentId,
            },
            data: {
              status: PaymentStatus.DONE,
              paidPayment: paidAmount || foundPayment.totalPayment,
            },
          });
        default:
          throw new BadRequestException(`Invalid payment status: ${status}`);
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findPayments(filterPaymentDto: FilterPaymentDto) {
    try {
      const {
        name,
        page = 1,
        rowPerPage = 10,
        fetchAll = false,
        classId,
        learningMonth,
        learningYear,
        status,
      } = filterPaymentDto;

      if (!learningMonth || !learningYear) {
        throw new BadRequestException('Learning month and year are required');
      }

      // If fetchAll is true, ignore pagination
      const skip = fetchAll ? 0 : (page - 1) * rowPerPage;
      const take = fetchAll ? undefined : rowPerPage;

      // Lấy danh sách học sinh có current class là classId được chọn
      const currentClassStudents = classId
        ? await this.prismaService.studentClass.findMany({
            where: {
              classId: classId,
              status: Status.ACTIVE,
            },
            select: {
              studentId: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            distinct: ['studentId'],
          })
        : [];

      const where: Prisma.PaymentWhereInput = {
        student: {
          name: name ? { contains: name, mode: 'insensitive' } : undefined,
          id: classId
            ? { in: currentClassStudents.map((sc) => sc.studentId) }
            : undefined,
        },
        status: status || undefined,
        createdAt: {
          gte: new Date(learningYear, learningMonth - 1, 1),
          lt: new Date(learningYear, learningMonth, 1),
        },
      };

      const [payments, total] = await Promise.all([
        this.prismaService.payment.findMany({
          where,
          take,
          skip,
          include: {
            student: {
              select: {
                id: true,
                name: true,
                debt: true,
                classes: {
                  where: {
                    status: Status.ACTIVE,
                  },
                  select: {
                    class: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                    createdAt: true,
                  },
                  orderBy: {
                    createdAt: 'desc',
                  },
                  take: 1,
                },
              },
            },
            attendances: {
              include: {
                session: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prismaService.payment.count({ where }),
      ]);

      // Transform the data to include attendance statistics and current class
      const transformedPayments = payments.map((payment) => ({
        ...payment,
        student: {
          ...payment.student,
          currentClass: payment.student.classes[0]?.class || null,
        },
        attendanceStats: {
          total: payment.attendances.length,
          attended: payment.attendances.filter((a) => a.isAttend).length,
          absent: payment.attendances.filter((a) => !a.isAttend).length,
        },
      }));

      // Remove the classes array from student object since we only need currentClass
      transformedPayments.forEach((payment) => {
        delete payment.student.classes;
      });

      return {
        total,
        data: transformedPayments,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findDetailPayment(findDetailPaymentDto: FindDetailPaymentDto) {
    try {
      const { paymentId, learningMonth, learningYear } = findDetailPaymentDto;
      const foundPayment = await this.prismaService.payment.findFirst({
        where: {
          id: paymentId,
        },
      });

      if (learningMonth && learningYear) {
        const filters = {
          paymentId,
          isAttend: true,
          learningMonth,
          learningYear,
        };
        const foundAttendances = await this.attendancesService.findAttendances(
          filters as FilterAttendanceDto,
        );
        return {
          ...foundPayment,
          attendances: foundAttendances,
        };
      } else return foundPayment;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateBatchPayments(updateBatchPaymentsDto: UpdateBatchPaymentsDto) {
    try {
      const {
        isSelectedAll,
        unselectedPaymentIds,
        selectedPaymentIds,
        status,
        filter,
      } = updateBatchPaymentsDto;

      let paymentIdsToUpdate: number[] = [];

      if (isSelectedAll) {
        // Apply the same filter logic as findPayments method
        if (!filter?.learningMonth || !filter?.learningYear) {
          throw new BadRequestException(
            'Learning month and year are required in filter',
          );
        }

        // Get current class students if classId is provided
        const currentClassStudents = filter.classId
          ? await this.prismaService.studentClass.findMany({
              where: {
                classId: filter.classId,
                status: Status.ACTIVE,
              },
              select: {
                studentId: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              distinct: ['studentId'],
            })
          : [];

        const where: Prisma.PaymentWhereInput = {
          student: {
            name: filter.name
              ? { contains: filter.name, mode: 'insensitive' }
              : undefined,
            id: filter.classId
              ? { in: currentClassStudents.map((sc) => sc.studentId) }
              : undefined,
          },
          status: filter.status || undefined,
          createdAt: {
            gte: new Date(filter.learningYear, filter.learningMonth - 1, 1),
            lt: new Date(filter.learningYear, filter.learningMonth, 1),
          },
        };

        // Fetch all payments matching the filter criteria
        const allPayments = await this.prismaService.payment.findMany({
          where,
          select: { id: true },
        });

        const allPaymentIds = allPayments.map((payment) => payment.id);

        if (unselectedPaymentIds && unselectedPaymentIds.length > 0) {
          // Filter bỏ các IDs bị unselected
          paymentIdsToUpdate = allPaymentIds.filter(
            (id) => !unselectedPaymentIds.includes(id),
          );
        } else {
          // Nếu không có unselectedPaymentIds, lấy tất cả
          paymentIdsToUpdate = allPaymentIds;
        }
      } else {
        // Nếu không chọn tất cả, chỉ update các selected IDs
        if (selectedPaymentIds && selectedPaymentIds.length > 0) {
          paymentIdsToUpdate = selectedPaymentIds;
        } else {
          throw new BadRequestException('No payment IDs selected for update');
        }
      }

      if (paymentIdsToUpdate.length === 0) {
        throw new BadRequestException('No payments to update');
      }

      // Xử lý update dựa trên status
      if (status === PaymentStatus.SENT) {
        // Chỉ update status và sentAt
        const result = await this.prismaService.payment.updateMany({
          where: { id: { in: paymentIdsToUpdate } },
          data: {
            status: PaymentStatus.SENT,
            sentAt: new Date(),
            updatedAt: new Date(),
          },
        });

        return {
          message: `Successfully sent ${result.count} payments`,
          updatedCount: result.count,
        };
      } else if (status === PaymentStatus.DONE) {
        // Update status thành DONE và set paidPayment = totalPayment
        const payments = await this.prismaService.payment.findMany({
          where: { id: { in: paymentIdsToUpdate } },
          select: { id: true, totalPayment: true },
        });

        const updatePromises = payments.map((payment) =>
          this.prismaService.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.DONE,
              paidPayment: payment.totalPayment, // Đã trả đủ tiền học
              updatedAt: new Date(),
            },
          }),
        );

        const updatedPayments = await Promise.all(updatePromises);

        return {
          message: `Successfully completed ${updatedPayments.length} payments`,
          data: updatedPayments,
        };
      } else {
        throw new BadRequestException(
          'Invalid status. Only SENT and DONE are allowed for batch updates',
        );
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
