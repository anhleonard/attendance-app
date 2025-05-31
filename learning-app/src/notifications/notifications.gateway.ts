import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NEW_NOTIFICATION } from 'src/utils/constants';
import { NotificationPayload } from 'src/utils/interfaces';

@WebSocketGateway({
  cors: true,
  namespace: 'notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // Client will join their room after authentication through a message
    console.log(`✅ New socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`👋 Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, userId: number) {
    client.join(`user-${userId}`);
    console.log(`✅ User ${userId} joined notifications room`);
  }

  /**
   * Push a notification to a specific user
   * @param receiverId - The ID of the user to send the notification to
   * @param payload - The notification payload containing title and message
   */
  pushToUser(receiverId: number, payload: NotificationPayload) {
    this.server.to(`user-${receiverId}`).emit(NEW_NOTIFICATION, payload);
  }

  /**
   * Push a notification to multiple users
   * @param receiverIds - Array of user IDs to send the notification to
   * @param payload - The notification payload containing title and message
   */
  pushToUsers(receiverIds: number[], payload: NotificationPayload) {
    receiverIds.forEach((receiverId) => {
      this.pushToUser(receiverId, payload);
    });
  }
}
