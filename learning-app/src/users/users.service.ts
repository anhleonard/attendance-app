import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto, UserType } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { SALT } from 'src/utils/constants';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterUsersDto } from './dto/find-users.dto';
import { Role, Permission, Status } from 'src/utils/enums';
import { generateRandomPassword } from 'src/utils/functions';
import axios from 'axios';
import { MinioService } from 'src/upload/minio.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    try {
      // Check email exists
      const existingUser = await this.prismaService.user.findUnique({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }

      // Handle password based on user type
      let finalPassword = createUserDto.password;
      if (createUserDto.type === UserType.SYSTEM_USER) {
        finalPassword = generateRandomPassword();

        // Send email with generated password
        try {
          await axios.post('http://localhost:5678/webhook/send-mail', {
            to: createUserDto.email,
            subject: 'Attendance Authentication',
            message: `Your account has been created successfully.\n\nYour login credentials are:\nEmail: ${createUserDto.email}\nPassword: ${finalPassword}\n\nPlease change your password after first login.`,
          });
        } catch (emailError) {
          throw new BadRequestException(
            'Failed to send email. Please try again later.',
          );
        }
      } else if (!finalPassword) {
        throw new BadRequestException('Password is required for normal users');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(finalPassword, SALT);

      // Create user
      const user = await this.prismaService.user.create({
        data: {
          email: createUserDto.email,
          fullname: createUserDto.fullname,
          password: hashedPassword,
          role: createUserDto.role || Role.ADMIN,
          permissions: createUserDto.permissions || [],
        },
      });

      // Return user info with generated password for system users
      const { password, ...userWithoutPassword } = user;
      return createUserDto.type === UserType.SYSTEM_USER
        ? { ...userWithoutPassword, generatedPassword: finalPassword }
        : userWithoutPassword;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  async findOne(email: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: {
          email,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateUser(
    updateUserDto: UpdateUserDto,
    avatarFile?: Express.Multer.File,
  ) {
    try {
      // First check if user exists
      const existingUser = await this.prismaService.user.findUnique({
        where: { id: updateUserDto.id },
      });

      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      // Prepare update data, only include fields that are provided
      const updateData: any = {};

      if (updateUserDto.fullname !== undefined) {
        updateData.fullname = updateUserDto.fullname;
      }

      if (updateUserDto.email !== undefined) {
        // Check if new email is already taken by another user
        if (updateUserDto.email !== existingUser.email) {
          const emailExists = await this.prismaService.user.findFirst({
            where: {
              email: updateUserDto.email,
              id: { not: updateUserDto.id },
            },
          });
          if (emailExists) {
            throw new BadRequestException('Email already exists');
          }
          updateData.email = updateUserDto.email;
        }
      }

      // Handle avatar upload if file is provided
      if (avatarFile) {
        const uploadResult = await this.minioService.uploadFile(
          'avatars',
          avatarFile,
        );
        updateData.avatar = uploadResult.url;
      }

      if (updateUserDto.role !== undefined) {
        // Validate role
        if (!Object.values(Role).includes(updateUserDto.role as Role)) {
          throw new BadRequestException('Invalid role');
        }
        updateData.role = updateUserDto.role;

        // If role is ADMIN, clear permissions
        if (updateUserDto.role === Role.ADMIN) {
          updateData.permissions = [];
        }
      }

      // Handle permissions update only if role is not ADMIN
      if (
        updateUserDto.permissions !== undefined &&
        updateUserDto.role !== Role.ADMIN
      ) {
        // Validate permissions
        const invalidPermissions = updateUserDto.permissions.filter(
          (permission) =>
            !Object.values(Permission).includes(permission as Permission),
        );
        if (invalidPermissions.length > 0) {
          throw new BadRequestException(
            `Invalid permissions: ${invalidPermissions.join(', ')}`,
          );
        }
        updateData.permissions = updateUserDto.permissions;
      }

      // Handle locked status update
      if (updateUserDto.locked !== undefined) {
        updateData.locked = updateUserDto.locked;
      }

      // Handle password update
      if (updateUserDto.password !== undefined) {
        updateData.password = await bcrypt.hash(updateUserDto.password, SALT);
      }

      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        return existingUser;
      }

      // Perform the update
      const updatedUser = await this.prismaService.user.update({
        where: { id: updateUserDto.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          fullname: true,
          avatar: true,
          role: true,
          locked: true,
          permissions: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  async findUsers(filterUsersDto: FilterUsersDto) {
    try {
      const {
        page = 1,
        limit = 10,
        fullname,
        role,
        fetchAll,
        status,
      } = filterUsersDto;

      const where = {
        ...(fullname && {
          fullname: {
            contains: fullname,
            mode: 'insensitive' as const,
          },
        }),
        ...(role && { role: role as Role }),
        ...(status && { locked: status === Status.ACTIVE ? false : true }),
      };

      // If fetchAll is true, get all users without pagination
      if (fetchAll) {
        const users = await this.prismaService.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            fullname: true,
            role: true,
            locked: true,
            permissions: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return {
          data: users,
          meta: {
            total: users.length,
            page: 1,
            limit: users.length,
            totalPages: 1,
          },
        };
      }

      // Normal pagination logic
      const skip = (page - 1) * limit;
      const [users, total] = await Promise.all([
        this.prismaService.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            fullname: true,
            role: true,
            locked: true,
            permissions: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prismaService.user.count({ where }),
      ]);

      return {
        data: users,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
