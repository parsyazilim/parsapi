import {
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { ChatService } from './chat/chat.service';
import { ChatSaveDTO } from './chat/chat.model';

@Injectable()
@WebSocketGateway()
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	constructor(
		private chatService: ChatService
	) { }

	@WebSocketServer() server: Server;
	private logger: Logger = new Logger();

	public handleConnection(client: Socket, ...args): any {
		this.logger.log('CLIENT CONNECTED');
		console.log('Client info', client.id);
	}

	public handleDisconnect(client: Socket): any {
		this.logger.log('CLIENT DISCONNECTED');
		console.log('CLIENT info', client.id);
	}

	afterInit(server: Server): any {
		this.logger.log('WEBSOCKET GATWEAY INITIALIZED');
	}

	// CHAT
	@SubscribeMessage('message-user-to-store')
	public async messageUserToStore(@MessageBody() chatData: ChatSaveDTO) {
		chatData.sentBy = 'USER';
		const res = await this.chatService.saveChat(chatData);
		this.server.emit(`message-store`, chatData);
	}

	@SubscribeMessage('message-store-to-user')
	public async messageStoreToUser(@MessageBody() chatData: ChatSaveDTO) {
		chatData.sentBy = 'STORE';
		const res = await this.chatService.saveChat(chatData);
		this.server.emit(`message-user-${chatData.userId}`, chatData);
		this.server.emit(`message-store`, res);
	}

	public sendOrderStatusNotificationToAdmin(orderData) {
		this.server.emit(`order-status-update`, orderData);
	}

	public newOrderForDeliveryBoy(orderData) {
		this.server.emit(`new-order-delivery-boy-${orderData.deliveryBoyId}`, orderData);
	}

	public sendProductOutOfStocksNotificationToAdmin(productOutOfStockData){
		this.server.emit('products-out-of-stock')
	}
}