import * as mongoose from 'mongoose';
import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsBase64, IsBoolean } from 'class-validator';

export enum SubscriptionSchedule {
	DAILY = 'DAILY',
	ALTERNATE = 'ALTERNATE',
	EVERY_3_DAY = 'EVERY_3_DAY',
	WEEKLY = 'WEEKLY',
	MONTHLY = 'MONTHLY'
}

export enum SubscriptionPaymentType {
	PREPAID = 'PREPAID',
	DAILY = 'DAILY'
}

export enum SubscriptionStatus {
	ACTIVE = 'ACTIVE',
	PAUSE = 'PAUSE',
	CANCELLED = 'CANCELLED'
}

const Product = {
	productId: { type: String },
	productName: { type: String },
	variantId: { type: String },
	productDescription: { type: String },
	unit: { type: String },
	quantity: { type: Number },
	productTotal: { type: Number },
	imageUrl: { type: String },
	filePath: { type: String },
	productImages: { type: Array },
	categoryId: { type: String },
	subCategoryId: { type: String },
	subScriptionAmount: { type: Number },
	subscriptionTotal: { type: Number },
}

export const SubscriptionSchema = new mongoose.Schema({
	userId: { type: String },
	products: [Product],
	status: { type: SubscriptionStatus },
	subscriptionStartDate: { type: Date },
	subscriptionEndDate: { type: Date },
	pauseStartDate: { type: Date },
	pauseEndDate: { type: Date },
	schedule: { type: SubscriptionSchedule },
	paymentType: { type: SubscriptionPaymentType },
	address: { type: Object },
	subscriptionTodayStatus: {type : String},
	orderFrom: {type : String},
}, {
	timestamps: true
});


export class SubscriptionUpdateDTO {
	@ApiModelProperty()
	quantity?: number;

	@ApiModelProperty()
	address?: string;

	@ApiModelProperty()
	schedule?: string;
}

export class SubscriptionPauseUpdateDTO {
	@ApiModelProperty()
	pauseStartDate?: string;

	@ApiModelProperty()
	pauseEndDate?: string;

	@ApiModelProperty()
	status?: string;
}


