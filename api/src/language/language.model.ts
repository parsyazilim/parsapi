import * as mongoose from 'mongoose';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsUrl, IsString, IsNumber } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';

export const LanguageSchema = new mongoose.Schema({
	languageCode: { type: String },
	languageName: { type: String },
	status: { type: Number, default: 1 },
	isDefault: { type: Number, default: 0 },
	webJson: { type: Object },
	deliveyAppJson: { type: Object },
	mobAppJson: { type: Object },
	cmsJson: { type: Object },
	backendJson: { type: Object }
}, { timestamps: true });

export class LanguageDTO {
	@IsOptional()
	@IsMongoId()
	_id: string;

	@ApiModelProperty()
	@IsNotEmpty()
	@IsString()
	languageCode: string;

	@ApiModelProperty()
	@IsNotEmpty()
	@IsString()
	languageName: string

	@ApiModelProperty()
	@IsNotEmpty()
	webJson: object;

	@ApiModelProperty()
	@IsNotEmpty()
	deliveyAppJson: object;

	@ApiModelProperty()
	@IsNotEmpty()
	mobAppJson: object;

	@ApiModelProperty()
	@IsNotEmpty()
	cmsJson: object;

	@ApiModelProperty()
	@IsNotEmpty()
	backendJson: object;

	@ApiModelProperty()
	isDefault: Boolean;
}
export class LanguageStatusUpdateDTO {
	@ApiModelProperty()
	@IsNotEmpty()
	@IsNumber()
	status: number
}
export class SetDefaultLanguageDTO {
	@ApiModelProperty()
	@IsNotEmpty()
	@IsNumber()
	isDefault: number
}

export class ResponseLanguageDTO {

	@ApiModelProperty()
	isDefault: number

	@ApiModelProperty()
	_id: string

	@ApiModelProperty()
	languageCode: string

	@ApiModelProperty()
	languageName: string
}

export class ResponseFavouritesDTO {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: ResponseLanguageDTO;

}
export class ResponseLanguageDetailsDTO {

	@ApiModelProperty()
	status: true

	@ApiModelProperty()
	isDefault: number

	@ApiModelProperty()
	_id: string

	@ApiModelProperty()
	languageCode: string

	@ApiModelProperty()
	languageName: string

	@ApiModelProperty()
	webJson: {}

	@ApiModelProperty()
	mobAppJson: {}

	@ApiModelProperty()
	cmsJson: {}

	@ApiModelProperty()
	backendJson: {}

	@ApiModelProperty()
	deliveyAppJson: {}

}

export class ResponseLanguageDetails {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: ResponseLanguageDetailsDTO;

}

export class ResponseLanguageCMSDTO {
	@ApiModelProperty()
	en: {}

}

export class ResponseLanguageCMSDetailsDTO {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: ResponseLanguageCMSDTO;

}