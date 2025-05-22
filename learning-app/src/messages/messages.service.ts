import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { FilterMessagesDto } from './dto/filter-messages.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { ChatsService } from '../chats/chats.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private chatsService: ChatsService,
  ) {}

  async create(createMessageDto: CreateMessageDto, userId: number) {
    let chatId = createMessageDto.chatId;

    // If no chatId is provided, create a new chat
    if (!chatId) {
      const newChat = await this.chatsService.create({
        title: 'New Chat',
        userId: userId,
      });
      chatId = newChat.id;
    } else {
      // Update chat timestamp if using existing chat
      await this.chatsService.updateChatTimestamp(chatId);
    }

    // Create the message with userId
    return this.prisma.message.create({
      data: {
        content: createMessageDto.content,
        sender: createMessageDto.sender,
        chatId: chatId,
        userId: userId,
      },
      include: {
        chat: true,
        user: true,
      },
    });
  }

  async findMessages(filterMessagesDto: FilterMessagesDto, userId: number) {
    const { chatId, fetchAll = false, page = 1, limit = 10, isSaved } = filterMessagesDto;
    
    const baseQuery = {
      where: { 
        ...(chatId !== undefined && { chatId }), // Only add chatId if provided
        userId, // Only get messages of current user
        ...(isSaved !== undefined && { isSaved }), // Add isSaved filter if provided
      },
      orderBy: {
        createdAt: Prisma.SortOrder.asc,
      },
    };

    const queryOptions = fetchAll 
      ? baseQuery 
      : {
          ...baseQuery,
          skip: (page - 1) * limit,
          take: limit,
        };

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany(queryOptions),
      this.prisma.message.count({
        where: { 
          ...(chatId !== undefined && { chatId }), // Only add chatId if provided
          userId, // Count only messages of current user
          ...(isSaved !== undefined && { isSaved }),
        },
      }),
    ]);

    return {
      data: messages,
      ...(fetchAll ? {} : {
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        }
      }),
    };
  }

  async updateMessage(updateMessageDto: UpdateMessageDto, userId: number) {
    const { messageId, isSaved } = updateMessageDto;

    // Find the message first
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        user: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is the owner of the message
    if (message.userId !== userId) {
      throw new ForbiddenException('You can only update your own messages');
    }

    // Update only isSaved field
    return this.prisma.message.update({
      where: { id: messageId },
      data: { isSaved },
    });
  }
}
