import * as mongoose from 'mongoose';
import { IsArray, IsDate, IsEmpty, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsUrl, Max, Min, IsString, IsBoolean } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export enum DealType {
	CATEGORY = 'CATEGORY',
	PRODUCT = 'PRODUCT'
}

export const DealSchema = new mongoose.Schema({
	title: { type: String },
	description: { type: String },
	dealPercent: { type: Number },
	categoryId: { type: String },
	categoryName: { type: String },
	productId: { type: String },
	productName: { type: String },
	dealType: { type: DealType },
	imageUrl: { type: String, required: true },
	imageId: { type: String, required: true },
	filePath: { type: String },
	topDeal: { type: Boolean, default: false },
	status: { type: Boolean, default: true },
	products: [{
		productId: { type: String },
		productName: { type: String },
	}]
}, {
	timestamps: true
});

export class ProductsDTO {

	@IsOptional()
	@IsString()
	@ApiModelProperty()
	productId: string;

	@IsOptional()
	@IsString()
	@ApiModelProperty()
	productName: string;

}

export class DealSaveDTO {
	@IsNotEmpty()
	@IsString()
	@ApiModelProperty()
	title: string;

	@IsNotEmpty()
	@IsString()
	@ApiModelProperty()
	description: string;

	@IsNotEmpty()
	@ApiModelProperty()
	@IsNumber()
	@IsPositive()
	@Max(100)
	@Min(1)
	dealPercent: number;

	@IsNotEmpty()
	@ApiModelProperty({ enum: Object.keys(DealType) })
	@IsEnum(DealType, { message: 'Deal type must be one of these ' + Object.keys(DealType) })
	dealType: string;

	@IsOptional()
	@IsString()
	@ApiModelProperty()
	categoryId: string;

	@IsOptional()
	@IsString()
	@ApiModelProperty()
	productId: string;

	@IsNotEmpty()
	@IsUrl()
	@ApiModelProperty()
	imageUrl: string;

	@IsNotEmpty()
	@ApiModelProperty()
	imageId: string;

	@IsNotEmpty()
	@ApiModelProperty()
	filePath: string;

	@IsNotEmpty()
	@ApiModelProperty()
	topDeal: boolean;

	@ApiModelProperty()
	products: [ProductsDTO]

	categoryName: string;
	productName: string;

}
export class DealsDTO {

	@IsOptional()
	@IsString()
	_id: string;

	@IsNotEmpty()
	@IsString()
	@ApiModelProperty()
	title: string;

	@IsNotEmpty()
	@IsString()
	@ApiModelProperty()
	description: string;

	@IsNotEmpty()
	@IsNumber()
	@ApiModelProperty()
	dealPercent: number;

	@IsNotEmpty()
	@ApiModelProperty({ enum: Object.keys(DealType) })
	@IsEnum(DealType, { message: 'Deal type must be one of these ' + Object.keys(DealType) })
	dealType: string;

	@IsOptional()
	@ApiModelProperty()
	@IsString()
	categoryId: string;

	@IsOptional()
	@IsString()
	@ApiModelProperty()
	productId: string;

	@IsNotEmpty()
	@IsUrl()
	@IsString()
	@ApiModelProperty()
	imageUrl: string;

	@IsNotEmpty()
	@ApiModelProperty()
	imageId: string;

	@IsNotEmpty()
	@ApiModelProperty()
	filePath: string;

	@IsNotEmpty()
	@IsBoolean()
	@ApiModelProperty()
	topDeal: boolean;

	@IsOptional()
	@IsBoolean()
	@ApiModelProperty()
	status: boolean;

	@ApiModelProperty()
	products: [ProductsDTO]
}

export class DealStatusDTO {
	@IsNotEmpty()
	@ApiModelProperty()
	status: boolean;
}

export class FindDealDTO {
	@IsNotEmpty()
	@IsString()
	@ApiModelProperty()
	title: string;
}

