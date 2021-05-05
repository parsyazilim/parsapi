import * as mongoose from 'mongoose';
import {
	IsNotEmpty,
	IsEmail,
	IsEmpty,
	IsUrl,
	IsNumber,
	Length,
	IsOptional,
	IsPositive,
	Min,
	Equals,
	IsArray,
	ValidateNested,
	IsString,
	Max,
	IsEnum,
	IsAlphanumeric,
	IsBoolean,
} from 'class-validator';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserRoles } from '../utils/app.model';

export const UserSchema = new mongoose.Schema({
	firstName: { type: String },
	lastName: { type: String },
	email: { type: String, trim: true, lowercase: true, sparse: true },
	password: { type: String },
	salt: { type: String },
	role: { type: String },
	imageUrl: { type: String },
	imageId: { type: String },
	filePath: { type: String },
	isSuperAdmin: { type: Boolean, default: false },
	mobileNumber: { type: String, unique: true },
	newMobileNumber: { type: String },
	countryCode: { type: String },
	countryName: { type: String },
	otp: { type: String },
	otpVerificationId: { type: String },
	otpVerificationExpiry: { type: Number },
	playerId: { type: String },
	mobileNumberVerified: { type: Boolean, default: false },
	emailVerified: { type: Boolean, default: false },
	emailVerificationId: { type: String },
	emailVerificationExpiry: { type: Number },
	location: {
		latitude: { type: Number, required: false },
		longitude: { type: Number, required: false },
	},
	status: { type: Boolean, default: true },
	productExportedFile: { type: Object },
	language: { type: String },
	walletAmount: { type: Number },
	orderDelivered: { type: Number, default: 0 },
	orderPurchased: { type: Number, default: 0 },
}, {
	timestamps: true
});

export class LLLocationDTO {
	@IsNotEmpty()
	@ApiModelProperty()
	latitude: number;

	@IsNotEmpty()
	@ApiModelProperty()
	longitude: number;
}

export class UserCreateDTO {
	@IsString()
	@ApiModelProperty()
	@IsNotEmpty()
	firstName: string;

	@IsString()
	@ApiModelProperty()
	@IsNotEmpty()
	lastName: string;

	@IsString()
	@ApiModelProperty()
	@IsNotEmpty()
	email: string;

	@IsString()
	@ApiModelProperty()
	@IsNotEmpty()
	@Length(6, 35)
	password: string;

	@IsString()
	@ApiModelProperty()
	mobileNumber: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => LLLocationDTO)
	location: LLLocationDTO;

	salt: string;
	emailVerificationId: string;
	emailVerificationExpiry: number;
	role: string;
	otp: string;
	emailVerified: boolean;
	mobileNumberVerified: boolean;

}
export class UserCreateMobileDTO {
	@IsString()
	@ApiModelProperty()
	@IsNotEmpty()
	firstName: string;

	@IsString()
	@ApiModelProperty()
	@IsNotEmpty()
	lastName: string;

	@IsString()
	@ApiModelProperty()
	@IsOptional()
	email: string;

	@IsString()
	@ApiModelProperty()
	@IsNotEmpty()
	@Length(6, 35)
	password: string;

	@IsString()
	@IsNotEmpty()
	@ApiModelProperty()
	@Length(8, 15)
	mobileNumber: string;

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	countryCode: string

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	countryName: string

	@IsOptional()
	@ValidateNested()
	@Type(() => LLLocationDTO)
	location: LLLocationDTO;

	salt: string;
	emailVerificationId: string;
	emailVerificationExpiry: number;
	role: string;
	otp: string;
	emailVerified: boolean;
}
export class LoginDTO {
	@ApiModelProperty()
	@IsNotEmpty()
	@IsEmail()
	@IsString()
	email: string;

	@ApiModelProperty()
	@IsNotEmpty()
	@Length(6, 35)
	@IsString()
	password: string;

	@IsString()
	@IsOptional()
	playerId: string;
}

export class LogInMobileDTO {

	@IsNotEmpty()
	@IsString()
	@ApiModelProperty()
	userName: string;

	@ApiModelProperty()
	@IsNotEmpty()
	@Length(6, 35)
	@IsString()
	password: string;

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	playerId: string;
}

export class CoOridnatesDTO {
	@IsOptional()
	@Equals('Point')
	@ApiModelProperty()
	@IsString()
	type: string;

	@IsOptional()
	@IsArray()
	@ApiModelProperty()
	coordinates: Array<number>;
}

export class UsersDTO {
	walletAmount: number;

	@IsEmpty()
	_id: string;

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	firstName: string;

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	lastName: string;

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	email: string;

	@IsString()
	@IsNotEmpty()
	@Length(5, 35)
	@ApiModelProperty()
	password: string;

	@IsString()
	@IsNotEmpty()
	@ApiModelProperty()
	mobileNumber: string;

	@IsString()
	@ApiModelProperty()
	newMobileNumber: string;

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	countryCode: string

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	countryName: string

	@IsString()
	@IsEmpty()
	salt: string;

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	filePath: string

	@IsString()
	@IsOptional()
	playerId: String

	@IsNotEmpty()
	@ApiModelProperty({ enum: Object.keys(UserRoles) })
	@IsEnum(UserRoles, { message: 'Role type must be one of these ' + Object.keys(UserRoles) })
	role: string;

	@IsString()
	@IsOptional()
	otp: string;

	@IsString()
	@IsOptional()
	@IsUrl()
	@ApiModelProperty()
	imageUrl: string;

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	imageId: string;

	@IsNumber()
	@IsOptional()
	registrationDate: number;

	@IsBoolean()
	@IsOptional()
	emailVerified: boolean;

	@IsBoolean()
	@IsOptional()
	mobileNumberVerified: boolean;

	@IsString()
	@IsOptional()
	verificationId: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => CoOridnatesDTO)
	location: CoOridnatesDTO;

	@IsOptional()
	@IsNumber()
	@IsPositive()
	@ApiModelProperty()
	deliveryCharge: number;

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	deliveryDistanceUnit: string;

	status: boolean

	language: string;

	emailVerificationId: string;

	emailVerificationExpiry: number;

	otpVerificationId: string;

	otpVerificationExpiry: number;
	isSuperAdmin: boolean;
}

export class UsersUpdateDTO {
	@IsString()
	@IsOptional()
	@ApiModelProperty()
	firstName?: string;

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	lastName?: string;

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	email?: string;

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	mobileNumber?: string;

	@IsString()
	@IsOptional()
	@IsUrl()
	@ApiModelProperty()
	imageUrl?: string;

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	imageId?: string;

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	filePath?: string;

	productExportedFile?: object;
	playerId?: string;
}

export class CredentialsDTO {
	@IsString()
	@IsNotEmpty()
	@IsEmail()
	@ApiModelProperty()
	email: string;

	@IsString()
	@IsOptional()
	playerId: string

	@IsString()
	@IsNotEmpty()
	@Length(5, 35)
	@ApiModelProperty()
	password: string;
}

export class ForgotPasswordDTO {
	@IsString()
	@IsNotEmpty()
	@IsEmail()
	@ApiModelProperty()
	email: string;
}

export class ResetPasswordDTO {
	@IsString()
	@IsNotEmpty()
	@Length(6, 35)
	@ApiModelProperty()
	newPassword: string;

	@IsString()
	@IsNotEmpty()
	@IsEmail()
	@ApiModelProperty()
	email: string;

	@IsString()
	@IsNotEmpty()
	@ApiModelProperty()
	verificationToken: string;
}

export class ResetNumberPasswordDTO {
	@IsString()
	@IsNotEmpty()
	@Length(6, 35)
	@ApiModelProperty()
	newPassword: string;

	@IsString()
	@IsNotEmpty()
	@ApiModelProperty()
	mobileNumber: string;

	@IsString()
	@IsNotEmpty()
	@ApiModelProperty()
	verificationToken: string;
}

export class ChangePasswordDTO {
	@IsString()
	@IsNotEmpty()
	@Length(6, 35)
	@ApiModelProperty()
	currentPassword: string;

	@IsString()
	@IsNotEmpty()
	@Length(6, 35)
	@ApiModelProperty()
	newPassword: string;
}

export class UserStatusDTO {
	@IsBoolean()
	@IsNotEmpty()
	@ApiModelProperty()
	status: boolean
}

export class LanguageUpdateDTO {
	@IsString()
	@IsNotEmpty()
	@ApiModelProperty()
	language: string;
}

export class ExportedFileDTO {
	@ApiModelPropertyOptional()
	_id?: string;

	@ApiModelProperty()
	productExportedFile: {
		url: string,
		status: string,
		publicId: string
	}
}

export class AdminDTO {
	@ApiModelProperty()
	firstName: string

	@ApiModelProperty()
	lastName: string

	@ApiModelProperty()
	email: string

	@ApiModelProperty()
	mobileNumber: string

	@IsOptional()
	@ValidateNested()
	@Type(() => CoOridnatesDTO)
	@ApiModelProperty()
	location: CoOridnatesDTO
}

export class AdminDeliveryDTO {
	@ApiModelProperty()
	firstName?: string;

	@ApiModelProperty()
	lastName?: string;

	@ApiModelProperty()
	mobileNumber?: string;

	@ApiModelProperty()
	countryCode?: string

	@ApiModelProperty()
	countryName?: string

	@IsNotEmpty()
	@IsEmail()
	@ApiModelProperty()
	email: string;

	@ApiModelProperty()
	password?: string

	role?: string

	emailVerificationId: string;

	emailVerificationExpiry: number;

	salt: string;

	emailVerified: boolean;
}

export class LoginResponseDTO {
	@ApiModelProperty()
	token: string;

	@ApiModelProperty()
	role: string;

	@ApiModelProperty()
	id: string;

	@ApiModelProperty()
	language: string;
}

export class ResponseLogin {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: LoginResponseDTO;
}

export class UserMeDTO extends UsersUpdateDTO {
	@ApiModelProperty()
	_id: string;

	@ApiModelProperty()
	email: string;

	@ApiModelProperty()
	language: string;

	@ApiModelProperty()
	walletAmount: number;
}

export class ResponseMe {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: UserMeDTO;
}

export class AdminUserDTO {
	@ApiModelProperty()
	_id: string;

	@ApiModelProperty()
	status: boolean;

	@ApiModelProperty()
	email: string;

	@ApiModelProperty()
	firstName: string;

	@ApiModelProperty()
	lastName: string;

	@ApiModelProperty()
	mobileNumber: string;

	@ApiModelProperty()
	language: string;

	@ApiModelProperty()
	createdAt: string;

	@ApiModelProperty()
	emailVerified: boolean;

	@ApiModelProperty()
	orderDelivered: number
}

export class ResponseAdminUserList {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: AdminUserDTO;
}

export class ResponseAdminDeliveryList {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: AdminUserDTO;
}

export class OTPVerifyDTO {
	@IsString()
	@ApiModelProperty()
	mobileNumber: string;

	@IsString()
	@ApiModelProperty()
	otp: string;

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	sId: string;
}

export class OTPSendDTO {
	@IsString()
	@IsNotEmpty()
	@ApiModelProperty()
	mobileNumber: string;

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	countryCode: string
}
















