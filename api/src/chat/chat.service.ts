import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UtilService } from '../utils/util.service';
import { ChatSaveDTO, ChatDTO } from './chat.model';

@Injectable()
export class ChatService {
	constructor(
		@InjectModel('Chat') private readonly chatModel: Model<any>,
		private utilService: UtilService
	) {

	}
	// ************************USER*******************

	public async getAllUserChat(userId: string, page: number, limit: number): Promise<Array<any>> {
		const skip = (page)* limit;
		const chats = await this.chatModel.find({ userId: userId }, 'userId message sentBy updatedAt').limit(limit).sort({ createdAt: 1 });
		return chats;
	}

	public async getAllChatGroup(page: number, limit: number): Promise<Array<any>> {
		const filter = [
			{
				$group: {
					"updatedAt": { $last: "$updatedAt" },
					"_id": "$userId",
					"lastMessage": { $last: "$message" },
					"userName": { $last: "$userName" },
				}
			},
			{ "$sort": { "createdAt": 1 }},
			{ "$limit": limit },
			{ "$skip": (page - 1) * limit },

		];
		
		const chats = await this.chatModel.aggregate(filter);
		return chats;
	}

	public async saveChat(chatData: ChatSaveDTO): Promise<ChatDTO> {
		const chat = await this.chatModel.create(chatData);
		return chat;
	}
}
