import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JWTService, JwtPayload } from 'libs';
import { MessageService } from './message.service';
import { SendMessageSchemaType } from './dto';

@WebSocketGateway({ cors: true })
export class MessageGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly messageService: MessageService,
    private readonly jwtService: JWTService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth && client.handshake.auth.token) ||
        (client.handshake.query.token as string | undefined);
      if (!token) throw new Error('No token');
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.userId;
      client.join(payload.userId);
      const count = await this.messageService.countUnreadMessages(
        payload.userId,
      );
      client.emit('unread_count', { count });
    } catch (e) {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('send_message')
  async handleSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SendMessageSchemaType,
  ) {
    const senderId = client.data.userId as string;
    const message = await this.messageService.sendMessage(senderId, body);
    this.server.to(body.receiverId).emit('new_message', message);
    client.emit('new_message', message);
    const count = await this.messageService.countUnreadMessages(
      body.receiverId,
    );
    this.server.to(body.receiverId).emit('unread_count', { count });
  }

  @SubscribeMessage('read_messages')
  async handleRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { name: string },
  ) {
    const userId = client.data.userId as string;
    await this.messageService.markMessagesAsRead(data.name, userId);
    const count = await this.messageService.countUnreadMessages(userId);
    client.emit('unread_count', { count });
  }
}
