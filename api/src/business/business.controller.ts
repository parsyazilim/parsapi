import { Controller, Body, Put, Param, Get, UseGuards } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessSaveDTO, ResponseBusinessUser, ResponseBusinessDetailAdmin } from './business.model';
import { UsersDTO } from '../users/users.model';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiUseTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseMessage, ResponseErrorMessage, ResponseSuccessMessage, CommonResponseModel, ResponseBadRequestMessage } from '../utils/app.model';
import { UtilService } from '../utils/util.service';
import { GetUser } from '../utils/jwt.strategy';

@Controller('business')
@ApiUseTags('Business')
export class BusinessController {
	constructor(
		private businessService: BusinessService,
		private utilService: UtilService
	) {
	}

	// #################################################### USER ####################################################
	@Get('/detail')
	@ApiOperation({ title: 'Get business detail for user' })
	@ApiResponse({ status: 200, description: 'return business detail', type: ResponseBusinessUser })
	public async getBussinessDetailUser(): Promise<CommonResponseModel> {
		try {
			const business = await this.businessService.getBussinessDetailForUser();
			return this.utilService.successResponseData(business);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	// #################################################### ADMIN ####################################################
	@Get('/admin/detail')
	@ApiOperation({ title: 'Get business detail for admin' })
	@ApiResponse({ status: 200, description: 'Return business detail', type: ResponseBusinessDetailAdmin })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getBusinessinfomation(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const business = await this.businessService.getBusinessDetail();
			return this.utilService.successResponseData(business);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/update')
	@ApiOperation({ title: 'Update business detail' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateBusiness(@GetUser() user: UsersDTO, @Body() businesData: BusinessSaveDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const business = await this.businessService.updateBusiness(businesData);
			if (business) return this.utilService.successResponseMsg(ResponseMessage.BUSINESS_UPDATED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
}
