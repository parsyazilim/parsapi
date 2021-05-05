import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { UsersDTO } from '../users/users.model';
import { CartUpdateDTO, ResponseMyCartDetail, ShippingMethodDTO, UpdateAddressDTO } from './cart.model';
import { CouponType } from '../coupons/coupons.model';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiUseTags, ApiResponse } from '@nestjs/swagger';
import { UtilService } from '../utils/util.service';
import { SettingService } from '../settings/settings.service';
import { DeliveryType, ShippingMethod } from '../settings/settings.model';
import { AddressService } from '../address/address.service';
import { ResponseMessage, TaxName, CommonResponseModel, ResponseBadRequestMessage, ResponseErrorMessage, ResponseSuccessMessage } from '../utils/app.model';
import { CouponService } from '../coupons/coupons.service';
import { ProductService } from '../products/products.service';
import { GetUser } from '../utils/jwt.strategy';

@Controller('carts')
@ApiUseTags('Carts')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CartController {
	constructor(
		private cartService: CartService,
		private productService: ProductService,
		private settingService: SettingService,
		private addressService: AddressService,
		private couponService: CouponService,
		private utilService: UtilService
	) {
	}

	// #################################################### USER ##########################################
	@Get('/my')
	@ApiOperation({ title: 'Get my cart detail' })
	@ApiResponse({ status: 200, description: 'Return cart detail', type: ResponseMyCartDetail })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async getUsersCartList(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const cart = await this.cartService.getMyCart(user._id);
			if (cart) return this.utilService.successResponseData(cart);
			else return this.utilService.successResponseMsg(ResponseMessage.CART_ITEM_NOT_FOUND);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/verify')
	@ApiOperation({ title: 'Verify cart' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async verifyCart(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const userCart = await this.cartService.getCartByUserId(user._id);
			if (userCart) {
				const products = await this.productService.getProductByIds(userCart.productIds);
				const cartVerifyData = await this.cartService.verifyCart(products, userCart);

				if (cartVerifyData.cartArr.length > 0) this.utilService.badRequest(cartVerifyData.cartArr);
				else return this.utilService.successResponseMsg(ResponseMessage.CART_VERIFIED);
			}
			else this.utilService.badRequest(ResponseMessage.CART_ITEM_NOT_FOUND);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/update')
	@ApiOperation({ title: 'Add or update product in my cart' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseMyCartDetail })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async updateProductInCart(@GetUser() user: UsersDTO, @Body() cartData: CartUpdateDTO): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const userCart = await this.cartService.getCartByUserId(user._id);

			let updatedData;
			let cartInfo = {
				isFreeDelivery: false,
				productIds: [],
				subTotal: 0,
				tax: 0,
				grandTotal: 0,
				deliveryCharges: 0,
				shippingMethod: ShippingMethod.DELIVERY,
				isOrderLinked: false,
				userId: user._id,
				products: userCart ? (userCart.products ? userCart.products : []) : [],
			};

			if (userCart) {
				userCart["walletAmount"] = 0;
				cartInfo = userCart;
			}
			const product = await this.productService.getProductDetail(cartData.productId);
			const outOfStockOrLeft = await this.cartService.checkOutOfStockOrLeft(product, cartData);
			if (outOfStockOrLeft) this.utilService.badRequest(outOfStockOrLeft);

			const cartIndex = cartInfo.products.findIndex(val => val.productId == cartData.productId);
			if (cartIndex !== -1) cartInfo.products[cartIndex].quantity = cartData.quantity;
			else cartInfo.productIds.push(product._id);

			const productPrice = this.cartService.calculateProductPrice(product, cartData);
			if (cartIndex !== -1) cartInfo.products[cartIndex] = productPrice;
			else cartInfo.products.push(productPrice);

			const deliveryTax = await this.settingService.getDeliveryTaxSettings();
			let response;
			if (userCart && userCart.deliveryAddress) {
				const address = await this.addressService.getAddressDetail(user._id, userCart.deliveryAddress);
				response = await this.cartService.calculateTotal(cartInfo, deliveryTax, address);
			} else {
				response = await this.cartService.calculateTotal(cartInfo, deliveryTax);
			}
			let message = '';
			if (userCart) {
				updatedData = await this.cartService.updateCart(userCart._id, response);
				message = await this.utilService.getTranslatedMessageByKey(ResponseMessage.CART_UPDATED_PRODUCT);
			} else {
				updatedData = await this.cartService.saveCart(response);
				message = await this.utilService.getTranslatedMessageByKey(ResponseMessage.CART_ADDED_PRODUCT);
			}
			if (updatedData) return this.utilService.successResponseData(updatedData, { message: message });
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/remove/:productId')
	@ApiOperation({ title: 'remove product from my cart' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseMyCartDetail })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async removeProductFromCart(@GetUser() user: UsersDTO, @Param('productId') productId: string): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const userCart = await this.cartService.getCartByUserId(user._id);
			if (!userCart) this.utilService.badRequest(ResponseMessage.CART_NOT_FOUND);
			userCart.walletAmount = 0;
			const cartIndex = userCart.productIds.findIndex(c => c == productId);
			if (cartIndex === -1) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);
			userCart.productIds.splice(cartIndex, 1);

			const productIndex = userCart.products.findIndex(p => p.productId == productId);
			userCart.products.splice(productIndex, 1);

			const deliveryTax = await this.settingService.getDeliveryTaxSettings();
			let response;
			if (userCart.deliveryAddress) {
				const address = await this.addressService.getAddressDetail(user._id, userCart.deliveryAddress);
				response = await this.cartService.calculateTotal(userCart, deliveryTax, address);
			} else {
				response = await this.cartService.calculateTotal(userCart, deliveryTax);
			}

			const updatedData = await this.cartService.updateCart(userCart._id, response);
			if (updatedData) return this.utilService.successResponseData(updatedData);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/update-address')
	@ApiOperation({ title: 'update address for my cart' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseMyCartDetail })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async addAddress(@GetUser() user: UsersDTO, @Body() addressData: UpdateAddressDTO): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const address = await this.addressService.getAddressDetail(user._id, addressData.deliveryAddress);
			if (!address) this.utilService.badRequest(ResponseMessage.ADDRESS_NOT_FOUND);

			const userCart = await this.cartService.getCartByUserId(user._id);
			if (!userCart) this.utilService.badRequest(ResponseMessage.CART_NOT_FOUND);

			const deliveryTax = await this.settingService.getDeliveryTaxSettings();
			userCart.deliveryCharges = await this.cartService.calculateDeliveryCharge(deliveryTax, userCart.subTotal, address);
			userCart.deliveryAddress = address._id;
			const upadatedCart = await this.cartService.calculateTotal(userCart);

			const updatedData = await this.cartService.updateAddressInCart(userCart._id, upadatedCart);
			if (updatedData) return this.utilService.successResponseData(updatedData);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/update-shipping-method')
	@ApiOperation({ title: 'update delivery method my cart' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseMyCartDetail })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async updateShippingMethod(@GetUser() user: UsersDTO, @Body() shippingMethodData: ShippingMethodDTO): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const userCart = await this.cartService.getCartByUserId(user._id);
			if (!userCart) this.utilService.badRequest(ResponseMessage.CART_NOT_FOUND);

			const deliveryTax = await this.settingService.getDeliveryTaxSettings();
			let deliveryCharges = 0;
			let address = null;
			if (shippingMethodData.shippingMethod === ShippingMethod.PICK_UP) {
				userCart.shippingMethod = ShippingMethod.PICK_UP;
				deliveryCharges = 0;
			} else {
				userCart.shippingMethod = ShippingMethod.DELIVERY;
				if (userCart.deliveryAddress) {
					address = await this.addressService.getAddressDetail(user._id, userCart.deliveryAddress);
					if (!address) this.utilService.badRequest(ResponseMessage.ADDRESS_NOT_FOUND);
					deliveryCharges = await this.cartService.calculateDeliveryCharge(deliveryTax, userCart.subTotal, address);
				}
			}

			if (deliveryTax.minOrderAmountForFree && userCart.subTotal >= deliveryTax.minOrderAmountForFree) deliveryCharges = 0;
			userCart.deliveryCharges = deliveryCharges;

			const upadatedCart = await this.cartService.calculateTotal(userCart, deliveryTax, address);
			const updatedData = await this.cartService.updateCart(userCart._id, upadatedCart);
			if (updatedData) return this.utilService.successResponseData(updatedData);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}




	@Post('/apply-coupon/:couponCode')
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseMyCartDetail })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@ApiOperation({ title: 'Apply coupon for my cart' })
	public async applyCoupon(@GetUser() user: UsersDTO, @Param('couponCode') couponCode: string): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const coupon = await this.couponService.getCouponDetailByCode(couponCode);
			if (!coupon) this.utilService.badRequest(ResponseMessage.COUPON_NOT_FOUND);
			const currentDate = Date.now();
			let couponDiscount = 0;

			if (coupon.startDate < currentDate && coupon.expiryDate > currentDate) {
				const userCart = await this.cartService.getCartByUserId(user._id);
				if (!userCart) this.utilService.badRequest(ResponseMessage.CART_NOT_FOUND);

				if (coupon.couponType === CouponType.PERCENTAGE) couponDiscount = Number((userCart.subTotal * (coupon.offerValue / 100)).toFixed(2));
				else if (coupon.couponType === CouponType.AMOUNT) couponDiscount = Number(coupon.offerValue);

				userCart.couponCode = couponCode;
				userCart.couponAmount = couponDiscount;
				userCart.walletAmount = 0;
				const upadatedCart = await this.cartService.calculateTotal(userCart);

				const updatedData = await this.cartService.updateCart(userCart._id, upadatedCart);
				if (updatedData) return this.utilService.successResponseData(updatedData);
				else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
			}
			else this.utilService.badRequest(ResponseMessage.COUPON_EXPIRED);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Delete('/remove-coupon/:couponCode')
	@ApiOperation({ title: 'Remove coupon for my cart' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async removeCoupon(@GetUser() user: UsersDTO, @Param('couponCode') couponCode: string): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const userCart = await this.cartService.getCartByUserId(user._id);
			if (!userCart) this.utilService.badRequest(ResponseMessage.CART_NOT_FOUND);

			if (userCart.couponCode !== couponCode) this.utilService.badRequest(ResponseMessage.COUPON_NOT_FOUND);

			userCart.couponCode = null;
			userCart.couponAmount = 0;
			userCart.walletAmount = 0;
			const upadatedCart = await this.cartService.calculateTotal(userCart);
			const updatedData = await this.cartService.updateCart(userCart._id, upadatedCart);

			if (updatedData) return this.utilService.successResponseData(updatedData);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/apply-wallet')
	@ApiOperation({ title: 'Apply wallet for my cart' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseMyCartDetail })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async applyWallet(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const userWalletAmount = user.walletAmount;
			if (!userWalletAmount) this.utilService.badRequest(ResponseMessage.WALLET_INSUFFICENT_AMOUNT);

			const userCart = await this.cartService.getCartByUserId(user._id);
			if (!userCart) this.utilService.badRequest(ResponseMessage.CART_NOT_FOUND);

			let grandTotal = userCart.grandTotal + userCart.walletAmount;
			let walletAmount = 0;

			if (userWalletAmount >= grandTotal) walletAmount = grandTotal;
			else walletAmount = userWalletAmount;

			userCart.walletAmount = walletAmount;
			const upadatedCart = await this.cartService.calculateTotal(userCart);
			const updatedData = await this.cartService.updateCart(userCart._id, upadatedCart);
			if (updatedData) return this.utilService.successResponseData(updatedData);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Delete('/remove-wallet')
	@ApiOperation({ title: 'Remove wallet for my cart' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseMyCartDetail })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async removeWallet(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const userCart = await this.cartService.getCartByUserId(user._id);
			if (!userCart) this.utilService.badRequest(ResponseMessage.CART_NOT_FOUND);

			userCart.walletAmount = 0;
			const upadatedCart = await this.cartService.calculateTotal(userCart);
			const updatedData = await this.cartService.updateCart(userCart._id, upadatedCart);
			if (updatedData) return this.utilService.successResponseData(updatedData);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Delete('/delete')
	@ApiOperation({ title: 'Remove all product from cart' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async deleteAllProducts(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const userCart = await this.cartService.getCartByUserId(user._id);
			if (!userCart) this.utilService.badRequest(ResponseMessage.CART_NOT_FOUND);

			const deleteCart = await this.cartService.deleteCart(userCart._id);
			if (deleteCart) return this.utilService.successResponseMsg(ResponseMessage.CART_DELETED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
}
