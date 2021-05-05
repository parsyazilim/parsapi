import * as mongoose from 'mongoose';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsUrl, IsString } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export enum ChatSenyByType {
	USER = 'USER',
	STORE = 'STORE'
}

export const ChatSchema = new mongoose.Schema({
	userId: { type: String },
	userName: { type: String },
	storeId: { type: String },
	message: { type: String },
	sentBy: { type: ChatSenyByType },
}, {
	timestamps: true
});

export class ChatSaveDTO {
	@IsNotEmpty()
	@ApiModelProperty()
	@IsString()
	userId: string;

	@IsNotEmpty()
	@ApiModelProperty()
	@IsString()
	userName: string;

	@ApiModelProperty()
	storeId: string;

	@IsNotEmpty()
	@ApiModelProperty()
	@IsString()
	message: string;

	@IsNotEmpty()
	@ApiModelProperty()
	@IsString()
	sentBy: string;
}

export class ChatDTO extends ChatSaveDTO {
	@ApiModelProperty()
	updatedAt: string;

	@ApiModelProperty()
	sentBy: string;
}