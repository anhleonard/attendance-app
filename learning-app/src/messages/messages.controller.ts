import { Controller, Post, Body, UseGuards, Put } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { FilterMessagesDto } from './dto/filter-messages.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { Role } from '../utils/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/token-payload/token-payload.auth';

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.TA, Role.GUEST)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('create')
  async create(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.messagesService.create(createMessageDto, user.userId);
  }

  @Post('find-messages')
  findMessages(
    @Body() filterMessagesDto: FilterMessagesDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.messagesService.findMessages(filterMessagesDto, user.userId);
  }

  @Post('update')
  async updateMessage(
    @Body() updateMessageDto: UpdateMessageDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.messagesService.updateMessage(updateMessageDto, user.userId);
  }
}
