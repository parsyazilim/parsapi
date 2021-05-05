import { Controller, UseGuards, Get, Query, Body, Post, Param, Put, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiImplicitQuery, ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { UsersDTO } from '../users/users.model';
import { CommonResponseModel, ResponseBadRequestMessage, ResponseErrorMessage, ResponseMessage, ResponseSuccessMessage, UserQuery } from '../utils/app.model';
import { SubscriptionService } from './subscription.service';
import { SubscriptionStatus, SubscriptionUpdateDTO, SubscriptionPauseUpdateDTO } from './subscription.model';
import { UtilService } from '../utils/util.service';
import { GetUser } from '../utils/jwt.strategy';
import { SettingService } from '../settings/settings.service'
import { StripeService } from '../utils/stripe.service';
import { AddressService } from '../address/address.service'
import { ProductService } from '../products/products.service'
import { SubscriptionStatusService } from '../subscription-status/subscription-status.service'
@Controller('subscriptions')
@ApiUseTags('Subscriptions')
export class SubscriptionController {
	constructor(
		private subscriptionService: SubscriptionService,
		private utilService: UtilService,
		private settingService: SettingService,
		private stripeService: StripeService,
		private addressService: AddressService,
		private productService: ProductService,
		private subscriptionStatusService: SubscriptionStatusService
	) {
	}


	@Get('/detail/:subscriptionId')
	@ApiOperation({ title: 'Get subscription details with status history' })
	@ApiResponse({ status: 200, description: 'Return list wallet transaction', type: String })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async subscriptionDetails(@GetUser() user: UsersDTO, @Param('subscriptionId') subscriptionId: string): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const promise = await Promise.all([
				this.subscriptionService.getSubscriptionById(subscriptionId),
				this.subscriptionStatusService.getSubscriptionsStatusList(subscriptionId)
			]);

			let subscriptionData = promise[0];
			let subscriptionStatusData = promise[1];

			if (!subscriptionData) this.utilService.badRequest(ResponseMessage.SUBSCRIPTION_NOT_FOUND);

			return this.utilService.successResponseData({subscription: subscriptionData, subscriptionStatus: subscriptionStatusData});
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/list')
	@ApiOperation({ title: 'Get sunscription list' })
	@ApiResponse({ status: 200, description: 'Return list wallet transaction', type: String })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async subscriptionList(@GetUser() user: UsersDTO, @Query() userQuery: UserQuery): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			let pagination = this.utilService.getUserPagination(userQuery);
			let subscriptionData = await this.subscriptionService.getSubscriptionsByUserId(user._id.toString(), pagination.page, pagination.limit);
			if (!subscriptionData) this.utilService.badRequest(ResponseMessage.SUBSCRIPTION_NOT_FOUND);
			return this.utilService.successResponseData(subscriptionData);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/add')
	@ApiOperation({ title: 'Add product to subscription' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async addSubscription(@GetUser() user: UsersDTO, @Body() subscriptionData: any): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			console.log("subscriptionData", JSON.stringify(subscriptionData))
			let address = await this.addressService.getAddressDetail(user._id, subscriptionData.address);
			if (!address) this.utilService.badRequest(ResponseMessage.ADDRESS_NOT_FOUND);
			let product = await this.productService.getProductDetail(subscriptionData.products[0].productId);
			if (!product) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);
			let subProducts;
			let unit, subscriptionTotal = 0, subScriptionAmount = 0;
			const variant = product.variant.find(val => val.unit == subscriptionData.products[0]["unit"]);
			if (variant) {
				unit = variant['unit'];
				subScriptionAmount = variant['subScriptionAmount'];
			}
			subscriptionTotal = Number((Number(subScriptionAmount) * Number(subscriptionData.products[0].quantity)).toFixed(2));
			if (product.productImages.length > 0) {
				subProducts = {
					productId: product._id.toString(),
					productName: product.title,
					productDescription: subscriptionData.products[0].productDescription,
					variantId: subscriptionData.products[0].variantId,
					unit: unit,
					quantity: subscriptionData.products[0].quantity,
					subscriptionTotal: subscriptionTotal,
					subScriptionAmount: subScriptionAmount,
					imageUrl: product.productImages[0].imageUrl,
					filePath: product.productImages[0].filePath,
					productImages: product.productImages,
					categoryId: product.categoryId ? product.categoryId.toString() : null,
					subCategoryId: product.subCategoryId ? product.subCategoryId.toString() : null
				};
			} else {
				subProducts = {
					productId: product._id.toString(),
					productName: product.title,
					productDescription: subscriptionData.products[0].productDescription,
					variantId: subscriptionData.products[0].variantId,
					unit: unit,
					subScriptionAmount: subScriptionAmount,
					quantity: subscriptionData.products[0].quantity,
					subscriptionTotal: subscriptionTotal,
					imageUrl: product.imageUrl,
					filePath: product.filePath,
					productImages: [],
					categoryId: product.categoryId ? product.categoryId.toString() : null,
					subCategoryId: product.subCategoryId ? product.subCategoryId.toString() : null
				};
			}
			subscriptionData.products[0] = subProducts;
			subscriptionData.userId = user._id;
			subscriptionData.address = address;
			subscriptionData.status = SubscriptionStatus.ACTIVE;
			
			const subscription = await this.subscriptionService.createSubscription(subscriptionData);
			if (subscription) return this.utilService.successResponseMsg(ResponseMessage.SUBSCRIPTION_SAVED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/:subscriptionId')
	@ApiOperation({ title: 'update subscription' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateSubscription(@GetUser() user: UsersDTO, @Body() subscriptionData: SubscriptionUpdateDTO, @Param('subscriptionId') subscriptionId: string): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			let subscription = await this.subscriptionService.getSubscriptionById(subscriptionId);
			if (!subscription) this.utilService.badRequest(ResponseMessage.SUBSCRIPTION_NOT_FOUND);
			if (subscriptionData.address) {
				let address = await this.addressService.getAddressDetail(user._id, subscriptionData.address);
				if (!address) this.utilService.badRequest(ResponseMessage.ADDRESS_NOT_FOUND);
				subscription.address = address;
			}
			if (subscriptionData.schedule) subscription.schedule = subscriptionData.schedule;
	
			if (subscriptionData.quantity) {
				subscription.products[0].quantity = subscriptionData.quantity;
				subscription.products[0].subscriptionTotal =  Number((Number(subscription.products[0].subScriptionAmount) * Number(subscriptionData.quantity)).toFixed(2))
			}

			await this.subscriptionService.updateSubscription(subscriptionId, subscription);
			return this.utilService.successResponseMsg(ResponseMessage.SUBSCRIPTION_UPDATED);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/update-status-cancel/:subscriptionId')
	@ApiOperation({ title: 'Update status to cancel' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async cancelSubscription(@GetUser() user: UsersDTO, @Param('subscriptionId') subscriptionId: string): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			let subscription = await this.subscriptionService.getSubscriptionById(subscriptionId);
			if (!subscription) this.utilService.badRequest(ResponseMessage.SUBSCRIPTION_NOT_FOUND);
			subscription.status = SubscriptionStatus.CANCELLED;
			await this.subscriptionService.updateSubscription(subscriptionId, subscription);
			return this.utilService.successResponseMsg(ResponseMessage.SUBSCRIPTION_CANCELLED);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/update-status-pause/:subscriptionId')
	@ApiOperation({ title: 'Update status to pause' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async pauseSubscription(@GetUser() user: UsersDTO, @Body() subscriptionData: SubscriptionPauseUpdateDTO, @Param('subscriptionId') subscriptionId: string): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			let subscription = await this.subscriptionService.getSubscriptionById(subscriptionId);
			if (!subscription) this.utilService.badRequest(ResponseMessage.SUBSCRIPTION_NOT_FOUND);
			subscription.pauseStartDate = subscriptionData.pauseStartDate;
			subscription.pauseEndDate = subscriptionData.pauseEndDate;
			subscription.status = SubscriptionStatus.PAUSE;

			await this.subscriptionService.updateSubscription(subscriptionId, subscription);
			return this.utilService.successResponseMsg(ResponseMessage.SUBSCRIPTION_PAUSED);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/update-status-active/:subscriptionId')
	@ApiOperation({ title: 'Update status to active' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async resumeSubscription(@GetUser() user: UsersDTO, @Param('subscriptionId') subscriptionId: string): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			let subscription = await this.subscriptionService.getSubscriptionById(subscriptionId);
			if (!subscription) this.utilService.badRequest(ResponseMessage.SUBSCRIPTION_NOT_FOUND);
			subscription.pauseStartDate = null;
			subscription.pauseEndDate = null;
			subscription.status = SubscriptionStatus.ACTIVE;
			await this.subscriptionService.updateSubscription(subscriptionId, subscription);
			return this.utilService.successResponseMsg(ResponseMessage.SUBSCRIPTION_RESUMED);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
}