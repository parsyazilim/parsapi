import * as mongoose from 'mongoose';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsUrl, IsString, IsBoolean } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export enum BannerType {
	CATEGORY = 'CATEGORY',
	PRODUCT = 'PRODUCT'
}

export const BannerSchema = new mongoose.Schema({
	title: { type: String },
	description: { type: String },
	bannerType: { type: BannerType },
	imageUrl: { type: String },
	imageId: { type: String },
	filePath: { type: String },
	categoryId: { type: String },
	categoryName: { type: String },
	productId: { type: String },
	productName: { type: String },
	status: { type: Boolean, default: true }
}, {
	timestamps: true
});

export class BannerSaveDTO {
	@IsNotEmpty()
	@ApiModelProperty()
	@IsString()
	title: string;

	@IsNotEmpty()
	@ApiModelProperty()
	@IsString()
	description: string;

	@IsNotEmpty()
	@IsString()
	@ApiModelProperty({ enum: Object.keys(BannerType) })
	@IsEnum(BannerType, { message: 'Banner type must be one of these ' + Object.keys(BannerType) })
	bannerType: string;

	@IsNotEmpty()
	@IsUrl()
	@ApiModelProperty()
	imageUrl: string;

	@ApiModelProperty()
	imageId: string;

	@IsNotEmpty()
	@IsString()
	@ApiModelProperty()
	filePath: string;

	@IsOptional()
	@IsMongoId()
	@ApiModelProperty()
	categoryId: string;

	@IsOptional()
	@IsMongoId()
	@ApiModelProperty()
	productId: string;

	categoryName: string;
	productName: string;
	status: boolean;
}

export class BannerDTO extends BannerSaveDTO {
	@ApiModelProperty()
	_id: string;
}

export class ResponseUserBannerList {
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: BannerDTO;
}

export class ResponseBanner {
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: BannerDTO;
}

export class ResponseBannerList extends ResponseUserBannerList {
	@ApiModelProperty()
	total: number;
}

export class ResponseBannerType {
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: object;
}
