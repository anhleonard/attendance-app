import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenPayload } from 'src/auth/token-payload/token-payload.auth';
import { UpdateStudentDto } from './dto/update-student.dto';
import { FilterStudentDto } from './dto/filter-student.dto';
import { Prisma } from '@prisma/client';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // find the number of students
  async findStudents(filterStudentDto: FilterStudentDto) {
    const {
      name,
      status,
      page = 1,
      rowPerPage = 10,
      classId,
      studentClassStatus, // status of student in class
    } = filterStudentDto;
    try {
      const whereCondition: Prisma.StudentWhereInput = {
        name: name
          ? ({ contains: name, mode: 'insensitive' } as Prisma.StringFilter)
          : undefined,
        ...(status && { status }),
        // Nếu có classId và status là ACTIVE, chỉ lấy học sinh đang học trong lớp đó
        ...(classId && studentClassStatus
          ? {
              classes: {
                some: {
                  classId,
                  status: studentClassStatus,
                },
              },
            }
          : classId
            ? {
                classes: {
                  some: {
                    classId,
                  },
                },
              }
            : {}),
      };

      const [data, total] = await Promise.all([
        this.prismaService.student.findMany({
          where: whereCondition,
          skip: (page - 1) * rowPerPage,
          take: rowPerPage,
          include: {
            classes: {
              where:
                classId && status === 'ACTIVE'
                  ? { classId, status: 'ACTIVE' }
                  : { status: 'ACTIVE' },
              include: {
                class: true,
              },
            },
          },
        }),
        this.prismaService.student.count({
          where: whereCondition,
        }),
      ]);

      return {
        total,
        data,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // find the number of students
  async findStudent(id: number) {
    try {
      const student = await this.prismaService.student.findUnique({
        where: {
          id,
        },
      });
      if (!student) {
        throw new NotFoundException('Student not found');
      }
      return student;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createStudent(createStudentDto: CreateStudentDto, user: TokenPayload) {
    try {
      const { classId, ...rest } = createStudentDto;

      // Check xem lớp đã có chưa
      const existingClass = await this.prismaService.class.findUnique({
        where: { id: classId },
      });

      if (!existingClass) {
        throw new BadRequestException('Class does not exist');
      }

      // Check xem tên hs đã có trong lớp đó chưa
      const existingStudentClass =
        await this.prismaService.studentClass.findFirst({
          where: {
            classId,
            student: {
              name: rest.name,
            },
            status: 'ACTIVE',
          },
        });

      if (existingStudentClass) {
        throw new BadRequestException('Student name already exists');
      }

      // Tạo học sinh
      const createdStudent = await this.prismaService.student.create({
        data: {
          ...rest,
          createdBy: { connect: { id: user.userId } },
        },
      });

      // Assign hs vào class
      const assignedStudent = await this.prismaService.studentClass.create({
        data: {
          studentId: createdStudent.id,
          classId,
          status: 'ACTIVE',
        },
        include: {
          class: true,
        },
      });

      // Send notification to all admin users except current admin
      const adminUsers = await this.prismaService.user.findMany({
        where: {
          role: 'ADMIN',
          NOT: {
            id: user.userId, // Exclude current admin user
          },
        },
        select: {
          id: true,
        },
      });
      const adminIds = adminUsers.map((user) => user.id);
      if (adminIds.length > 0) {
        await this.notificationsService.createNotification(
          {
            title: `Student "${createdStudent.name}" has been created`,
            message: `Student "${createdStudent.name}" has been created and assigned to class: ${assignedStudent.class.name}\n\n📝 Student details:\n\n\t\t🎓 Name: ${createdStudent.name}\n\n\t\t👥 Parent: ${createdStudent.parent || '--'}\n\n\t\t🎂 Date of birth: ${createdStudent.dob.toLocaleDateString() || '--'}\n\n\t\t📱 Phone: ${createdStudent.phoneNumber || '--'}\n\n\t\t📱 Second phone: ${createdStudent.secondPhoneNumber || '--'}`,
            receiverIds: adminIds,
          },
          user,
        );
      }

      return {
        createdStudent,
        classId: assignedStudent.classId,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateStudent(updateStudentDto: UpdateStudentDto, user: TokenPayload) {
    try {
      const { id: studentId, classId, status, ...rest } = updateStudentDto;

      // Kiểm tra xem student có tồn tại hay không
      const existingStudent = await this.prismaService.student.findUnique({
        where: { id: studentId },
        include: {
          classes: {
            where: { status: 'ACTIVE' },
          },
        },
      });

      if (!existingStudent) {
        throw new BadRequestException('Student does not exist');
      }

      const targetClassId = classId || existingStudent.classes[0]?.classId;

      // Nếu có classId được truyền vào, kiểm tra xem lớp có tồn tại không
      if (classId) {
        const existingClass = await this.prismaService.class.findUnique({
          where: { id: classId },
        });

        if (!existingClass) {
          throw new BadRequestException('Class does not exist');
        }
      }

      // Chỉ kiểm tra tên trùng lặp nếu có thay đổi tên
      if (rest.name && rest.name !== existingStudent.name && targetClassId) {
        const existingStudentClass =
          await this.prismaService.studentClass.findFirst({
            where: {
              classId: targetClassId,
              student: {
                name: rest.name,
                NOT: { id: studentId },
              },
              status: 'ACTIVE',
            },
          });

        if (existingStudentClass) {
          throw new BadRequestException(
            'Student name already exists in this class',
          );
        }
      }

      // Cập nhật thông tin học sinh
      const updatedStudent = await this.prismaService.student.update({
        where: { id: studentId },
        data: {
          ...rest,
          status: status || existingStudent.status,
          updatedById: user.userId,
        },
      });

      // Nếu học sinh đổi lớp, cập nhật bảng StudentClass
      if (classId && classId !== existingStudent.classes[0]?.classId) {
        // Đánh dấu lớp cũ là INACTIVE
        await this.prismaService.studentClass.updateMany({
          where: { studentId, status: 'ACTIVE' },
          data: { status: 'INACTIVE' },
        });

        // Gán học sinh vào lớp mới
        await this.prismaService.studentClass.create({
          data: {
            studentId,
            classId,
            status: 'ACTIVE',
          },
        });
      }

      // Nếu status của học sinh là INACTIVE, cập nhật tất cả các lớp của học sinh đó thành INACTIVE
      if (status === 'INACTIVE') {
        await this.prismaService.studentClass.updateMany({
          where: { studentId, status: 'ACTIVE' },
          data: { status: 'INACTIVE' },
        });
      }

      return {
        updatedStudent,
        assignedClassId: classId,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async assignStudentToClass(studentId: number, classId: number) {
    await this.prismaService.studentClass.create({
      data: {
        studentId,
        classId,
        status: 'ACTIVE',
      },
    });
  }
}
