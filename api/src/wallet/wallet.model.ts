import * as mongoose from 'mongoose';
import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsBase64, IsBoolean } from 'class-validator';

export enum WalletTransactionType {
	ORDER_CANCELLED = 'ORDER_CANCELLED',
	ORDER_PAYMENT = 'ORDER_PAYMENT',
	ORDER_MODIFIED = 'ORDER_MODIFIED',
	WALLET_TOPUP = 'WALLET_TOPUP'
}

export const WalletSchema = new mongoose.Schema({
	userId: { type: String },
	amount: { type: Number, default: 0 },
	transactionType: { type: WalletTransactionType },
	description: { type: String },
	isCredited: { type: Boolean, default: true },
	orderId: { type: String },
	orderID: { type: Number }
}, {
	timestamps: true
});

export class WalletSaveDTO {
	userId: string;
	amount: number;
	transactionType?: WalletTransactionType;
	description?: string;
	isCredited?: boolean;
	orderId: string;
	orderID: number;
}

export class WalletDTO {
	@ApiModelProperty()
	amount: number;

	@ApiModelProperty()
	transactionType?: string;

	@ApiModelProperty()
	description: string;

	@ApiModelProperty()
	isCredit: boolean;

	@ApiModelProperty()
	orderId: string;

	@ApiModelProperty()
	orderID: number;

	@ApiModelProperty()
	userId: string;

	@ApiModelProperty()
	createdAt: number;
}

export class ResponseWalletHistory {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: WalletDTO;

	@ApiModelProperty()
	@IsNumber()
	total: number
}

export class WalletTopupDTO {
	@ApiModelProperty()
	@IsNumber()
	amount: number
}

export class WalletTopupResponse {
	@IsString()
	@ApiModelProperty()
	sessionId: string

	@IsString()
	@ApiModelProperty()
	userId: string
}
export class ResponseWalletTopupData {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: WalletTopupResponse;
}
