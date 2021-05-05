import * as mongoose from 'mongoose';
import { ApiModelProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsBase64, IsBoolean } from 'class-validator';

export const SubscriptionStatusSchema = new mongoose.Schema({
	userId: { type: String },
	status: { type: String },
	description: { type: String},
    subscriptionId: { type: String},
	orderID: { type: Number}
}, {
	timestamps: true
});


export class SubscriptionDTO {
	@ApiModelProperty()
	userId: string;

	@ApiModelProperty()
	status?: string;

	@ApiModelProperty()
	description?: string;

    @ApiModelProperty()
	subscriptionId?: string;

	orderID?:number
}

export class ResponseSubscriptionHistory {
	@ApiModelProperty()
	response_code: number;

	@ApiModelProperty({ isArray: true })
	response_data: SubscriptionDTO;

	@ApiModelProperty()
	@IsNumber()
	total: number
}

