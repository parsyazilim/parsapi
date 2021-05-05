import { Body, Controller, Headers, Post, UseGuards, Get, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiUseTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RatingService } from './rating.service';
import { UsersDTO } from '../users/users.model';
import { RatingSaveDTO } from './rating.model';
import { UtilService } from '../utils/util.service';
import { ResponseMessage, CommonResponseModel, ResponseSuccessMessage, ResponseBadRequestMessage, ResponseErrorMessage } from '../utils/app.model';
import { ProductService } from '../products/products.service';
import { GetUser } from '../utils/jwt.strategy';
import { CartService } from '../cart/cart.service';

@Controller('ratings')
@ApiUseTags('Ratings')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class RatingController {
	constructor(
		private ratingService: RatingService,
		private productService: ProductService,
		private cartService: CartService,
		private utilService: UtilService
	) {
	}

	@Post('/rate')
	@ApiOperation({ title: 'Rate product' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async rateProduct(@GetUser() user: UsersDTO, @Body() ratingData: RatingSaveDTO): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const isUserBought = await this.cartService.isUserBoughtProduct(user._id, ratingData.productId);
			if (!isUserBought) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_BOUGHT);

			let productDetail = await this.productService.getProductDetail(ratingData.productId);
			if (!productDetail) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);

			const ratingExist = await this.ratingService.getProductRate(user._id, ratingData.productId);
			let productUpdate = {
				noOfUsersRated: productDetail.noOfUsersRated,
				totalRating: productDetail.totalRating,
				averageRating: 0
			}

			if (ratingExist) {
				productUpdate.noOfUsersRated = productDetail.noOfUsersRated;
				productUpdate.totalRating = productDetail.totalRating + ratingData.rate - ratingExist.rate;
				productUpdate.averageRating = Number((productUpdate.totalRating / productUpdate.noOfUsersRated).toFixed(2));
				await this.ratingService.updateRating(user._id, ratingData.productId, ratingData.rate);
			} else {
				productUpdate.noOfUsersRated = productDetail.noOfUsersRated + 1;
				productUpdate.totalRating = productDetail.totalRating + ratingData.rate;
				productUpdate.averageRating = Number((productUpdate.totalRating / productUpdate.noOfUsersRated).toFixed(2));
				await this.ratingService.saveRating(user._id, ratingData);
			}

			const rating = await Promise.all([
				this.cartService.updateRating(user._id, ratingData.productId, ratingData.rate),
				this.productService.updateRating(productDetail._id, productUpdate)
			])
			if (rating) return this.utilService.successResponseMsg(ResponseMessage.RATING_SAVED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
}
