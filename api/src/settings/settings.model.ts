import * as mongoose from 'mongoose';
import {
	IsNotEmpty,
	IsEmail,
	IsEmpty,
	IsUrl,
	IsEnum,
	IsNumber,
	Length,
	IsOptional,
	IsPositive,
	Min,
	Equals,
	IsArray,
	ValidateNested,
	IsString, Max, IsBoolean, IsInt
} from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { isString, isArray } from 'util';

export enum PaymentMethod {
	COD = 'COD',
	STRIPE = 'STRIPE'
}

export enum DeliveryType {
	FIXED = 'FIXED',
	FLEXIBLE = 'FLEXIBLE'
}

export enum TaxType {
	INCLUDED = 'INCLUDED',
	EXCLUDED = 'EXCLUDED'
}
export enum ShippingMethod {
	DELIVERY = 'DELIVERY',
	PICK_UP = 'PICK_UP',
}
export const SettingSchema = new mongoose.Schema({
	startDeliveryFrom: { type: Number, default: 0 },
	deliveryTimeSlots: [{
		dayCode: Number,
		isOpen: Boolean,
		timings: [
			{
				slot: String,
				openTime: Number,
				closeTime: Number,
				deliveryCount: Number,
				isOpen: Boolean
			}
		]
	}],
	currencySymbol: { type: String, default: "$" },
	currencyCode: { type: String, default: "USD" },
	paymentMethod: { type: PaymentMethod },
	shippingMethod: { type: ShippingMethod },
	deliveryType: { type: DeliveryType },
	fixedDeliveryCharges: { type: Number, default: 0 },
	deliveryChargePerKm: { type: Number },
	deliveryCoverage: { type: Number },
	minOrderAmountForFree: { type: Number },
	minimumOrderAmountToPlaceOrder: { type: Number },
	location: {
		latitude: { type: Number },
		longitude: { type: Number },
	},
	taxType: { type: TaxType },
	taxName: { type: String },
	taxAmount: { type: Number },
	maxWalletAmountUsed: { type: Number, default: 0 },
})

export class locationDTO {
	@ApiModelProperty()
	latitude: number

	@ApiModelProperty()
	longitude: number
}

export class UpdateCurrencyDTO {
	@ApiModelProperty()
	currencyCode: string

	@ApiModelProperty()
	currencySymbol: string
}

export class DeliveryTaxSaveDTO {
	@ApiModelProperty()
	deliveryCoverage: number;

	@ApiModelProperty()
	@IsNotEmpty()
	location: locationDTO;

	@ApiModelProperty()
	minOrderAmountForFree: number;

	@ApiModelProperty()
	minimumOrderAmountToPlaceOrder: number;

	@ApiModelProperty()
	taxName: string;

	@ApiModelProperty({ enum: Object.keys(DeliveryType) })
	@IsEnum(DeliveryType, { message: 'Delivery type must be one of these ' + Object.keys(DeliveryType) })
	deliveryType: string;

	@ApiModelProperty({ enum: Object.keys(TaxType) })
	@IsEnum(TaxType, { message: 'Tax type must be one of these ' + Object.keys(TaxType) })
	taxType: string;

	@IsNotEmpty()
	@ApiModelProperty()
	@IsNumber()
	@Max(100)
	@Min(0)
	taxAmount: number;

	@ApiModelProperty()
	fixedDeliveryCharges: number;

	@ApiModelProperty()
	deliveryChargePerKm: number;

	@ApiModelProperty()
	paymentMethod: Array<string>;

	@ApiModelProperty()
	shippingMethod: Array<string>
}

export class SettingDTO {
	@ApiModelProperty()
	_id: string;

	@ApiModelProperty()
	pincode: Array<string>;

	@IsNumber()
	@IsOptional()
	startDeliveryFrom: number;

	@IsOptional()
	workingHours: Array<WorkingHoursDTO>;

	@ApiModelProperty()
	currencyCode: string;

	@ApiModelProperty()
	languageCode: string;

	@ApiModelProperty()
	currencySymbol: string;

	@ApiModelProperty()
	currency: Array<object>;

	@ApiModelProperty()
	currencyList: Array<object>;

	@ApiModelProperty()
	languageList: Array<object>;
}

export class TimeScheduleDTO {
	@IsString()
	@IsOptional()
	@ApiModelProperty()
	_id: string;

	@IsString()
	@IsNotEmpty()
	@ApiModelProperty()
	slot: string;

	@IsNumber()
	@IsNotEmpty()
	@ApiModelProperty()
	openTimeConverted: number;

	@IsNumber()
	@IsNotEmpty()
	@ApiModelProperty()
	closeTimeConverted: number;

	@IsNumber()
	@IsNotEmpty()
	@ApiModelProperty()
	deliveryCount: number;

	@IsBoolean()
	@IsNotEmpty()
	@ApiModelProperty()
	isOpen: boolean;
}

export class WorkingHoursDTO {
	@IsString()
	@IsOptional()
	@ApiModelProperty()
	_id: string;

	@IsNotEmpty()
	@IsString()
	@ApiModelProperty()
	day: string;

	@IsNumber()
	@IsNotEmpty()
	@ApiModelProperty()
	dayCode: number;

	@IsBoolean()
	@IsNotEmpty()
	@ApiModelProperty()
	isOpen: boolean;

	@IsOptional()
	@IsArray()
	timeSchedule: Array<TimeScheduleDTO>;
}

export class SettingWorkingHoursDTO {
	@IsString()
	@IsOptional()
	_id?: string;

	@IsNumber()
	@IsOptional()
	startDeliveryFrom: number

	@ApiModelProperty()
	workingHours: Array<WorkingHoursDTO>
}

export class SettingCurrencyAndLanguageDTO {
	@IsString()
	@IsOptional()
	_id?: string;

	@ApiModelProperty()
	currencyCode: string

	@ApiModelProperty()
	languageCode: string;

	@ApiModelProperty()
	currencySymbol: string
}


export class SettingCurrencyAndLanguageListDTO {
	@IsString()
	@IsOptional()
	_id?: string;

	@ApiModelProperty()
	currencyList: Array<object>

	@ApiModelProperty()
	languageList: Array<object>
}

export class SettingCurrencyAndLanguageCodeDTO {
	@IsString()
	@IsOptional()
	@ApiModelProperty()
	_id?: string;

	@ApiModelProperty()
	languageCode: string;

	@ApiModelProperty()
	currencySymbol: string;
}

//Settings  details ResponseDTO for user
export class ResponseSettingDTO extends SettingCurrencyAndLanguageCodeDTO {
	@ApiModelProperty()
	location: locationDTO

	@ApiModelProperty()
	paymentMethod: []

	@ApiModelProperty()
	minimumOrderAmountToPlaceOrder: number
}

export class ResponseSettingDetails {
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: ResponseSettingDTO;
}

//This is for User get time-slot details
export class TimeSlotDTO {
	@ApiModelProperty()
	_id: string

	@ApiModelProperty()
	slot: string

	@ApiModelProperty()
	isOpen: boolean
}

export class ResponseTimeSlot {
	@ApiModelProperty({ isArray: true })
	timing: TimeSlotDTO
}

export class ResponseTimeSlotDTO {
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: ResponseTimeSlot;
}

//This is for Admin  setting all Details
export class ResponseDateAndTime {
	@ApiModelProperty()
	_id: string

	@ApiModelProperty({ isArray: true })
	timeShedule: TimeScheduleDTO

	@ApiModelProperty()
	dayCode: string

	@ApiModelProperty()
	isOpen: boolean

	@ApiModelProperty()
	date: string
}

export class ResponseSettigsAdminDTO extends DeliveryTaxSaveDTO {
	@ApiModelProperty()
	currencyCode: string;

	@ApiModelProperty()
	languageCode: string;

	@ApiModelProperty()
	currencySymbol: string;

	@ApiModelProperty()
	currency: Array<object>;

	@ApiModelProperty()
	currencyList: Array<object>;

	@ApiModelProperty()
	languageList: Array<object>;

	@ApiModelProperty({ isArray: true })
	workingHours: ResponseDateAndTime;
}

export class ResponseTimeSlotDetails {
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: ResponseSettigsAdminDTO;
}

export class ResponseDeliverySlotDTO {
	@ApiModelProperty({ isArray: true })
	deliverySlot: ResponseDateAndTime
}

export class ResponseTimeDTO {
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: ResponseDeliverySlotDTO;
}

export class ResponseCurrencyDetailsDTO extends UpdateCurrencyDTO {
	@ApiModelProperty()
	_id: string
}

export class ResponseCurrencyDetailsAdmin {
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: ResponseCurrencyDetailsDTO;
}

export class ResponseCurrencyListDTO {
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: Object;
}

export class TimeSlotDropDownDTO {
	@ApiModelProperty()
	time: string;

	@ApiModelProperty()
	minutes: number;
}
export class ResponseTimeSlotDropDown {
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: TimeSlotDropDownDTO;
}