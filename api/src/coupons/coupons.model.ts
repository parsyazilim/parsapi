import * as mongoose from 'mongoose';
import { IsArray, IsDate, IsEmpty, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsUrl, Max, Min, IsString, IsBoolean, IsInt } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export enum CouponType {
	PERCENTAGE = 'PERCENTAGE',
	AMOUNT = 'AMOUNT'
}

export const CouponSchema = new mongoose.Schema({
	couponCode: { type: String },
	description: { type: String },
	offerValue: { type: Number },
	startDate: { type: Number },
	expiryDate: { type: Number },
	couponType: { type: CouponType },
	status: { type: Boolean, default: true }
}, {
	timestamps: true
});

export class CouponsDTO {

	@IsOptional()
	@IsString()
	_id: string;

	@IsNotEmpty()
	@ApiModelProperty()
	@IsString()
	description: string;

	@IsNotEmpty()
	@ApiModelProperty()
	@IsString()
	couponCode: string;

	@IsNotEmpty()
	@ApiModelProperty()
	@IsNumber()
	@IsPositive()
	@Max(100)
	@Min(1)
	offerValue: number;

	@ApiModelProperty()
	startDate: number;

	@IsNumber()
	@IsOptional()
	@ApiModelProperty()
	expiryDate: number;

	@ApiModelProperty({ enum: Object.keys(CouponType) })
	@IsNotEmpty()
	@IsEnum(CouponType, { message: 'Coupon discount type must be one of these ' + Object.keys(CouponType) })
	couponType: string;

	@IsOptional()
	@IsBoolean()
	@ApiModelProperty()
	status: boolean;
}


export class ResponseCouponsDTO {
	@ApiModelProperty()
	_id: string;

	@ApiModelProperty()
	description: string;

	@ApiModelProperty()
	couponCode: string;

	@ApiModelProperty()
	offerValue: number;

	@ApiModelProperty()
	startDate: number;

	@ApiModelProperty()
	expiryDate: number;

	@ApiModelProperty()
	couponType: string;
}

export class CouponStatusDTO {
	@IsNotEmpty()
	@IsBoolean()
	@ApiModelProperty()
	status: boolean;
}

export class CouponCodeDTO {
	@IsNotEmpty()
	@ApiModelProperty()
	@IsString()
	couponCode: string;
}

export class ResponseCouponsList {
	@ApiModelProperty()
	@IsString()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: CouponsDTO;
}

export class ResponseCouponsListData extends ResponseCouponsList {
	@ApiModelProperty()
	total: number
}

export class ResponseCouponsData {
	@ApiModelProperty()
	@IsString()
	response_code: string;

	@ApiModelProperty()
	response_data: ResponseCouponsDTO;
}
