import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
  imports: [PrismaModule, NotificationsModule],
})
export class StudentsModule {}
