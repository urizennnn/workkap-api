import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JWTService } from 'src/libs';
import { MessageService } from './message.service';
import { SendMessageSchemaType } from './dto';

interface GatewaySocket extends Socket {
  data: {
    userId?: string;
  };
}

@WebSocketGateway({ cors: true })
export class MessageGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly messageService: MessageService,
    private readonly jwtService: JWTService,
  ) {}

  async handleConnection(client: GatewaySocket) {
    try {
      const token =
        typeof client.handshake.auth?.token === 'string'
          ? client.handshake.auth.token
          : typeof client.handshake.query.token === 'string'
            ? client.handshake.query.token
            : undefined;
      if (!token) throw new Error('No token');
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.userId;
      void client.join(payload.userId);
      const count = await this.messageService.countUnreadMessages(
        payload.userId,
      );
      this.server.to(payload.userId).emit('unread_count', { count });
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('send_message')
  async handleSend(
    @ConnectedSocket() client: GatewaySocket,
    @MessageBody() body: SendMessageSchemaType,
  ) {
    const senderId = client.data.userId!;
    const message = await this.messageService.sendMessage(senderId, body);
    this.server.to(message.receiverId).emit('new_message', message);
    this.server.to(senderId).emit('new_message', message);
    const count = await this.messageService.countUnreadMessages(
      message.receiverId,
    );
    this.server.to(message.receiverId).emit('unread_count', { count });
  }

  @SubscribeMessage('read_messages')
  async handleRead(
    @ConnectedSocket() client: GatewaySocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId!;
    await this.messageService.markMessagesAsReadForConversation(
      data.conversationId,
      userId,
    );
    const count = await this.messageService.countUnreadMessages(userId);
    this.server.to(userId).emit('unread_count', { count });
  }
}
