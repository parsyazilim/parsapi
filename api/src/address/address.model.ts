import * as mongoose from 'mongoose';
import { IsEnum, IsNotEmpty, IsOptional, ValidateNested, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';

export enum AddressType {
	HOME = 'HOME',
	WORK = 'WORK',
	OTHERS = 'OTHERS'
}

export class LLLocationDTO {
	@IsNotEmpty()
	@ApiModelProperty()
	@IsNumber()
	latitude: number;

	@IsNotEmpty()
	@ApiModelProperty()
	@IsNumber()
	longitude: number;
}

export const AddressSchema = new mongoose.Schema({
	address: { type: String },
	flatNo: { type: String },
	apartmentName: { type: String },
	landmark: { type: String, required: false },
	postalCode: { type: String },
	mobileNumber: { type: String },
	addressType: { type: AddressType },
	userId: { type: String },
	location: {
		latitude: { type: Number, required: true },
		longitude: { type: Number, required: true },
	},
}, {
	timestamps: true
});

export class AddressSaveDTO {
	@IsNotEmpty()
	@ApiModelProperty({ enum: Object.keys(AddressType) })
	@IsString()
	@IsEnum(AddressType, { message: 'addressType must be one of these ' + Object.keys(AddressType) })
	addressType: string;

	@IsNotEmpty()
	@ApiModelProperty()
	@IsString()
	flatNo: string;

	@IsNotEmpty()
	@ApiModelProperty()
	@IsString()
	apartmentName: string;

	@IsOptional()
	@ApiModelPropertyOptional()
	@IsString()
	landmark: string;

	@IsNotEmpty()
	@ApiModelProperty()
	@IsString()
	address: string;

	@IsNotEmpty()
	@ApiModelProperty()
	@IsString()
	postalCode: string;

	@IsNotEmpty()
	@ApiModelProperty()
	@ValidateNested()
	@Type(() => LLLocationDTO)
	location: LLLocationDTO;

	userId: string

	@IsString()
	@ApiModelProperty()
	mobileNumber: string
}

export class AddressDTO extends AddressSaveDTO {
	@ApiModelProperty()
	_id: string;
}

export class ResponseAddress {
	@ApiModelProperty()
	@IsString()
	response_code: string;

	@ApiModelProperty()
	response_data: AddressDTO;
}

export class ResponseAddressList {
	@ApiModelProperty()
	@IsString()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: AddressDTO;
}

export class ResponseAddressDropdown {
	@ApiModelProperty()
	@IsString()
	response_code: string;

	@ApiModelProperty()
	response_data: Object;
}
