import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenPayload } from 'src/auth/token-payload/token-payload.auth';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { FilterNotificationsDto } from './dto/filter-notifications.dto';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async createNotification(
    createNotificationDto: CreateNotificationDto,
    user: TokenPayload,
  ) {
    try {
      const { title, message, receiverIds } = createNotificationDto;

      // Create notification with multiple receivers
      const notification = await this.prisma.notification.create({
        data: {
          title,
          message,
          createdById: user.userId,
          receivers: {
            create: receiverIds.map((receiverId) => ({
              userId: receiverId,
            })),
          },
        },
        include: {
          createdBy: {
            select: {
              id: true,
              fullname: true,
              role: true,
            },
          },
          receivers: {
            include: {
              user: {
                select: {
                  fullname: true,
                },
              },
            },
          },
        },
      });

      // Push notification to each receiver individually with their specific receiver record
      for (const receiver of notification.receivers) {
        const receiverPayload = {
          ...notification,
          receivers: [
            {
              notificationId: receiver.notificationId,
              userId: receiver.userId,
              fullname: receiver.user.fullname,
              isRead: receiver.isRead,
            },
          ],
        };
        this.notificationsGateway.pushToUser(receiver.userId, receiverPayload);
      }

      return notification;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async updateNotification(
    updateNotificationDto: UpdateNotificationDto,
    user: TokenPayload,
  ) {
    try {
      const { id, isRead, title, message } = updateNotificationDto;

      // Check if notification exists and user has permission to update it
      const existingNotification = await this.prisma.notification.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: {
              id: true,
              fullname: true,
              role: true,
            },
          },
          receivers: {
            include: {
              user: {
                select: {
                  fullname: true,
                },
              },
            },
          },
        },
      });

      if (!existingNotification) {
        throw new BadRequestException('Notification not found');
      }

      // Find the receiver record for this user
      const receiverRecord = existingNotification.receivers.find(
        (receiver) => receiver.userId === user.userId,
      );

      // Only allow receiver or creator to update the notification
      if (!receiverRecord && existingNotification.createdById !== user.userId) {
        throw new BadRequestException(
          'You do not have permission to update this notification',
        );
      }

      // If user is a receiver, update their read status
      if (receiverRecord) {
        await this.prisma.notificationReceiver.update({
          where: { id: receiverRecord.id },
          data: { isRead },
        });
      }

      // If user is the creator, update title and message
      if (existingNotification.createdById === user.userId) {
        await this.prisma.notification.update({
          where: { id },
          data: {
            ...(title && { title }),
            ...(message && { message }),
          },
        });
      }

      // Get updated notification with the same format
      const updatedNotification = await this.prisma.notification.findUnique({
        where: { id },
        include: {
          createdBy: {
            select: {
              id: true,
              fullname: true,
              role: true,
            },
          },
          receivers: {
            include: {
              user: {
                select: {
                  fullname: true,
                },
              },
            },
          },
        },
      });

      // Transform the response to match the notification payload format
      return {
        ...updatedNotification,
        receivers: updatedNotification.receivers.map((receiver) => ({
          notificationId: receiver.notificationId,
          userId: receiver.userId,
          fullname: receiver.user.fullname,
          isRead: receiver.isRead,
        })),
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findNotifications(filterNotificationsDto: FilterNotificationsDto) {
    try {
      const { title, isRead, userId, createdById, page, limit } =
        filterNotificationsDto;

      const where = {
        title: title
          ? {
              contains: title,
            }
          : undefined,
        ...(createdById && { createdById }),
        receivers: userId
          ? {
              some: {
                userId,
                ...(isRead !== undefined ? { isRead } : {}),
              },
            }
          : undefined,
      };

      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          include: {
            createdBy: {
              select: {
                id: true,
                fullname: true,
                role: true,
              },
            },
            receivers: userId
              ? {
                  where: {
                    userId: userId,
                  },
                  include: {
                    user: {
                      select: {
                        fullname: true,
                      },
                    },
                  },
                }
              : {
                  include: {
                    user: {
                      select: {
                        fullname: true,
                      },
                    },
                  },
                },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.notification.count({ where }),
      ]);

      // Transform the response to match the notification payload format
      const data = notifications.map((notification) => ({
        ...notification,
        receivers: notification.receivers.map((receiver) => ({
          notificationId: receiver.notificationId,
          userId: receiver.userId,
          fullname: receiver.user.fullname,
          isRead: receiver.isRead,
        })),
      }));

      return {
        total,
        data,
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
