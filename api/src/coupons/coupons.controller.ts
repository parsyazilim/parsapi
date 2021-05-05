import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiUseTags, ApiImplicitQuery, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { CouponService } from './coupons.service';
import { UsersDTO } from '../users/users.model';
import { CouponsDTO, CouponStatusDTO, ResponseCouponsListData, ResponseCouponsData } from './coupons.model';
import { UtilService } from '../utils/util.service';
import { ResponseMessage, ResponseErrorMessage, ResponseSuccessMessage, AdminSettings, CommonResponseModel, ResponseBadRequestMessage, AdminQuery } from '../utils/app.model';
import { GetUser } from '../utils/jwt.strategy';

@Controller('coupons')
@ApiUseTags('Coupons')
export class CouponController {
	constructor(
		private couponService: CouponService,
		private utilService: UtilService
	) {
	}

	// #################################################### ADMIN ##########################################
	@Get('/admin/list')
	@ApiOperation({ title: 'Get List of Coupon' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of banners', type: ResponseCouponsListData })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAllBanner(@GetUser() user: UsersDTO, @Query() adminQuery: AdminQuery): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let pagination = this.utilService.getAdminPagination(adminQuery);
			const coupons = await Promise.all([
				this.couponService.getAllCoupon(pagination.page - 1, pagination.limit, pagination.q),
				this.couponService.countAllCoupon(pagination.q)
			])
			return this.utilService.successResponseData(coupons[0], { total: coupons[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/detail/:couponId')
	@ApiOperation({ title: 'Get List of Coupon by couponId' })
	@ApiResponse({ status: 200, description: 'Return coupon detail by couponId', type: ResponseCouponsData })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async couponDetailAdmin(@GetUser() user: UsersDTO, @Param('couponId') couponId: string): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const coupon = await this.couponService.getCouponDetail(couponId);
			if (coupon) return this.utilService.successResponseData(coupon);
			else this.utilService.badRequest(ResponseMessage.COUPON_NOT_FOUND);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/admin/create')
	@ApiOperation({ title: 'Create Coupon' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async createCoupon(@GetUser() user: UsersDTO, @Body() couponData: CouponsDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const couponExist = await this.couponService.findCouponByCode(couponData.couponCode);
			if (couponExist) this.utilService.badRequest(ResponseMessage.COUPON_ALREADY_EXIST);

			couponData.couponCode = couponData.couponCode.trim();
			const coupon = await this.couponService.createCoupon(couponData);
			if (coupon) return this.utilService.successResponseMsg(ResponseMessage.COUPON_SAVED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/update/:couponId')
	@ApiOperation({ title: 'update coupon by couponId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateCoupon(@GetUser() user: UsersDTO, @Param('couponId') couponId: string, @Body() couponData: CouponsDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const couponExist = await this.couponService.getCouponDetail(couponId.trim());
			if (!couponExist) this.utilService.badRequest(ResponseMessage.COUPON_NOT_FOUND);

			couponData.couponCode = couponData.couponCode.trim();
			const codeExist = await this.couponService.findCouponByCode(couponData.couponCode);
			//if (codeExist && codeExist._id.toString() !== couponId.trim())  this.utilService.badRequest(ResponseMessage.COUPON_ALREADY_EXIST); //TODO:

			const coupon = await this.couponService.updateCoupon(couponId, couponData);
			if (coupon) return this.utilService.successResponseMsg(ResponseMessage.COUPON_UPDATED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Delete('/admin/delete/:couponId')
	@ApiOperation({ title: 'delete coupon by couponId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async deleteCoupon(@GetUser() user: UsersDTO, @Param('couponId') couponId: string) {
		this.utilService.validateAdminRole(user);
		try {
			const couponExist = await this.couponService.getCouponDetail(couponId);
			if (!couponExist) return this.utilService.badRequest(ResponseMessage.COUPON_NOT_FOUND);

			const coupon = await this.couponService.deleteCoupon(couponId);
			if (coupon) return this.utilService.successResponseMsg(ResponseMessage.COUPON_DELETED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/status-update/:couponId')
	@ApiOperation({ title: 'update Coupon status  by couponId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateCouponStatus(@GetUser() user: UsersDTO, @Param('couponId') couponId: string, @Body() couponStatusData: CouponStatusDTO) {
		this.utilService.validateAdminRole(user);
		try {
			const couponExist = await this.couponService.getCouponDetail(couponId);
			if (!couponExist) return this.utilService.badRequest(ResponseMessage.COUPON_NOT_FOUND);

			const coupon = await this.couponService.couponStatusUpdate(couponId, couponStatusData);
			if (coupon) return this.utilService.successResponseMsg(ResponseMessage.COUPON_STATUS_UPDATED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
}
