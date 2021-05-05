import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { FavouriteService } from './favourites.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiUseTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersDTO } from '../users/users.model';
import { FavouritesDTO, ResponseFavouritesDTO } from './favourites.model';
import { UtilService } from '../utils/util.service';
import { UserRoles, ResponseMessage, ResponseSuccessMessage, ResponseErrorMessage, CommonResponseModel, ResponseBadRequestMessage } from '../utils/app.model';
import { ProductService } from '../products/products.service';
import { CartService } from '../cart/cart.service';
import { GetUser } from '../utils/jwt.strategy';

@Controller('favourites')
@ApiUseTags('Favourites')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class FavouriteController {
	constructor(
		private FavouriteService: FavouriteService,
		private productService: ProductService,
		private cartService: CartService,
		private utilService: UtilService
	) {

	}

	@Get('/list')
	@ApiOperation({ title: 'Get all favourite products for user' })
	@ApiResponse({ status: 200, description: 'Return list of favourite product', type: ResponseFavouritesDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async getAllFavourite(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			let list = [];
			const favouriteList = await this.FavouriteService.getAllFavourite(user._id);

			if (favouriteList && favouriteList.productId && favouriteList.productId.length > 0) {
				const all = await Promise.all([
					this.productService.getProductByIds(favouriteList.productId),
					this.cartService.getCartByUserId(user._id)
				])
				let products = all[0];
				list = await this.productService.addCartInProduct(all[1], products);
			}
			return this.utilService.successResponseData(list || []);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/add/:productId')
	@ApiOperation({ title: 'Add product to favourite list' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async addProductToFavourite(@GetUser() user: UsersDTO, @Param('productId') productId: string): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			// TODO: Add productid validation
			let productList = [];
			const list = await this.FavouriteService.getAllFavourite(user._id);
			if (list) {
				const index = list.productId.findIndex(p => p === productId);
				if (index !== -1) this.utilService.badRequest(ResponseMessage.FAVOURITE_ALREADY_ADDED_PRODUCT);
				else {
					productList = list.productId;
					productList.push(productId);
				}
			} else productList.push(productId);

			let resData;
			if (list) resData = await this.FavouriteService.updateFavourite(user._id, productList);
			else resData = await this.FavouriteService.saveFavourite(user._id, productList);

			if (resData) return this.utilService.successResponseMsg(ResponseMessage.FAVOURITE_SAVED);
			else this.utilService.pageNotFound();
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Delete('/remove/:productId')
	@ApiOperation({ title: 'Remove product from favourite list' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async deleteFavourite(@GetUser() user: UsersDTO, @Param('productId') productId: string): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			// TODO: Add productid validation
			const list = await this.FavouriteService.getAllFavourite(user._id);
			if (list) {
				const index = list.productId.findIndex(p => p === productId);
				if (index === -1) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);
				else {
					const productList = list.productId;
					productList.splice(index, 1);
					const resData = await this.FavouriteService.updateFavourite(user._id, productList);
					if (resData) return this.utilService.successResponseMsg(ResponseMessage.FAVOURITE_DELETED);
					else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
				}
			}
			else this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
}
