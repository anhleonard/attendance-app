import { Injectable } from '@nestjs/common';
import { FilterHistoryDto } from './dto/filter-history.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Status } from 'src/utils/enums';

@Injectable()
export class HistoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  async findHistories(filterHistoryDto: FilterHistoryDto) {
    const {
      classId,
      studentName,
      page = 1,
      rowPerPage = 10,
    } = filterHistoryDto;
    const skip = (page - 1) * rowPerPage;

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

    const [students, totalStudents] = await Promise.all([
      this.prismaService.student.findMany({
        where: {
          name: studentName
            ? { contains: studentName, mode: 'insensitive' }
            : undefined,
          id: classId 
            ? { in: currentClassStudents.map(sc => sc.studentId) }
            : undefined,
        },
        select: {
          id: true,
          name: true,
          classes: {
            // Lấy tất cả classes (cả ACTIVE và INACTIVE) để có lịch sử đầy đủ
            select: {
              id: true,
              classId: true,
              createdAt: true,
              updatedAt: true, // Thêm updatedAt để làm endDate
              status: true, // Thêm status để phân biệt
              class: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        skip,
        take: rowPerPage,
      }),
      this.prismaService.student.count({
        where: {
          name: studentName
            ? { contains: studentName, mode: 'insensitive' }
            : undefined,
          id: classId 
            ? { in: currentClassStudents.map(sc => sc.studentId) }
            : undefined,
        },
      }),
    ]);

    // Xử lý dữ liệu
    const studentData = await Promise.all(
      students.map(async (student) => {
        const classes = student.classes;
        const pastClasses = [];
        let currentClass = null;

        // Tìm current class (class ACTIVE cuối cùng)
        const activeClasses = classes.filter(c => c.status === Status.ACTIVE);
        
        if (activeClasses.length > 0) {
          // Có active class - class cuối cùng là current class
          const currentClassEnrollment = activeClasses[activeClasses.length - 1];
          
          // Tính số attendances cho current class
          const currentClassAttendances = await this.prismaService.attendance.count({
            where: {
              studentId: student.id,
              session: { classId: currentClassEnrollment.class.id },
              createdAt: {
                gte: currentClassEnrollment.createdAt,
              },
              isAttend: true,
            },
          });

          currentClass = {
            id: currentClassEnrollment.class.id,
            name: currentClassEnrollment.class.name,
            description: currentClassEnrollment.class.description,
            status: currentClassEnrollment.class.status,
            totalAttendances: currentClassAttendances,
            startDate: currentClassEnrollment.createdAt, // Thời gian bắt đầu học
            endDate: currentClassEnrollment.updatedAt, // Thời gian kết thúc (hoặc hiện tại nếu vẫn đang học)
          };

          // Tất cả classes (cả ACTIVE và INACTIVE) trước current class là past classes
          const currentClassIndex = classes.findIndex(c => c.id === currentClassEnrollment.id);
          
          for (let i = 0; i < currentClassIndex; i++) {
            const studentClass = classes[i];
            const nextClass = classes[i + 1];

            const totalAttendances = await this.prismaService.attendance.count({
              where: {
                studentId: student.id,
                session: { classId: studentClass.class.id },
                createdAt: {
                  gte: studentClass.createdAt,
                  lt: nextClass.createdAt,
                },
                isAttend: true,
              },
            });

            pastClasses.push({
              id: studentClass.class.id,
              name: studentClass.class.name,
              description: studentClass.class.description,
              status: studentClass.status, // Thêm status để biết class này có bị disable không
              totalAttendances,
              startDate: studentClass.createdAt, // Thời gian bắt đầu học
              endDate: studentClass.updatedAt, // Thời gian kết thúc học
            });
          }
        } else {
          // Không có active class - tất cả classes đều là past classes
          for (let i = 0; i < classes.length; i++) {
            const studentClass = classes[i];
            const nextClass = classes[i + 1];

            const totalAttendances = await this.prismaService.attendance.count({
              where: {
                studentId: student.id,
                session: { classId: studentClass.class.id },
                createdAt: {
                  gte: studentClass.createdAt,
                  lt: nextClass ? nextClass.createdAt : new Date(),
                },
                isAttend: true,
              },
            });

            pastClasses.push({
              id: studentClass.class.id,
              name: studentClass.class.name,
              description: studentClass.class.description,
              status: studentClass.status, // Thêm status để biết class này có bị disable không
              totalAttendances,
              startDate: studentClass.createdAt, // Thời gian bắt đầu học
              endDate: studentClass.updatedAt, // Thời gian kết thúc học
            });
          }
        }

        return {
          id: student.id,
          name: student.name,
          currentClass,
          pastClasses,
        };
      }),
    );

    return {
      total: totalStudents,
      data: studentData,
    };
  }
}
