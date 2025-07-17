import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { FilterChatsDto } from './dto/filter-chats.dto';
import { UpdateChatDto } from './dto/update-chat.dto';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  async create(createChatDto: CreateChatDto) {
    return this.prisma.chat.create({
      data: {
        title: createChatDto.title,
        userId: createChatDto.userId,
      },
      include: {
        messages: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.chat.findUnique({
      where: { id },
      include: {
        messages: true,
      },
    });
  }

  async findUserChats(userId: number, filterDto: FilterChatsDto) {
    const { page = 1, rowPerPage = 10 } = filterDto;
    const skip = (page - 1) * rowPerPage;

    const [chats, total] = await Promise.all([
      this.prisma.chat.findMany({
        where: {
          userId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: rowPerPage,
      }),
      this.prisma.chat.count({
        where: {
          userId,
        },
      }),
    ]);

    return {
      data: chats,
      total,
      page,
      rowPerPage,
      totalPages: Math.ceil(total / rowPerPage),
    };
  }

  async updateChat(id: number, updateChatDto: UpdateChatDto, userId: number) {
    // First check if chat exists and belongs to user
    const chat = await this.prisma.chat.findUnique({
      where: { id },
    });

    if (!chat) {
      throw new ForbiddenException('Chat not found');
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this chat',
      );
    }

    // Update chat title
    return this.prisma.chat.update({
      where: { id },
      data: {
        title: updateChatDto.title,
      },
    });
  }

  async updateChatTimestamp(chatId: number) {
    return this.prisma.chat.update({
      where: { id: chatId },
      data: {
        updatedAt: new Date(),
      },
    });
  }
}
