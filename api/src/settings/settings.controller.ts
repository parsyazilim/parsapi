import { Controller, Headers, UseGuards, Post, Body, Delete, Param, Get, Put, Res } from '@nestjs/common';
import { SettingService } from './settings.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiUseTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersDTO } from '../users/users.model';
import { UtilService } from '../utils/util.service';
import { CurrencyService } from '../utils/currency.service'
import { DeliveryTaxSaveDTO, UpdateCurrencyDTO, ResponseSettingDetails, ResponseTimeSlotDTO, ResponseSettigsAdminDTO, ResponseTimeSlotDetails, ResponseTimeDTO, ResponseCurrencyDetailsAdmin, ResponseCurrencyListDTO, ResponseTimeSlotDropDown } from './settings.model';
import { ResponseMessage, CommonResponseModel, ResponseErrorMessage, ResponseSuccessMessage, ResponseBadRequestMessage } from '../utils/app.model';
import { GetUser } from '../utils/jwt.strategy';
import { BusinessService } from '../business/business.service'

@Controller('settings')
@ApiUseTags('Settings')
export class SettingController {
	constructor(
		private settingService: SettingService,
		private utilService: UtilService,
		private currencyService: CurrencyService,
		private businessService: BusinessService
	) {
	}

	// #################################################### User ##########################################
	@Get('/details')
	@ApiOperation({ title: 'Get settings detail for user' })
	@ApiResponse({ status: 200, description: 'Return settings detail', type: ResponseSettingDetails })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async getDeliveryTaxSettingsForUser(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		try {
			let resData = await this.settingService.getSettingsForUser();
			let businessInfo = await this.businessService.getBusinessDetail();
			resData = JSON.parse(JSON.stringify(resData));
			resData['storeAddress'] = businessInfo;
			return this.utilService.successResponseData(resData);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/delivery-time-slots')
	@ApiOperation({ title: 'Get delivery time slot for user' })
	@ApiResponse({ status: 200, description: 'Return delivery time slot', type: ResponseTimeSlotDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getDeliveryTime(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminAndUserAllRole(user);
		try {
			let resData = await this.settingService.getDeliveryTimeSlots();
			let deliveryTimeSlots = await this.settingService.getAvailableTimeSlot(resData['deliveryTimeSlots'])
			return this.utilService.successResponseData(deliveryTimeSlots);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	//#################################################### ADMIN ##########################################
	@Get('/admin/delivery-tax')
	@ApiOperation({ title: 'Get settings detail' })
	@ApiResponse({ status: 200, description: 'Return settings detail', type: ResponseTimeSlotDetails })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getDeliveryTaxSettings(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const storeInfo = await this.settingService.getDeliveryTaxSettings();
			return this.utilService.successResponseData(storeInfo);
		}
		catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/delivery-tax/update')
	@ApiOperation({ title: 'Update delivery tax' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateDeliveryTaxSettings(@GetUser() user: UsersDTO, @Body() deliveryTaxData: DeliveryTaxSaveDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const deliveryTax = await this.settingService.updateDeliveryTaxSettings(deliveryTaxData)
			if (deliveryTax.n > 0) return this.utilService.successResponseMsg(ResponseMessage.SETTING_DELIVERY_TAX_UPDATED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/delivery-time-slots')
	@ApiOperation({ title: 'Get delivery time slot for user' })
	@ApiResponse({ status: 200, description: 'Return delivery time slot', type: ResponseTimeDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAdminDeliveryTime(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let settings = await this.settingService.getDeliveryTimeSlots();
			let days = await this.utilService.getArrayOfWeekdays();
			settings = JSON.parse(JSON.stringify(settings));
			settings.deliveryTimeSlots = await settings.deliveryTimeSlots.map(d => { d.date = days[d.dayCode]; return d; })
			return this.utilService.successResponseData(settings);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/update/delivery-time-slots')
	@ApiOperation({ title: 'Update delivery time slots' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async saveAdminDeliveryTime(@GetUser() user: UsersDTO, @Body() deliverySlotData): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let deliveryTimeSlots = await this.utilService.deliveryTimeSlotsValidation(deliverySlotData.deliveryTimeSlots);
			if (deliveryTimeSlots.status) {
				await this.settingService.updatDeliverySlot(deliveryTimeSlots.data);
				return this.utilService.successResponseMsg(ResponseMessage.SETTING_DELIVERY_TIME_SLOTS_UPDATED);
			} else {
				return this.utilService.badRequestResponseData(deliveryTimeSlots.data)
			}
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/currency')
	@ApiOperation({ title: 'Get currency detail' })
	@ApiResponse({ status: 200, description: 'Return currency detail', type: ResponseCurrencyDetailsAdmin })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAdminCurrency(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let resData = await this.settingService.getCurrencyDetail();
			return this.utilService.successResponseData(resData);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/update/currency')
	@ApiOperation({ title: 'Update currency' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateAdminCurrency(@GetUser() user: UsersDTO, @Body() updateCurrencyData: UpdateCurrencyDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let currencyList = await this.currencyService.getAllCurrencyList();
			if (!currencyList[updateCurrencyData.currencyCode]) this.utilService.badRequest(ResponseMessage.CURRENCY_INVALID);
			let resData = await this.settingService.updateCurrency(updateCurrencyData);
			return this.utilService.successResponseMsg(ResponseMessage.SETTING_CURRENCY_UPDATED);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/currency/list')
	@ApiOperation({ title: 'List of currency' })
	@ApiResponse({ status: 200, description: 'List of currency', type: ResponseCurrencyListDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAllCurrencyList(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let currencyList = await this.currencyService.getAllCurrencyList();
			return this.utilService.successResponseData(currencyList);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/time-slots-dropdown')
	@ApiOperation({ title: 'Get half hour time interval list ' })
	@ApiResponse({ status: 200, description: 'Return list of time intervals', type: ResponseTimeSlotDropDown })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getTimeSlotsDropdown(@GetUser() user: UsersDTO,): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const timeSlots = await this.utilService.timeSlotsDropdown();
			return this.utilService.successResponseData(timeSlots);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
}