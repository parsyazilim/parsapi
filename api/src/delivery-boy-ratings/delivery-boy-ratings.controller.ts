import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { UsersDTO } from '../users/users.model';
import { ResponseSuccessMessage, ResponseBadRequestMessage, ResponseErrorMessage, CommonResponseModel, ResponseMessage } from '../utils/app.model';
import { GetUser } from '../utils/jwt.strategy';
import { DeliveryBoyRatingSaveDTO } from './delivery-boy-ratings.model';
import { DeliveryBoyRatingsService } from './delivery-boy-ratings.service';
import { UtilService } from '../utils/util.service';
import { OrderService } from '../order/order.service'
import { OrderStatusType } from '../order/order.model';
import { AuthGuard } from '@nestjs/passport';

@Controller('delivery-boy-ratings')
@ApiUseTags('Delivery Boy Ratings')
export class DeliveryBoyRatingsController {
	constructor(
		private deliveryBoyRatingService: DeliveryBoyRatingsService,
		private utilService: UtilService,
		private orderService: OrderService
	) {
	}

	@Post('/rate')
	@ApiOperation({ title: 'Rate delivery boy for an order' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async rateDeliveryBoy(@GetUser() user: UsersDTO, @Body() ratingData: DeliveryBoyRatingSaveDTO): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const isOrderDelivered = await this.orderService.getOrderDetailForUser(user._id, ratingData.orderId);
			if (isOrderDelivered.orderStatus !== OrderStatusType.DELIVERED) this.utilService.badRequest(ResponseMessage.ORDER_NOT_DELIVERED);

			const ratingExist = await this.deliveryBoyRatingService.getDeliveryBoyRatingForUser(user._id, ratingData.orderId);
			if (ratingExist) this.utilService.badRequest(ResponseMessage.DELIVERY_BOY_ALREADY_RATED_BY_USER);

			let rating = await this.deliveryBoyRatingService.saveDeliveryBoyRating(user._id, ratingData);
			let orderUpdated = await this.orderService.updateOrderRatedByUser(user._id, ratingData.orderId);
			if (orderUpdated) return this.utilService.successResponseMsg(ResponseMessage.RATING_SAVED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

}
