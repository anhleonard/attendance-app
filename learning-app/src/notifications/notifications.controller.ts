import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TokenPayload } from 'src/auth/token-payload/token-payload.auth';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { FilterNotificationsDto } from './dto/filter-notifications.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/create')
  createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.notificationsService.createNotification(
      createNotificationDto,
      user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('/update')
  updateNotification(
    @Body() updateNotificationDto: UpdateNotificationDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.notificationsService.updateNotification(
      updateNotificationDto,
      user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('/find-notifications')
  findNotifications(@Body() filterNotificationsDto: FilterNotificationsDto) {
    return this.notificationsService.findNotifications(filterNotificationsDto);
  }
}
