import *as mongoose from 'mongoose';
import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export const SubCategorySchema = new mongoose.Schema({
	title: { type: String },
	description: { type: String },
	categoryId: { type: String },
	categoryName: { type: String },
	userId: { type: String },
	status: { type: Boolean, default: true },
}, {
	timestamps: true
});


export class SubCategorySaveDTO {
	@IsString()
	@IsNotEmpty()
	@ApiModelProperty()
	title: string;

	@IsString()
	@IsNotEmpty()
	@ApiModelProperty()
	description: string;

	@IsString()
	@IsNotEmpty()
	@ApiModelProperty()
	categoryId: string;

	categoryName?: string;
}

export class SubCategoryUserDTO extends SubCategorySaveDTO {
	@ApiModelProperty()
	_id: string

	@IsOptional()
	@IsString()
	@ApiModelProperty()
	categoryName?: string;
}

export class SubCategoryDTO extends SubCategoryUserDTO {
	@ApiModelProperty()
	_id: string

	@IsOptional()
	@IsString()
	@ApiModelProperty()
	categoryName?: string;

	@IsOptional()
	@IsBoolean()
	@ApiModelProperty()
	status: boolean
}

export class SubCategoryStatusDTO {
	@IsBoolean()
	@IsNotEmpty()
	@ApiModelProperty()
	status: boolean;
}

export class SubCategoryDropdownDTO {
	@ApiModelProperty()
	_id: string

	@ApiModelProperty()
	title: string;

	@ApiModelProperty()
	status: string;

	categoryId: string;
}


export class ResponseSubCategoryUserListDTO {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: SubCategoryUserDTO;
}

export class ResponseSubCategoryListDTO {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: SubCategoryDTO;
}

export class ResponseSubCategoryDTO {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: SubCategoryDTO;
}

export class ResponseSubCategoryDetailDTO {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: SubCategoryDTO;
}

export class ResponseSubCategoryDrpodownDTO {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: SubCategoryDropdownDTO;
}