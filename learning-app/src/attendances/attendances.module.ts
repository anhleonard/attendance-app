import { forwardRef, Module } from '@nestjs/common';
import { AttendancesController } from './attendances.controller';
import { AttendancesService } from './attendances.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { QueueModule } from 'src/queue/queue.module';
import { StudentsModule } from 'src/students/students.module';

@Module({
  controllers: [AttendancesController],
  providers: [AttendancesService],
  exports: [AttendancesService],
  imports: [PrismaModule, forwardRef(() => QueueModule), StudentsModule],
})
export class AttendancesModule {}
