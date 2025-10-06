import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { ClassesModule } from './classes/classes.module';
import { SessionsModule } from './sessions/sessions.module';
import { AttendancesModule } from './attendances/attendances.module';
import { PaymentsModule } from './payments/payments.module';
import { QueueModule } from './queue/queue.module';
import { HistoriesModule } from './histories/histories.module';
import { ChatsModule } from './chats/chats.module';
import { MessagesModule } from './messages/messages.module';
import { UploadModule } from './upload/upload.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BillsModule } from './bills/bills.module';
import { AlsModule } from './common/modules/als.module';
import { AlsMiddleware } from './common/middleware/als.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : '.env.local',
      isGlobal: true,
    }),
    AlsModule,
    UsersModule,
    PrismaModule,
    AuthModule,
    StudentsModule,
    ClassesModule,
    SessionsModule,
    AttendancesModule,
    PaymentsModule,
    QueueModule,
    HistoriesModule,
    ChatsModule,
    MessagesModule,
    UploadModule,
    NotificationsModule,
    BillsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AlsMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
