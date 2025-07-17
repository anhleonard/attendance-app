import {
  Controller,
  Post,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { TokenPayload } from 'src/auth/token-payload/token-payload.auth';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FilterChatsDto } from './dto/filter-chats.dto';
import { UpdateChatDto } from './dto/update-chat.dto';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post('create')
  create(@Body() createChatDto: CreateChatDto) {
    return this.chatsService.create(createChatDto);
  }

  @Post('find')
  findOne(@Body('id', ParseIntPipe) id: number) {
    return this.chatsService.findOne(id);
  }

  @Post('find-chats')
  findUserChats(
    @CurrentUser() user: TokenPayload,
    @Body() filterDto: FilterChatsDto,
  ) {
    return this.chatsService.findUserChats(user.userId, filterDto);
  }

  @Post('update')
  updateChat(
    @Body() updateChatDto: UpdateChatDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.chatsService.updateChat(
      updateChatDto.chatId,
      updateChatDto,
      user.userId,
    );
  }
}
