import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { FilterMessagesDto } from './dto/filter-messages.dto';
import { ChatsService } from '../chats/chats.service';

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

  async findMessages(filterMessagesDto: FilterMessagesDto) {
    const { chatId, page = 1, limit = 10 } = filterMessagesDto;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { chatId },
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          user: true,
        },
        skip,
        take: limit,
      }),
      this.prisma.message.count({
        where: { chatId },
      }),
    ]);

    return {
      data: messages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async historyMessages(filterMessagesDto: FilterMessagesDto) {
    const { chatId, page = 1, limit = 20 } = filterMessagesDto;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { chatId },
        orderBy: {
          createdAt: 'asc',
        },
        skip,
        take: limit,
      }),
      this.prisma.message.count({
        where: { chatId },
      }),
    ]);

    // Format messages into table format with role and content
    const formattedMessages = messages.map(message => ({
      role: message.sender,
      content: message.content
    }));

    return {
      data: formattedMessages,
    };
  }
}
