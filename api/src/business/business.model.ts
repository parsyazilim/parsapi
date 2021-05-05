import * as mongoose from 'mongoose';
import { IsMongoId, IsNotEmpty, IsOptional, IsUrl, IsString, IsNumber } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export const BusinessSchema = new mongoose.Schema({
	storeName: { type: String },
	address: { type: String },
	email: { type: String },
	phoneNumber: { type: Number },
	officeLocation: { type: String }
}, {
	timestamps: true
});

export class BusinessSaveDTO {
	@ApiModelProperty()
	email: string;

	@ApiModelProperty()
	phoneNumber: number

	@ApiModelProperty()
	address: string;

	@ApiModelProperty()
	storeName: string;

	@ApiModelProperty()
	officeLocation: string
}

export class BusinessAdminDTO extends BusinessSaveDTO {

	_id: string
}

export class BusinessDTO extends BusinessSaveDTO {

}

export class ResponseBusinessUser {
	@ApiModelProperty()
	@IsString()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: BusinessAdminDTO;
}

export class ResponseBusinessDetail {
	@ApiModelProperty()
	@IsString()
	response_code: string;

	@ApiModelProperty()
	response_data: BusinessDTO;
}

export class ResponseBusinessDetailAdmin {
	@ApiModelProperty()
	@IsString()
	response_code: string;

	@ApiModelProperty()
	response_data: BusinessAdminDTO;
}