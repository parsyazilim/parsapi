import * as mongoose from 'mongoose';
import { IsNotEmpty, IsNumber, IsOptional, Max, Min, IsString } from 'class-validator';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';

export const DeliveryBoyRatingSchema = new mongoose.Schema({
	rate: { type: Number },
	description: { type: String },
	orderId: { type: String },
	userId: { type: String },
	deliveryBoyId: { type: String },
}, {
	timestamps: true
});

export class DeliveryBoyRatingSaveDTO {
	@IsNotEmpty()
	@IsNumber()
	@Min(1)
	@Max(5)
	@ApiModelProperty()
	rate: number;

	@IsOptional()
	@IsString()
	@ApiModelPropertyOptional()
	description?: string;

	@IsString()
	@IsNotEmpty()
	@ApiModelProperty()
	orderId: string;

	@IsString()
	@IsOptional()
	@ApiModelPropertyOptional()
	userId?: string;

	@IsString()
	@IsNotEmpty()
	@ApiModelProperty()
	deliveryBoyId: string
}
