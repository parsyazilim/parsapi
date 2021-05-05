import * as mongoose from 'mongoose';
import { IsNotEmpty, IsOptional, IsUrl, IsMongoId, IsEmpty, IsBoolean, IsNumber, IsPositive, Min, Max, IsArray, IsString } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export const CategorySchema = new mongoose.Schema({
	title: { type: String },
	description: { type: String },
	subCategoryCount: { type: Number, default: 0 },
	imageUrl: { type: String, required: true },
	imageId: { type: String, required: false },
	filePath: { type: String },
	isDealAvailable: { type: Boolean, default: false },
	dealPercent: { type: Number },
	dealId: { type: String },
	userId: { type: String },
	status: { type: Boolean, default: true }
}, {
	timestamps: true
});

export class CategorySaveDTO {
	@ApiModelProperty()
	title: string;

	@ApiModelProperty()
	description: string;

	@ApiModelProperty()
	@IsString()
	@IsOptional()
	imageUrl: string;

	@ApiModelProperty()
	@IsString()
	@IsOptional()
	imageId: string;

	@ApiModelProperty()
	@IsString()
	@IsOptional()
	filePath: string;

	userId: string;
}

export class CategoryListDTO {
	@ApiModelProperty()
	_id: string;

	@ApiModelProperty()
	title: string;

	@ApiModelProperty()
	imageUrl: string;

	@ApiModelProperty()
	@IsString()
	@IsOptional()
	filePath: string;
}

export class CategoryAdminListDTO {
	@ApiModelProperty()
	_id: string;

	@ApiModelProperty()
	title: string;

	@ApiModelProperty()
	imageUrl: string;

	@ApiModelProperty()
	filePath: string;

	@ApiModelProperty()
	subCategoryCount: number;

	@ApiModelProperty()
	status: boolean;

	@ApiModelProperty()
	isDealAvailable: boolean;

	@ApiModelProperty()
	@IsNumber()
	dealPercent: number;
}

export class CategoryAdminDetailDTO extends CategoryAdminListDTO {
	@ApiModelProperty()
	description: string;
}

export class CategoryStatusUpdateDTO {
	@IsNotEmpty()
	@ApiModelProperty()
	@IsBoolean()
	status: boolean;
}


export class DropDownDTO {
	@ApiModelProperty()
	_id: string;

	@ApiModelProperty()
	title: string;

	@ApiModelProperty()
	status: string;
}

export class ResponseUserCategoryList {
	@ApiModelProperty()
	@IsString()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: CategorySaveDTO;
}

export class ResponseCategoryAdmin {
	@ApiModelProperty()
	@IsString()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: CategoryAdminListDTO;
}

export class ResponseDropDown {
	@ApiModelProperty()
	@IsString()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: DropDownDTO;


}



// export class DealCategoryDTO {
//   @IsOptional()
//   dealPercent: number;

//   @IsOptional()
//   isDealAvailable: boolean;

//   @IsOptional()
//   @IsMongoId()
//   dealId: string 
// }
