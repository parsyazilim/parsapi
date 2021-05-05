import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiUseTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AddressService } from './address.service';
import { UsersDTO } from '../users/users.model';
import { AddressSaveDTO, ResponseAddress, ResponseAddressList, ResponseAddressDropdown } from './address.model';
import { UtilService } from '../utils/util.service';
import { ResponseMessage, ResponseErrorMessage, ResponseSuccessMessage, CommonResponseModel, ResponseBadRequestMessage } from '../utils/app.model';
import { SettingService } from '../settings/settings.service';
import { GetUser } from '../utils/jwt.strategy';

@Controller('address')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@ApiUseTags('Address')
export class AddressController {
	constructor(
		private addressService: AddressService,
		private settingService: SettingService,
		private utilService: UtilService
	) {
	}

	/*********************************** USER *****************************************/
	@Get('/list')
	@ApiOperation({ title: 'Get all address for logged-in user' })
	@ApiResponse({ status: 200, description: 'Return list of address', type: ResponseAddressList })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async getAddress(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const addresses = await this.addressService.getAllAddress(user._id);
			return this.utilService.successResponseData(addresses);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/:addressId')
	@ApiOperation({ title: 'Get address detail by addressId' })
	@ApiResponse({ status: 200, description: 'Return address detail', type: ResponseAddress })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async getAddressDetails(@GetUser() user: UsersDTO, @Param('addressId') addressId: string): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const address = await this.addressService.getAddressDetail(user._id, addressId);
			if (address) return this.utilService.successResponseData(address);
			else this.utilService.pageNotFound();
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/create')
	@ApiOperation({ title: 'Create address' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async saveAddress(@GetUser() user: UsersDTO, @Body() addressData: AddressSaveDTO): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const mobileNumber = this.utilService.convertToNumber(addressData.mobileNumber);

			if (mobileNumber == 0) this.utilService.badRequest(ResponseMessage.REQUIRED_VALID_MOBILE_NUMBER);

			addressData.userId = user._id;
			const deliveryTax = await this.settingService.getDeliveryTaxSettings();
			const storeLocation = { latitude: deliveryTax.location.latitude, longitude: deliveryTax.location.longitude };
			const userLocation = { latitude: addressData.location.latitude, longitude: addressData.location.longitude };
			const preciseDistance = this.utilService.calculateDistance(userLocation, storeLocation);
			if (preciseDistance <= deliveryTax.deliveryCoverage) {
				const address = await this.addressService.createAddress(addressData);
				return this.utilService.successResponseMsg(ResponseMessage.ADDRESS_SAVED);
			}
			else this.utilService.badRequest(ResponseMessage.ADDDRESS_DELIVERY_LOCATION_NOT_AVAILABLE);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/update/:addressId')
	@ApiOperation({ title: 'Update address by addressId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async updateAddress(@GetUser() user: UsersDTO, @Param('addressId') addressId: string, @Body() addressData: AddressSaveDTO): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const addressExist = await this.addressService.getAddressDetail(user._id, addressId);
			if (!addressExist) this.utilService.badRequest(ResponseMessage.ADDRESS_NOT_FOUND);

			const deliveryTax = await this.settingService.getDeliveryTaxSettings();
			const storeLocation = { latitude: deliveryTax.location.latitude, longitude: deliveryTax.location.longitude };
			const userLocation = { latitude: addressData.location.latitude, longitude: addressData.location.longitude };

			const preciseDistance = this.utilService.calculateDistance(userLocation, storeLocation);
			if (preciseDistance <= deliveryTax.deliveryCoverage) {
				const address = await this.addressService.updateAddress(addressId, addressData);

				if (address) return this.utilService.successResponseMsg(ResponseMessage.ADDRESS_UPDATED);
				else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
			}
			else this.utilService.badRequest(ResponseMessage.ADDDRESS_DELIVERY_LOCATION_NOT_AVAILABLE);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Delete('/delete/:addressId')
	@ApiOperation({ title: 'Delete address by addressId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async deleteAddress(@GetUser() user: UsersDTO, @Param('addressId') addressId: string): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const addressExist = await this.addressService.getAddressDetail(user._id, addressId);
			if (!addressExist) this.utilService.badRequest(ResponseMessage.ADDRESS_NOT_FOUND);
			const address = await this.addressService.deleteAddress(user._id, addressId);

			if (address) return this.utilService.successResponseMsg(ResponseMessage.ADDRESS_DELETED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/type/list')
	@ApiOperation({ title: 'Get all address type for dropdown' })
	@ApiResponse({ status: 200, description: 'Return list of address type', type: ResponseAddressDropdown })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async getAddressTypeList(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const addressTypeList = await this.addressService.getAddressTypeList();
			return this.utilService.successResponseData(addressTypeList);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
}
