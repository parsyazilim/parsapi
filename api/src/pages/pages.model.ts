import * as mongoose from 'mongoose';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export enum PageType {
	ABOUT_US = 'ABOUT_US',
	TERMS_AND_CONDITIONS = 'TERMS_AND_CONDITIONS',
	PRIVACY_POLICY = 'PRIVACY_POLICY'
}

export const PageSchema = new mongoose.Schema({
	pageType: { type: PageType },
	title: { type: String },
	description: { type: String },
	status: { type: Boolean, default: true }

}, {
	timestamps: true
});

export class PageSaveDTO {
	@IsNotEmpty()
	@ApiModelProperty({ enum: Object.keys(PageType) })
	@IsEnum(PageType, { message: 'pageType must be one of these ' + Object.keys(PageType) })
	pageType: PageType;

	@IsString()
	@IsOptional()
	@ApiModelPropertyOptional()
	title?: string;

	@IsString()
	@IsNotEmpty()
	@ApiModelProperty()
	description: string;
}

export class PageDTO {
	@ApiModelProperty()
	title: string;

	@ApiModelProperty()
	description: string;
}

//This is  for User ResponseDTO
export class ResponsePageDTO {
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: PageDTO;
}

//This is for Admin Response Page DTO

export class ResponseAdminDTO extends PageDTO {

	@ApiModelProperty()
	status: boolean
}

export class ResponseAdminPageDTO {

	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: ResponseAdminDTO;

}