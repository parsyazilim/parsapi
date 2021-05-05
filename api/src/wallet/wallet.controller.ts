import { Controller, UseGuards, Get, Query, Body, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiImplicitQuery, ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { UsersDTO } from '../users/users.model';
import { CommonResponseModel, ResponseErrorMessage, ResponseMessage, UserQuery } from '../utils/app.model';
import { WalletService } from './wallet.service';
import { ResponseWalletHistory, ResponseWalletTopupData, WalletTopupDTO } from './wallet.model';
import { UtilService } from '../utils/util.service';
import { GetUser } from '../utils/jwt.strategy';
import { PaymentType, PAYMENT_TYPE } from '../order/order.model';
import { SettingService } from '../settings/settings.service'
import { StripeService } from '../utils/stripe.service'

@Controller('wallets')
@ApiUseTags('Wallets')
export class WalletController {
	constructor(
		private walletService: WalletService,
		private utilService: UtilService,
		private settingService: SettingService,
		private stripeService: StripeService
	) {
	}

	@Get('/history')
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiOperation({ title: 'Get wallet transaction history' })
	@ApiResponse({ status: 200, description: 'Return list wallet transaction', type: ResponseWalletHistory })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async walletHistory(@GetUser() user: UsersDTO, @Query() userQuery: UserQuery): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			let pagination = this.utilService.getUserPagination(userQuery);
			const wallets = await Promise.all([
				this.walletService.walletHistory(user._id, pagination.page, pagination.limit),
				this.walletService.countWalletHistory(user._id)
			]);
			return this.utilService.successResponseData(wallets[0], { total: wallets[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/add/money')
	@ApiOperation({ title: 'Add money to wallet' })
	@ApiResponse({ status: 200, description: 'Return sessionId', type: ResponseWalletTopupData })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async addMoneytoWallet(@GetUser() user: UsersDTO, @Body() walletData: WalletTopupDTO): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const settings = await this.settingService.getDeliveryTaxSettings();
			const amount = Math.round(Number(Number(Number(walletData.amount).toFixed(2)) * 100));
			let obj = {
				payment_method_types: ['card'],
				line_items: [
					{
						price_data: {
							currency: settings.currencyCode || "USD",
							product_data: {
								name: 'Wallet Amount',
							},
							unit_amount: amount,
						},
						quantity: 1,
					},
				],
				mode: 'payment',
				client_reference_id: user._id.toString(),
				metadata: { PAYMENT_TYPE: PAYMENT_TYPE.WALLET },
				success_url: process.env.NODE_ENV === 'production' ? process.env.WEB_URL_PRODUCTION + '/wallet-payment-successful' : process.env.WEB_URL_STAGING + '/wallet-payment-successful',
				cancel_url: process.env.NODE_ENV === 'production' ? process.env.WEB_URL_PRODUCTION + '/home' : process.env.WEB_URL_STAGING + '/home',
			}
			let session = await this.stripeService.createCheckoutSession(obj);
			if (!session.id) this.utilService.badRequest(ResponseMessage.ORDER_PAYMENT_ERROR);
			return this.utilService.successResponseData({ userId: user._id, sessionId: session.id });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
}