import { Body, Controller, Query, Get, Param, Post, UseGuards, Put, Res, Req, Delete } from '@nestjs/common';
import { OrderService } from './order.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiUseTags, ApiResponse, ApiOperation, ApiImplicitQuery } from '@nestjs/swagger';
import { UsersDTO } from '../users/users.model';
import { OrderPosPaymentUpdateDTO, OrderAddItemDTO, OrderUpdateDTO, OrderPosDTO, OrderStatusDTO, AssignOrderDTO, PaymentType, OrderStatusType, PaymentFrom, OrderFilterQuery, OrderCreateDTO, StripePaymentStatus, DBStatusUpdateDTO, ResponseOrderDTOPagination, ResponseDataOfOrder, ResponseOrderAdminListDTO, ResponseOrderForAdmin, ResponseOrderDetailsOrderId, ResponseStatusList, ResponseChardOrderDTO, ResponseDeiveryBoyPagination, ResponseDeliveredOrderPagination, PaymentStatusType, ResponseAdminOrderDetailsOrderId, OrderStartEndDTO, ResponseSalesTable, OrderGraphsDTO, TransactionStatusType, PAYMENT_TYPE } from './order.model';
import { ResponseMessage, AdminSettings, CommonResponseModel, ResponseErrorMessage, ResponseBadRequestMessage, ResponseSuccessMessage, UserQuery } from '../utils/app.model';
import { UtilService } from '../utils/util.service';
import { WalletService } from '../wallet/wallet.service';
import { WalletSaveDTO, WalletTransactionType } from '../wallet/wallet.model';
import { AppGateway } from '../app.gateway';
import { ProductService } from '../products/products.service';
import { CartService } from '../cart/cart.service';
import { AddressService } from '../address/address.service';
import { SettingService } from '../settings/settings.service';
import { SequenceService } from '../sequence/sequence.service';
import { UserService } from '../users/users.service';
import { PaymentMethod, ShippingMethod } from '../settings/settings.model';
import { NotificationSaveDTO, NotificationType } from '../notifications/notifications.model';
import { NotificationService } from '../notifications/notifications.service';
import { PushService } from '../utils/push.service';
import { StripeService } from '../utils/stripe.service';
import { CategoryService } from '../categories/categories.service';
import { GetUser } from '../utils/jwt.strategy';
import { EmailService } from '../utils/email.service';
import { BusinessService } from '../business/business.service';
import { ProductOutOfStockService } from '../product-out-of-stock/product-out-of-stock.service';
import { DeliveryBoyRatingsService } from '../delivery-boy-ratings/delivery-boy-ratings.service';
import { CouponService } from '../coupons/coupons.service';
import { CouponType } from '../coupons/coupons.model';
import { PageModule } from 'src/pages/pages.module';

const moment = require('moment');
const ObjectID = require('mongodb').ObjectID;

@Controller('orders')
@ApiUseTags('Orders')
export class OrderController {
	constructor(
		private orderService: OrderService,
		private utilService: UtilService,
		private cartService: CartService,
		private walletService: WalletService,
		private addressService: AddressService,
		private settingService: SettingService,
		private productService: ProductService,
		private categoryService: CategoryService,
		private sequenceService: SequenceService,
		private userService: UserService,
		private notificationService: NotificationService,
		private pushService: PushService,
		private stripeService: StripeService,
		private emailService: EmailService,
		private socketService: AppGateway,
		private businessService: BusinessService,
		private productOutOfStockService: ProductOutOfStockService,
		private deliveryBoyRatingsService: DeliveryBoyRatingsService,
		private couponService: CouponService,
	) {
	}

	// ########################################################### USER ###########################################################
	@Get('/list')
	@ApiOperation({ title: 'Get all order for user' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of order for user', type: ResponseOrderDTOPagination })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async GetOrderListForUser(@GetUser() user: UsersDTO, @Query() userQuery: UserQuery): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			let isSubscriptionOrder;
			let pagination = this.utilService.getUserPagination(userQuery);
			console.log("userQuery", userQuery)
			if (userQuery.type === 'PURCHASES') isSubscriptionOrder = false
			if (userQuery.type === 'SUBSCRIPTIONS') isSubscriptionOrder = true
			console.log("isSubscriptionOrder", isSubscriptionOrder)

			const orders = await Promise.all([
				this.orderService.getAllOrderForUser(isSubscriptionOrder, user._id, pagination.page, pagination.limit),
				this.orderService.countAllOrderForUser(isSubscriptionOrder, user._id)
			])
			return this.utilService.successResponseData(orders[0], { total: orders[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/detail/:orderId')
	@ApiOperation({ title: 'Get order detail by orderId for user' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseDataOfOrder })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getOrderDetailForUser(@GetUser() user: UsersDTO, @Param('orderId') orderId: string): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			let order = await this.orderService.getOrderDetailForUser(user._id, orderId);
			if (!order) this.utilService.pageNotFound();
			if (!order.isSubscriptionOrder) {
				let cart = await this.cartService.getCartById(order.cartId);
				const ratings = await this.cartService.findProductsById(user._id, cart.productIds);
				cart = JSON.parse(JSON.stringify(cart));
				order = JSON.parse(JSON.stringify(order));
				order.cart.map(p => {
					const pro = ratings.find(r => r.productId == p.productId)
					if (pro) { p.isRated = pro.isRated; p.rating = pro.rating; }
				});
				delete order.cartId;
			}
			return this.utilService.successResponseData({ order: order });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/create')
	@ApiOperation({ title: 'Create order' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async placeOrder(@GetUser() userData: UsersDTO, @Body() orderData: OrderCreateDTO) {
		this.utilService.validateUserRole(userData);
		try {
			if (!(orderData.paymentType == PaymentType.STRIPE || orderData.paymentType == PaymentType.COD)) orderData.paymentType = PaymentType.COD;

			const userCart = await this.cartService.getCartByUserId(userData._id);
			if (!userCart) this.utilService.badRequest(ResponseMessage.CART_ITEM_NOT_FOUND);
			console.log("-----userCart------", userCart);
			if (userCart.shippingMethod === ShippingMethod.DELIVERY && !userCart.deliveryAddress) this.utilService.badRequest(ResponseMessage.ADDRESS_NOT_FOUND);
			// if (!userCart.deliveryAddress) this.utilService.badRequest(ResponseMessage.ADDRESS_NOT_FOUND);

			const settings = await this.settingService.getDeliveryTaxSettings();


			// coupon validation
			if (userCart.couponCode) {
				const coupon = await this.couponService.getCouponDetailByCode(userCart.couponCode);
				if (!coupon) this.utilService.badRequest(ResponseMessage.COUPON_NOT_FOUND);
				const currentDate = Date.now();
				if (coupon.startDate < currentDate && coupon.expiryDate > currentDate) { }
				else this.utilService.badRequest(ResponseMessage.COUPON_EXPIRED);
			}

			// const userAdress = await this.addressService.getAddressDetail(userData._id, userCart.deliveryAddress);
			// const storeLocation = { latitude: settings.location.latitude, longitude: settings.location.longitude };
			// const userLocation = { latitude: userAdress.location.latitude, longitude: userAdress.location.longitude };
			// const preciseDistance = this.utilService.calculateDistance(userLocation, storeLocation);
			// if (preciseDistance > settings.deliveryCoverage) this.utilService.badRequest(ResponseMessage.ADDDRESS_DELIVERY_LOCATION_NOT_AVAILABLE);

			// if (settings && userCart.subTotal < settings.minimumOrderAmountToPlaceOrder) {
			// 	const resMsg = await this.utilService.getTranslatedMessageByKey(ResponseMessage.ORDER_MINIMUM_AMOUNT_PLACE_ORDER);
			// 	this.utilService.badRequest(`${resMsg}` + settings.minimumOrderAmountToPlaceOrder);
			// }
			if (userCart.shippingMethod === ShippingMethod.DELIVERY && settings && userCart.subTotal < settings.minimumOrderAmountToPlaceOrder) {
				const resMsg = await this.utilService.getTranslatedMessageByKey(ResponseMessage.ORDER_MINIMUM_AMOUNT_PLACE_ORDER);
				this.utilService.badRequest(`${resMsg}` + settings.minimumOrderAmountToPlaceOrder);
			}
			const products = await this.productService.getProductByIds(userCart.productIds);
			const cartVerifyData = await this.cartService.verifyCart(products, userCart);

			if (cartVerifyData.cartArr.length > 0) this.utilService.badRequest(cartVerifyData.cartArr);

			if (userCart.walletAmount > 0) {
				if (userData.walletAmount < userCart.walletAmount) this.utilService.badRequest(ResponseMessage.WALLET_INSUFFICENT_AMOUNT);
			}

			let order = {
				subTotal: 0,
				tax: 0,
				taxInfo: {
					taxName: '',
					amount: ''
				},
				product: {
					title: '',
					imageUrl: ''
				},
				totalProduct: 0,
				grandTotal: 0,
				deliveryCharges: 0,
				deliveryAddress: '',
				deliveryInstruction: '',
				couponCode: 0,
				couponAmount: 0,
				transactionDetails: {
					transactionStatus: '',
					receiptUrl: '',
					transactionId: '',
					currency: '',
					paymentCount: 0,
					paymentMethod: '',
					transactionDate: 0,
					transactionAmount: 0
				},
				address: null,
				storeAddress: null,
				user: null,
				userId: '',
				paymentType: '',
				shippingMethod: '',
				orderStatus: '',
				paymentStatus: PaymentStatusType.PENDING,
				cartId: '',
				orderID: 0,
				deliveryDate: '',
				deliveryTime: '',
				isWalletUsed: false,
				usedWalletAmount: 0,
				amountRefunded: 0,
				currencySymbol: "",
				currencyCode: "",
				invoiceToken: '',
				orderFrom: orderData.orderFrom,
				cart: []
			};

			if (!orderData.deliverySlotId) this.utilService.badRequest(ResponseMessage.DELIEVRY_SLOT_NOT_SELECTED);

			const deliveryTimeSlots = await this.settingService.getDeliveryTimeSlots();
			const availableSlots = await this.settingService.getAvailableTimeSlot(deliveryTimeSlots['deliveryTimeSlots']);
			let openSlots = [];
			availableSlots.map(day => {
				day.timings.map(time => { openSlots[time._id] = { date: day.date, slot: time.slot }; })
			})

			const selectedTimeslot = openSlots[orderData.deliverySlotId];
			if (!selectedTimeslot) this.utilService.badRequest(ResponseMessage.DELIEVRY_SLOT_NOT_AVAILABLE);

			order.deliveryDate = selectedTimeslot.date;
			order.deliveryTime = selectedTimeslot.slot;
			order.deliveryInstruction = orderData.deliveryInstruction ? orderData.deliveryInstruction : '';
			order.shippingMethod = userCart.shippingMethod;
			order.subTotal = userCart.subTotal;
			order.tax = userCart.tax;
			order.grandTotal = userCart.grandTotal;
			order.deliveryCharges = userCart.deliveryCharges;
			order.currencyCode = settings.currencyCode;
			order.currencySymbol = settings.currencySymbol;
			order.transactionDetails = {
				transactionStatus: null,
				receiptUrl: null,
				transactionId: null,
				currency: null,
				paymentCount: 0,
				paymentMethod: null,
				transactionDate: Date.now(),
				transactionAmount: order.grandTotal
			};
			order.couponCode = userCart.couponCode;
			order.couponAmount = userCart.couponAmount;

			if (userCart.walletAmount) {
				order.usedWalletAmount = userCart.walletAmount;
				order.isWalletUsed = true;
				if (order.grandTotal === 0) {
					order.paymentStatus = PaymentStatusType.SUCCESS;
				}
			}

			if (userCart.shippingMethod === ShippingMethod.DELIVERY) {
				order.deliveryAddress = userCart.deliveryAddress
				const userAdress = await this.addressService.getAddressDetail(userData._id, userCart.deliveryAddress);
				if (userAdress) {
					order.address = {
						address: userAdress.address,
						flatNo: userAdress.flatNo,
						postalCode: userAdress.postalCode,
						addressType: userAdress.addressType,
						apartmentName: userAdress.apartmentName,
						landmark: userAdress.landmark,
						location: userAdress.location
					}
				}
			} else if (userCart.shippingMethod === ShippingMethod.PICK_UP) {
				const businessInfo = await this.businessService.getBussinessDetailForUser();
				if (businessInfo) {
					order.storeAddress = {
						address: businessInfo.address,
						location: settings.location
					}
				}
			}

			order.user = {
				firstName: userData.firstName,
				lastName: userData.lastName,
				mobileNumber: userData.mobileNumber,
				email: userData.email,
				countryCode: userData.countryCode,
				countryName: userData.countryName
			}

			order.userId = userData._id;
			order.paymentType = orderData.paymentType;
			order.orderStatus = OrderStatusType.PENDING;
			order.cartId = userCart._id;
			order.totalProduct = userCart.products.length;
			order.product = {
				title: userCart.products[0].productName,
				imageUrl: userCart.products[0].imageUrl
			}
			// FOR GRAPH
			order.cart = userCart.products;
			order.taxInfo = userCart.taxInfo;
			order.invoiceToken = await this.utilService.getUUID();
			let sequence = await this.sequenceService.getSequence()
			order.orderID = sequence ? sequence.sequenceNo : Math.floor(900000 * Math.random()) + 100000;
			const orderRes = await this.orderService.createOrder(order);

			if (orderRes) {
				let session: any;
				if (orderData.paymentType === PaymentType.STRIPE) {
					const amount = Math.round(Number(Number(order.grandTotal.toFixed(2)) * 100));
					let obj = {
						payment_method_types: ['card'],
						line_items: [
							{
								price_data: {
									currency: settings.currencyCode || "USD",
									product_data: {
										name: 'Grocery-item',
									},
									unit_amount: amount,
								},
								quantity: 1,
							},
						],
						client_reference_id: orderRes._id.toString(),
						metadata: { PAYMENT_TYPE: PAYMENT_TYPE.ORDER },
						mode: 'payment',
						success_url: process.env.NODE_ENV === 'production' ? process.env.WEB_URL_PRODUCTION + '/thank-you' : process.env.WEB_URL_STAGING + '/thank-you',
						cancel_url: process.env.NODE_ENV === 'production' ? process.env.WEB_URL_PRODUCTION + '/home' : process.env.WEB_URL_STAGING + '/home',
					}
					session = await this.stripeService.createCheckoutSession(obj);
					if (!session.id) this.utilService.badRequest(ResponseMessage.ORDER_PAYMENT_ERROR);
				}
				if (cartVerifyData && cartVerifyData.productArr.length) {
					for (let prods of cartVerifyData.productArr) {
						await this.productService.updateProductStock(prods._id, prods.variant);
					}
				}
				if (cartVerifyData.productOutOfStock && cartVerifyData.productOutOfStock.length) {
					const productStockData = await Promise.all([
						this.notificationService.createForProductOutOfStock(cartVerifyData.productOutOfStock),
						this.productOutOfStockService.createProductStock(cartVerifyData.productOutOfStock),

					]);
				}
				const walletPayment: WalletSaveDTO = {
					userId: userData._id,
					orderId: orderRes._id,
					orderID: orderRes.orderID,
					amount: orderRes.usedWalletAmount
				}

				if (walletPayment.amount > 0) await this.walletService.madeOrder(walletPayment);

				const placed = await Promise.all([
					this.userService.updateWallet(userData._id, -orderRes.usedWalletAmount),
					this.cartService.cartOrderUnlink(userCart._id)
				]);

				this.socketService.sendProductOutOfStocksNotificationToAdmin(cartVerifyData.productOutOfStock);
				if (order.paymentType === PaymentType.STRIPE) {
					return this.utilService.successResponseData({ id: orderRes._id, sessionId: session.id });
				}
				const notification: NotificationSaveDTO = {
					notifyType: NotificationType.ORDER_PLACED,
					orderId: orderRes._id,
					orderID: orderRes.orderID,
				}
				this.notificationService.createForOrderPlaced(notification)
				if (userData && userData.playerId) {
					const title = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_PLACED_TITLE);
					let desc = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_PLACED_DESC);
					desc = desc.replace('${orderID}', orderRes.orderID);
					this.pushService.sendNotificationToUser(userData.playerId, title, desc);
				}
				this.emailService.sendEmailForPlacedOrder(orderRes);
				this.socketService.sendOrderStatusNotificationToAdmin(notification);
				return this.utilService.successResponseMsg(ResponseMessage.ORDER_PLACED);
			}
		} catch (e) {
			if (e && e.type && e.type === 'StripeInvalidRequestError') this.utilService.badRequest(e.raw.message);
			else this.utilService.errorResponse(e);
		}
	}

	@Put('/cancel/:orderId')
	@ApiOperation({ title: 'Cancel order' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async orderCancelledByUser(@GetUser() user: UsersDTO, @Param('orderId') orderId: string): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const order = await this.orderService.getOrderDetailForCancel(user._id, orderId);
			if (!order) this.utilService.badRequest(ResponseMessage.ORDER_NOT_FOUND);
			if (order.orderStatus === OrderStatusType.DELIVERED) this.utilService.badRequest(ResponseMessage.ORDER_ALREADY_DELIVERED);
			let amountRefund = 0;
			if (order.paymentType === PaymentMethod.COD && order.isWalletUsed && order.usedWalletAmount) amountRefund = order.usedWalletAmount;
			else if (order.paymentStatus === PaymentStatusType.SUCCESS && order.paymentType === PaymentMethod.STRIPE) amountRefund = order.grandTotal + order.usedWalletAmount;
			else if (order.paymentStatus === PaymentStatusType.FAILED && order.isWalletUsed && order.usedWalletAmount) amountRefund = order.usedWalletAmount;
			if (order.paymentStatus === PaymentStatusType.PENDING) {
				if (order.isWalletUsed && order.usedWalletAmount) amountRefund = order.usedWalletAmount;
				order.orderStatus = OrderStatusType.CANCELLED;
				order.paymentStatus = PaymentStatusType.FAILED;
				order.amountRefunded = amountRefund;
				order.transactionDetails.transactionStatus = TransactionStatusType.FAILED;
				const response = await this.orderService.orderDetailUpdate(order._id, order);
			} else {
				await this.orderService.orderCancelByUser(user._id, orderId, amountRefund);
			}
			const userCart = await this.cartService.getCartById(order.cartId);
			const products = await this.productService.getProductByIds(userCart.productIds);

			for (let prods of userCart.products) {
				const productIndex = await products.findIndex(val => val._id.toString() == prods.productId.toString());
				const varientIndex = await products[productIndex].variant.findIndex(val => val.unit == prods.unit);
				if (products[productIndex].variant[varientIndex].productStock === 0) {
					await this.productOutOfStockService.deleteOutOfStock(products[productIndex]._id);
				}
				products[productIndex].variant[varientIndex].productStock += prods.quantity;
				await this.productService.updateProductStock(products[productIndex]._id, products[productIndex].variant[varientIndex]);
			}

			if (amountRefund !== 0) {
				let wallet: WalletSaveDTO = {
					userId: user._id,
					amount: amountRefund,
					transactionType: WalletTransactionType.ORDER_CANCELLED,
					orderId: order._id,
					orderID: order.orderID
				}
				this.walletService.cancelOrder(wallet);
			}
			const notification: NotificationSaveDTO = {
				notifyType: NotificationType.ORDER_CANCELLED,
				orderId: order._id,
				orderID: order.orderID,
			}

			const placed = await Promise.all([
				this.userService.updateWallet(user._id, amountRefund),
				this.notificationService.createForOrderCancel(notification)
			])
			let title = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_CANCELLED_TITLE);
			let desc = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_CANCELLED_DESC);
			desc = desc.replace('${orderID}', order.orderID);
			this.userService.descreaseOrderPurchased(user._id);
			this.pushService.sendNotificationToUser(user.playerId, title, desc);
			this.socketService.sendOrderStatusNotificationToAdmin(notification);
			return this.utilService.successResponseMsg(ResponseMessage.ORDER_CANCELLED);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
	// ########################################################### DELIVERY BOY ###########################################################
	@Get('/delivery-boy/assigned/list')
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiOperation({ title: 'Get all assigned order for delivery boy' })
	@ApiResponse({ status: 200, description: 'Return list of assigned order for delivery boy', type: ResponseDeiveryBoyPagination })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async assignedOrderListForDeliveryBoy(@GetUser() user: UsersDTO, @Query() userQuery: UserQuery): Promise<CommonResponseModel> {
		this.utilService.validateDeliveryBoyRole(user);
		try {
			let pagination = this.utilService.getUserPagination(userQuery);
			const orders = await Promise.all([
				this.orderService.getAllAssginedOrderForDeliveryBoy(user._id, pagination.page, pagination.limit),
				this.orderService.countAllAssginedOrderForDeliveryBoy(user._id)
			])
			return this.utilService.successResponseData(orders[0], { total: orders[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/delivery-boy/delivered/list')
	@ApiOperation({ title: 'Get all delivered order for delivery boy' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of delivered order for delivery boy', type: ResponseDeliveredOrderPagination })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async deliveredOrderListForDeliveryBoy(@GetUser() user: UsersDTO, @Query() userQuery: UserQuery): Promise<CommonResponseModel> {
		this.utilService.validateDeliveryBoyRole(user);
		try {
			let pagination = this.utilService.getUserPagination(userQuery);
			const orders = await Promise.all([
				this.orderService.getAllDeliveredOrderForDeliveryBoy(user._id, pagination.page, pagination.limit),
				this.orderService.countAllDeliveredOrderForDeliveryBoy(user._id)
			])
			return this.utilService.successResponseData(orders[0], { total: orders[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/delivery-boy/detail/:orderId')
	@ApiOperation({ title: 'Get order detail by orderId for delivery boy' })
	@ApiResponse({ status: 200, description: 'Return order detail by orderId', type: ResponseDataOfOrder })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getOrderDetailForDeliveryBoy(@GetUser() user: UsersDTO, @Param('orderId') orderId: string): Promise<CommonResponseModel> {
		this.utilService.validateDeliveryBoyRole(user);
		try {
			let order = await this.orderService.getOrderDetailForBoy(user._id, orderId);
			if (!order) this.utilService.badRequest(ResponseMessage.ORDER_NOT_FOUND);

			let cart = await this.cartService.getCartById(order.cartId);
			delete order.cartId;
			return this.utilService.successResponseData({ order: order, cart: cart });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/delivery-boy/accept/:orderId')
	@ApiOperation({ title: 'Accept order by delivery boy' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async orderAcceptByDeliveryBoy(@GetUser() user: UsersDTO, @Param('orderId') orderId: string): Promise<CommonResponseModel> {
		this.utilService.validateDeliveryBoyRole(user);
		try {
			const orderDetail = await this.orderService.getOrderDetail(orderId);
			if (!orderDetail) this.utilService.badRequest(ResponseMessage.ORDER_NOT_FOUND);

			if (orderDetail.assignedToId != user._id) this.utilService.badRequest(ResponseMessage.ORDER_NOT_FOUND);
			if (orderDetail.isAcceptedByDeliveryBoy) this.utilService.badRequest(ResponseMessage.DELIVERY_BOY_ALREADY_ACCEPTED_ORDER);

			const orderAccept = await this.orderService.orderAcceptByDelivery(orderId);
			if (orderAccept) {
				const notification: NotificationSaveDTO = {
					notifyType: NotificationType.ORDER_ACCEPTED_BY_DELIVERY_BOY,
					orderId: orderDetail._id,
					orderID: orderDetail.orderID,
					deliveryBoyId: user._id,
					deliveryBoyName: user.firstName + ' ' + user.lastName
				}
				this.socketService.sendOrderStatusNotificationToAdmin(notification);
				this.notificationService.createForAcceptedByBoy(notification);
				return this.utilService.successResponseMsg(ResponseMessage.ORDER_ACCEPTED_BY_DELIVERY_BOY);
			}
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/delivery-boy/reject/:orderId')
	@ApiOperation({ title: 'Reject order by delivery boy' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async orderRejectedByDeliveryBoy(@GetUser() user: UsersDTO, @Param('orderId') orderId: string): Promise<CommonResponseModel> {
		this.utilService.validateDeliveryBoyRole(user);
		try {
			const orderDetail = await this.orderService.getOrderDetail(orderId);
			if (!orderDetail) this.utilService.badRequest(ResponseMessage.ORDER_NOT_FOUND);

			if (orderDetail.assignedToId != user._id) this.utilService.badRequest(ResponseMessage.ORDER_NOT_FOUND);
			if (orderDetail.isAcceptedByDeliveryBoy) this.utilService.badRequest(ResponseMessage.DELIVERY_BOY_ALREADY_ACCEPTED_ORDER);

			const orderRejected = await this.orderService.orderRejectedByDelivery(orderId, user._id, user.firstName);
			if (orderRejected) {
				const notification: NotificationSaveDTO = {
					notifyType: NotificationType.ORDER_REJECTED_BY_DELIVERY_BOY,
					orderId: orderDetail._id,
					orderID: orderDetail.orderID,
					deliveryBoyId: user._id,
					deliveryBoyName: user.firstName + ' ' + user.lastName
				}
				this.socketService.sendOrderStatusNotificationToAdmin(notification);
				this.notificationService.createForRejectedByBoy(notification);
				return this.utilService.successResponseMsg(ResponseMessage.ORDER_REJECTED_BY_DELIVERY_BOY);
			}
			this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/delivery-boy/status-update/:orderId')
	@ApiOperation({ title: 'Update order status by delivery boy' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async orderStatusUpdateByDeliveryBoy(@GetUser() user: UsersDTO, @Param('orderId') orderId: string, @Body() statusUpdate: DBStatusUpdateDTO): Promise<CommonResponseModel> {
		this.utilService.validateDeliveryBoyRole(user);
		try {
			const orderDetail = await this.orderService.getOrderDetail(orderId);
			if (!orderDetail) this.utilService.badRequest(ResponseMessage.ORDER_NOT_FOUND);
			if (orderDetail.assignedToId != user._id) this.utilService.badRequest(ResponseMessage.ORDER_NOT_FOUND);
			if (orderDetail.orderStatus === OrderStatusType.DELIVERED) this.utilService.badRequest(ResponseMessage.ORDER_ALREADY_DELIVERED);
			let orderStatusUpdate;
			if (statusUpdate.status === OrderStatusType.DELIVERED) {
				orderStatusUpdate = await this.orderService.orderStatusUpdateByDelivery(orderId, statusUpdate.status, PaymentStatusType.SUCCESS);
			} else {
				orderStatusUpdate = await this.orderService.orderStatusUpdateByDelivery(orderId, statusUpdate.status);
			}
			if (orderStatusUpdate) {
				const userDetail = await this.userService.getUserById(orderDetail.userId);
				if (userDetail) {
					let title = '', desc = '';
					if (statusUpdate.status === OrderStatusType.OUT_FOR_DELIVERY) {
						title = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_OUT_OF_DELIVERY_TITLE);
						desc = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_OUT_OF_DELIVERY_DESC);
						desc = desc.replace('${orderID}', orderDetail.orderID);
					} else if (statusUpdate.status === OrderStatusType.DELIVERED) {
						if (orderDetail.amountRefundedOrderModified) {
							if (orderDetail.paymentType === PaymentType.COD) {
								console.log("cancel IF")
								if (orderDetail.usedWalletAmount) {
									if (orderDetail.amountRefundedOrderModified > 0) {
										let amountRefund = orderDetail.amountRefundedOrderModified;
										let wallet: WalletSaveDTO = {
											userId: orderDetail.userId,
											amount: amountRefund,
											transactionType: WalletTransactionType.ORDER_MODIFIED,
											orderId: orderDetail._id,
											orderID: orderDetail.orderID
										}
										await Promise.all([
											this.walletService.cancelOrder(wallet),
											this.userService.updateWallet(orderDetail.userId, amountRefund)
										]);
									}
								}
							} else {
								console.log("cancel else")
								let amountRefund = orderDetail.amountRefundedOrderModified;
								let wallet: WalletSaveDTO = {
									userId: orderDetail.userId,
									amount: amountRefund,
									transactionType: WalletTransactionType.ORDER_MODIFIED,
									orderId: orderDetail._id,
									orderID: orderDetail.orderID
								}
								await Promise.all([
									this.walletService.cancelOrder(wallet),
									this.userService.updateWallet(orderDetail.userId, amountRefund)
								]);
							}
						}
						title = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_DELIVERED_TITLE);
						desc = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_DELIVERED_DESC);
						desc = desc.replace('${orderID}', orderDetail.orderID);
						const orders = await Promise.all([
							this.cartService.getCartById(orderStatusUpdate.cartId),
							this.businessService.getBusinessDetail()
						]);
						this.userService.increaseOrderDelivered(user._id);
						this.userService.increaseOrderPurchased(orderDetail.userId);
						this.emailService.sendEmailOrderDelivered(orderDetail, orders[1]);
					}
					if (userDetail && userDetail.playerId) this.pushService.sendNotificationToUser(userDetail.playerId, title, desc);
				}
				orderDetail.cart.map(async c =>
					await this.cartService.addProductInOrdersForRating({ userId: userDetail._id, productId: c.productId })
				);
				return this.utilService.successResponseMsg(ResponseMessage.ORDER_STATUS_UPDATED);
			}
			this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	// ########################################################### ADMIN ###########################################################
	@Get('/admin/list')
	@ApiOperation({ title: 'Get all order' })
	@ApiImplicitQuery({ name: "orderStatus", description: "Get order details By Order status", required: false, type: String })
	@ApiImplicitQuery({ name: "assignedToId", description: "Get order details By Delivery-Boy Id", required: false, type: String })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiImplicitQuery({ name: "type", description: "subscription or purchase ", required: true, type: String })
	@ApiResponse({ status: 200, description: 'Return list of order ', type: ResponseOrderForAdmin })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async index(@GetUser() user: UsersDTO, @Query() query: OrderFilterQuery): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let orderFilter = {};
			const page = Number(query.page) || AdminSettings.DEFAULT_PAGE_NUMBER;
			const limit = Number(query.limit) || AdminSettings.DEFAULT_PAGE_LIMIT;

			if (query.type === 'PURCHASES') orderFilter = { "orderFrom": { $ne: "POS" }, isSubscriptionOrder: { $nin: [true] } };
			if (query.type === 'SUBSCRIPTIONS') orderFilter = { "orderFrom": { $ne: "POS" }, isSubscriptionOrder: true };

			if (query.orderStatus) orderFilter["orderStatus"] = query.orderStatus;
			if (query.assignedToId) orderFilter["assignedToId"] = query.assignedToId;
			console.log("orderFilter", JSON.stringify(orderFilter))
			const orders = await Promise.all([
				this.orderService.getAllOrder(orderFilter, page - 1, limit),
				this.orderService.countAllOrder(orderFilter)
			])
			return this.utilService.successResponseData(orders[0], { total: orders[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/detail/:orderId')
	@ApiOperation({ title: 'Get order detail by orderId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseAdminOrderDetailsOrderId })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getOrderDetails(@GetUser() user: UsersDTO, @Param('orderId') orderId: string) {
		this.utilService.validateAdminRole(user);
		try {
			const order = await this.orderService.getOrderDetail(orderId);
			if (!order) this.utilService.pageNotFound();

			if (order.isSubscriptionOrder) return this.utilService.successResponseData({ order: order });

			let cart = await this.cartService.getCartById(order.cartId);
			let deliveryBoyRating = await this.deliveryBoyRatingsService.getDeliveryBoyRating(orderId)
			delete order.cartId;
			return this.utilService.successResponseData({ order: order, cart: cart, deliveryBoyRating: deliveryBoyRating });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Delete('/admin/delete/:orderId')
	@ApiOperation({ title: 'Get order detail by orderId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getOrderDelete(@GetUser() user: UsersDTO, @Param('orderId') orderId: string) {
		this.utilService.validateAdminRole(user);
		try {
			const order = await this.orderService.getOrderDetail(orderId);
			if (!order) this.utilService.pageNotFound();
			const deleteAll = await Promise.all([
				this.cartService.deleteCartById(order.cartId),
				this.orderService.deleteOrder(orderId),
				this.notificationService.deleteNotificationByordrId(orderId)

			])
			if (deleteAll) return this.utilService.successResponseMsg(ResponseMessage.ORDER_DELETED);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/status-update/:orderId')
	@ApiOperation({ title: 'Update order status' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateOrderStatus(@GetUser() user: UsersDTO, @Param('orderId') orderId: string, @Body() orderData: OrderStatusDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const order = await this.orderService.getOrderDetail(orderId);
			if (!order) this.utilService.badRequest(ResponseMessage.ORDER_NOT_FOUND);

			// if(order.orderFrom  === "POS") {
			// 	if (!(orderData.status == OrderStatusType.CONFIRMED || orderData.status == OrderStatusType.DELIVERED))
			// 	this.utilService.badRequest(ResponseMessage.ORDER_STATUS_INVALID);
			// }

			// if (!(orderData.status == OrderStatusType.CONFIRMED || orderData.status == OrderStatusType.CANCELLED))
			// 	this.utilService.badRequest(ResponseMessage.ORDER_STATUS_INVALID);

			if (!(orderData.status == OrderStatusType.CONFIRMED || orderData.status == OrderStatusType.CANCELLED || (order.shippingMethod == ShippingMethod.PICK_UP && orderData.status == OrderStatusType.DELIVERED)))
				this.utilService.badRequest(ResponseMessage.ORDER_STATUS_INVALID);

			if (orderData.status == OrderStatusType.CONFIRMED) {
				await this.orderService.orderStatusUpdate(orderId, orderData.status);
			} else if (order.shippingMethod == ShippingMethod.PICK_UP && orderData.status == OrderStatusType.DELIVERED) {
				await this.orderService.orderStatusUpdate(orderId, orderData.status);
			} else if (orderData.status == OrderStatusType.CANCELLED) {
				let amountRefund = order.grandTotal;
				if (order.paymentType === PaymentMethod.COD && order.isWalletUsed && order.usedWalletAmount) amountRefund = order.usedWalletAmount;
				else if (order.paymentStatus === PaymentStatusType.SUCCESS && order.paymentType === PaymentMethod.STRIPE) amountRefund = order.grandTotal + order.usedWalletAmount;
				else if (order.paymentStatus === PaymentStatusType.FAILED && order.isWalletUsed && order.usedWalletAmount) amountRefund = order.usedWalletAmount;
				if (order.paymentStatus === PaymentStatusType.PENDING) {
					if (order.isWalletUsed && order.usedWalletAmount) amountRefund = order.usedWalletAmount;
					order.orderStatus = OrderStatusType.CANCELLED;
					order.paymentStatus = PaymentStatusType.FAILED;
					order.amountRefunded = amountRefund;
					order.transactionDetails.transactionStatus = TransactionStatusType.FAILED;
					const response = await this.orderService.orderDetailUpdate(order._id, order);
				} else {
					await this.orderService.orderCancelByAdmin(orderId, amountRefund);
				}
				if (amountRefund !== 0) {
					let wallet: WalletSaveDTO = {
						userId: order.userId,
						amount: amountRefund,
						transactionType: WalletTransactionType.ORDER_CANCELLED,
						orderId: order._id,
						orderID: order.orderID
					}

					await Promise.all([
						this.walletService.cancelOrder(wallet),
						this.userService.updateWallet(order.userId, amountRefund)
					]);
				}
				if (!order.isSubscriptionOrder) {

					const userCart = await this.cartService.getCartById(order.cartId);
					const products = await this.productService.getProductByIds(userCart.productIds);

					for (let prods of userCart.products) {
						const productIndex = await products.findIndex(val => val._id.toString() == prods.productId.toString());
						const varientIndex = await products[productIndex].variant.findIndex(val => val.unit == prods.unit);
						if (products[productIndex].variant[varientIndex].productStock === 0) {
							await this.productOutOfStockService.deleteOutOfStock(products[productIndex]._id);
						}
						products[productIndex].variant[varientIndex].productStock += prods.quantity;
						await this.productService.updateProductStock(products[productIndex]._id, products[productIndex].variant[varientIndex]);
					}
					this.userService.descreaseOrderPurchased(order.userId);
				}
			}

			if (order.userId) {
				const userDetail = await this.userService.getUserById(order.userId);
				if (userDetail && userDetail.playerId) {
					let title = '', desc = '';
					if (orderData.status === OrderStatusType.CONFIRMED) {
						title = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_CONFIRMED_TITLE);
						desc = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_CONFIRMED_DESC);
						desc = desc.replace('${orderID}', order.orderID);
					} else if (orderData.status === OrderStatusType.CANCELLED) {
						title = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_CANCELLED_TITLE);
						desc = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_CANCELLED_DESC);
						desc = desc.replace('${orderID}', order.orderID);
					}
					this.pushService.sendNotificationToUser(userDetail.playerId, title, desc);
				}
				order.cart.map(async c =>
					await this.cartService.addProductInOrdersForRating({ userId: userDetail._id, productId: c.productId })
				);
				return this.utilService.successResponseMsg(ResponseMessage.ORDER_UPDATED);
			} else return this.utilService.successResponseMsg(ResponseMessage.ORDER_UPDATED);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/assign/delivery-boy/:orderId')
	@ApiOperation({ title: 'Order assign to delivery boy' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async assignOrder(@GetUser() user: UsersDTO, @Param('orderId') orderId: string, @Body() assignData: AssignOrderDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const orderDetail = await this.orderService.getOrderDetail(orderId);
			if (!orderDetail) this.utilService.badRequest(ResponseMessage.ORDER_NOT_FOUND);
			if (orderDetail.isOrderAssigned) this.utilService.badRequest(ResponseMessage.ORDER_ALREADY_ASSIGNED);

			const boyDetail = await this.userService.getUserById(assignData.deliveryBoyId);
			if (!boyDetail) this.utilService.badRequest(ResponseMessage.DELIVERY_BOY_NOT_FOUND);

			const assignedToName = `${boyDetail.firstName} ${boyDetail.lastName}`;
			let assignOrderUpdate = { isOrderAssigned: true, isAcceptedByDeliveryBoy: false, assignedToId: boyDetail._id, assignedToName: assignedToName };

			await this.orderService.orderAssignToDelivery(orderId, assignOrderUpdate);
			if (boyDetail && boyDetail.playerId) {
				let title = '', desc = '';
				if (orderDetail.orderStatus === OrderStatusType.CONFIRMED) {
					title = await this.utilService.getTranslatedMessageByKey(ResponseMessage.DELIVERY_BOY_NOTIFY_ORDER_ASSIGNED_TITLE);
					desc = await this.utilService.getTranslatedMessageByKey(ResponseMessage.DELIVERY_BOY_NOTIFY_ORDER_ASSIGNED_DESC);
					desc = desc.replace('${orderID}', orderDetail.orderID);
					this.pushService.sendNotificationToDeliveryBoy(boyDetail.playerId, title, desc);

				}
			}
			let deliveryBoyNotification = {
				deliveryBoyId: boyDetail._id,
				orderId: orderDetail._id,
				orderID: orderDetail.orderID,
				user: orderDetail.user,
				address: orderDetail.address,
				deliveryDate: orderDetail.deliveryDate,
				deliveryTime: orderDetail.deliveryTime
			}
			this.socketService.newOrderForDeliveryBoy(deliveryBoyNotification);
			return this.utilService.successResponseMsg(ResponseMessage.ORDER_ASSIGNED_TO_DELIVERY_BOY);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/order-status-type/list')
	@ApiOperation({ title: 'Get all order status type for dropdown' })
	@ApiResponse({ status: 200, description: 'Return list of order status type', type: ResponseStatusList })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getOrderStatusTypeList(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const orderStatusTypeList = await this.orderService.getOrderStatusTypeList();
			return this.utilService.successResponseData(orderStatusTypeList);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/charts')
	@ApiOperation({ title: 'Get chart data for graph' })
	@ApiResponse({ status: 200, description: 'Return chart data', type: ResponseChardOrderDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async oderGraph(@GetUser() user: UsersDTO,): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const list = await Promise.all([
				this.orderService.getOrdersPriceInLast7Days(),
				this.orderService.getTotalOrderAmdSum(),
				this.productService.countAllProduct(),
				this.categoryService.countAllCategory(null)
			])
			let chartData = list[0];
			const labels = chartData.map(c => { return c._id.date + '-' + c._id.month + '-' + c._id.year });
			const data = chartData.map(c => c.data);
			const result = {
				graph: { labels: labels, data: data },
				totalOrder: list[1].totalOrder,
				totalPrice: list[1].totalPrice,
				totalProduct: list[2],
				totalCategory: list[3]
			}
			return this.utilService.successResponseData(result);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	// NOT USED
	@Get('/admin/invoice/:orderId')
	@ApiOperation({ title: 'Get pdf invoice' })
	@ApiResponse({ status: 200, description: 'Return pdf invoice' })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async invoiceDownload(@GetUser() user: UsersDTO, @Res() res, @Param('orderId') orderId: string, @Query('token') token: string) {
		try {
			const order = await this.orderService.getOrderDetailByToken(orderId, token);
			if (!order) this.utilService.pageNotFound();
			const cartBusiness = await Promise.all([
				this.cartService.getCartById(order.cartId),
				this.businessService.getBusinessDetail()
			]);
			let cart = cartBusiness[0];
			let business = cartBusiness[1];
			delete order.cartId;
			return res.sendFile(await this.emailService.createInvoice(order, business));
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/admin/sales-table')
	@ApiOperation({ title: 'Get table data' })
	@ApiResponse({ status: 200, description: 'Return sales table data', type: ResponseSalesTable })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async orderTable(@GetUser() user: UsersDTO, @Body() orderStartEndDTO: OrderStartEndDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let totalRevenueWithTax = 0, totalRevenueWithoutTax = 0, totalOrders = 0, avgOrderWithTax = 0, avgOrderWithoutTax = 0, avgTotalOrders = 0, registerUser = 0, avgRegisterUser = 0, purchaseUser = 0, avgPurchaseUser = 0;
			let startDate, endDate;
			if (orderStartEndDTO.startDate === null) {
				let date = new Date();
				let today = date.setHours(0, 0, 0, 0);
				let thirtyDaysBack = new Date(today - 30 * 24 * 60 * 60 * 1000);
				startDate = thirtyDaysBack;
				endDate = new Date();
			} else {
				startDate = new Date(orderStartEndDTO.startDate);
				endDate = new Date(orderStartEndDTO.endDate);
			}
			const startDateFormated = moment(startDate, 'DD/MM/YYYY');
			const endDateFormated = moment(endDate, 'DD/MM/YYYY');
			var noOfDays = endDateFormated.diff(startDateFormated, 'days');
			const list = await Promise.all([
				this.orderService.totalSalesByFilter(startDate, endDate),
				this.categoryService.countActiveCategory(),
				this.productService.countAllProduct(),
				this.userService.countUserByFilter(startDate, endDate),
				this.orderService.totalPuchaseUserFilter(startDate, endDate),
			])

			// REVENUE SECTION 
			const revenue = list[0];
			if (revenue.length) {
				totalRevenueWithTax = Number(this.utilService.convertToDecimal(revenue[0].totalSalesWithTax))
				totalRevenueWithoutTax = Number(this.utilService.convertToDecimal(revenue[0].totalSalesWithTax - revenue[0].totalTax))
				totalOrders = revenue[0].count

				avgOrderWithTax = Number(this.utilService.convertToDecimal(revenue[0].totalSalesWithTax / noOfDays))
				avgOrderWithoutTax = Number(this.utilService.convertToDecimal((revenue[0].totalSalesWithTax - revenue[0].totalTax) / noOfDays))
				avgTotalOrders = Number(this.utilService.convertToDecimal((revenue[0].count) / noOfDays))
			}

			// USER REGISTRATION SECTION 
			const userRegistered = list[3];
			if (userRegistered) {
				registerUser = userRegistered
				avgRegisterUser = Number(this.utilService.convertToDecimal(userRegistered / noOfDays))
			}

			// USER PURCHASE SECTION 
			const userPurchase = list[4];
			if (userPurchase) {
				purchaseUser = userPurchase
				avgPurchaseUser = Number(this.utilService.convertToDecimal(userPurchase / noOfDays))
			}

			let tableData = {
				totalRevenueWithTax,
				totalRevenueWithoutTax,
				totalOrders,

				avgOrderWithTax,
				avgOrderWithoutTax,
				avgTotalOrders,

				categoriesCount: list[1],
				productsCount: list[2],

				registerUser,
				avgRegisterUser,

				purchaseUser,
				avgPurchaseUser,
			}

			return this.utilService.successResponseData(tableData);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	// GRAPH SECTION 
	// category-mode-graph graph         
	@Post('/admin/category-mode-graph')
	@ApiOperation({ title: 'Get category mode graph data' })
	@ApiResponse({ status: 200, description: 'Return sales table data', type: ResponseSuccessMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async categoryModeGraph(@GetUser() user: UsersDTO, @Body() orderGraphsDTO: OrderGraphsDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let date = new Date();
			let startDate, endDate, query = {};
			if (orderGraphsDTO.graphType === "TODAY") {
				startDate = date.setHours(0, 0, 0, 0);
				endDate = new Date();
			} if (orderGraphsDTO.graphType === "YESTERDAY") {
				startDate = date.setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000;
				endDate = date.setHours(0, 0, 0, -999);
			} if (orderGraphsDTO.graphType === "WEEK-TO-DATE") {
				const dayCode = date.getDay();
				if (dayCode) {
					startDate = date.setHours(0, 0, 0, 0) - ((dayCode - 1) * 24 * 60 * 60 * 1000);
				} else {
					startDate = date.setHours(0, 0, 0, 0) - 6 * 24 * 60 * 60 * 1000;
				}
				endDate = new Date();
			} if (orderGraphsDTO.graphType === "MONTH-TO-DATE") {
				date.setDate(1);
				startDate = date.setHours(0, 0, 0, 0);
				endDate = new Date();
			} if (orderGraphsDTO.graphType === "YEAR-TO-DATE") {
				date.setMonth(0);
				date.setDate(1);
				startDate = date.setHours(0, 0, 0, 0);
				endDate = new Date();
			}
			let orderAgg = await this.orderService.categoryModeGraph(startDate, endDate)
			if (orderAgg && orderAgg.length) {
				orderAgg = JSON.parse(JSON.stringify(orderAgg));
				let IDS = orderAgg.map(data => { return data._id.category });
				let category = await this.categoryService.getCategoryTitle(IDS)
				orderAgg = await this.utilService.categoryModeGraph(orderAgg, category);
			}
			return this.utilService.successResponseData(orderAgg);

		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	// product-mode-graph graph         
	@Post('/admin/product-mode-graph')
	@ApiOperation({ title: 'Get product mode graph data' })
	@ApiResponse({ status: 200, description: 'Return sales table data', type: ResponseSuccessMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async productModeGraph(@GetUser() user: UsersDTO, @Body() orderGraphsDTO: OrderGraphsDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let date = new Date();
			let startDate, endDate;
			if (orderGraphsDTO.graphType === "TODAY") {
				startDate = date.setHours(0, 0, 0, 0);
				endDate = new Date();
			} if (orderGraphsDTO.graphType === "YESTERDAY") {
				startDate = date.setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000;
				endDate = date.setHours(0, 0, 0, -999);
			} if (orderGraphsDTO.graphType === "WEEK-TO-DATE") {
				const dayCode = date.getDay();
				if (dayCode) {
					startDate = date.setHours(0, 0, 0, 0) - ((dayCode - 1) * 24 * 60 * 60 * 1000);
				} else {
					startDate = date.setHours(0, 0, 0, 0) - 6 * 24 * 60 * 60 * 1000;
				}
				endDate = new Date();
			} if (orderGraphsDTO.graphType === "MONTH-TO-DATE") {
				date.setDate(1);
				startDate = date.setHours(0, 0, 0, 0);
				endDate = new Date();
			} if (orderGraphsDTO.graphType === "YEAR-TO-DATE") {
				date.setMonth(0);
				date.setDate(1);
				startDate = date.setHours(0, 0, 0, 0);
				endDate = new Date();
			}
			let orderAgg = await this.orderService.productModeGraph(startDate, endDate, orderGraphsDTO.categoryId);
			return this.utilService.successResponseData(orderAgg);

		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	// product-mode-table graph         
	@Post('/admin/table-mode/top-product')
	@ApiOperation({ title: 'Get product mode table data' })
	@ApiResponse({ status: 200, description: 'Return sales table data', type: ResponseSuccessMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async productModeTable(@GetUser() user: UsersDTO, @Body() orderGraphsDTO: OrderGraphsDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let date = new Date();
			let startDate, endDate;
			if (orderGraphsDTO.graphType === "TODAY") {
				startDate = date.setHours(0, 0, 0, 0);
				endDate = new Date();
			} if (orderGraphsDTO.graphType === "YESTERDAY") {
				startDate = date.setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000;
				endDate = date.setHours(0, 0, 0, -999);
			} if (orderGraphsDTO.graphType === "WEEK-TO-DATE") {
				const dayCode = date.getDay();
				if (dayCode) {
					startDate = date.setHours(0, 0, 0, 0) - ((dayCode - 1) * 24 * 60 * 60 * 1000);
				} else {
					startDate = date.setHours(0, 0, 0, 0) - 6 * 24 * 60 * 60 * 1000;
				}
				endDate = new Date();
			} if (orderGraphsDTO.graphType === "MONTH-TO-DATE") {
				date.setDate(1);
				startDate = date.setHours(0, 0, 0, 0);
				endDate = new Date();
			} if (orderGraphsDTO.graphType === "YEAR-TO-DATE") {
				date.setMonth(0);
				date.setDate(1);
				startDate = date.setHours(0, 0, 0, 0);
				endDate = new Date();
			}
			let orderAgg = await this.orderService.productModeTable(startDate, endDate)
			return this.utilService.successResponseData(orderAgg);

		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	// Sales  graph         
	@Post('/admin/sales-graph')
	@ApiOperation({ title: 'Get sales graph data' })
	@ApiResponse({ status: 200, description: 'Return sales  data', type: ResponseSuccessMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async salesGraph(@GetUser() user: UsersDTO, @Body() orderGraphsDTO: OrderGraphsDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let date = new Date();
			let startDate, endDate;
			if (orderGraphsDTO.graphType === "DAILY") {
				date.setDate(1);
				startDate = date.setHours(0, 0, 0, 0);
				endDate = new Date();
			} if (orderGraphsDTO.graphType === "MONTHLY") {
				date.setMonth(0);
				date.setDate(1);
				startDate = date.setHours(0, 0, 0, 0);
				endDate = new Date();
			}
			let orderAgg = await this.orderService.salesGraph(startDate, endDate, orderGraphsDTO.graphType);
			if (orderAgg && orderAgg.length) {
				orderAgg = this.utilService.salesGraph(orderAgg, orderGraphsDTO.graphType);
			}
			return this.utilService.successResponseData(orderAgg);

		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	// product-mode-graph graph         
	@Post('/admin/payment-mode-graph')
	@ApiOperation({ title: 'Get product mode graph data' })
	@ApiResponse({ status: 200, description: 'Return sales table data', type: ResponseSuccessMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async paymentModeGraph(@GetUser() user: UsersDTO, @Body() orderGraphsDTO: OrderGraphsDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let date = new Date();
			let startDate, endDate;
			if (orderGraphsDTO.graphType === "TODAY") {
				startDate = date.setHours(0, 0, 0, 0);
				endDate = new Date();
			} if (orderGraphsDTO.graphType === "YESTERDAY") {
				startDate = date.setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000;
				endDate = date.setHours(0, 0, 0, -999);
			} if (orderGraphsDTO.graphType === "WEEK-TO-DATE") {
				const dayCode = date.getDay();
				if (dayCode) {
					startDate = date.setHours(0, 0, 0, 0) - ((dayCode - 1) * 24 * 60 * 60 * 1000);
				} else {
					startDate = date.setHours(0, 0, 0, 0) - 6 * 24 * 60 * 60 * 1000;
				}
				endDate = new Date();
			} if (orderGraphsDTO.graphType === "MONTH-TO-DATE") {
				date.setDate(1);
				startDate = date.setHours(0, 0, 0, 0);
				endDate = new Date();
			} if (orderGraphsDTO.graphType === "YEAR-TO-DATE") {
				date.setMonth(0);
				date.setDate(1);
				startDate = date.setHours(0, 0, 0, 0);
				endDate = new Date();
			}
			let orderAgg = await this.orderService.paymentModeGraph(startDate, endDate);
			return this.utilService.successResponseData(orderAgg);

		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	// User registration         
	@Post('/admin/user-graph')
	@ApiOperation({ title: 'Get registered user graph data' })
	@ApiResponse({ status: 200, description: 'Return sales  data', type: ResponseSuccessMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async userRegisteredGraph(@GetUser() user: UsersDTO, @Body() orderGraphsDTO: OrderGraphsDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let date = new Date();
			let startDate, endDate;
			if (orderGraphsDTO.graphType === "DAILY") {
				date.setDate(1);
				startDate = date.setHours(0, 0, 0, 0);
				endDate = new Date();
			} if (orderGraphsDTO.graphType === "MONTHLY") {
				date.setMonth(0);
				date.setDate(1);
				startDate = date.setHours(0, 0, 0, 0);
				endDate = new Date();
			}
			let userAgg = await this.userService.userGraph(startDate, endDate, orderGraphsDTO.graphType);
			if (userAgg && userAgg.length) {
				userAgg = this.utilService.userGraph(userAgg, orderGraphsDTO.graphType);
			}
			return this.utilService.successResponseData(userAgg);

		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}






	// DATA FETCH FUNCTION TO SCRIPT
	dataFetch = async function (pageArr) {
		for (let item of pageArr) {
			let order = await this.orderService.orderScriptToUpdate({}, item.skip, item.limit);
			if (order.length) {
				order = JSON.parse(JSON.stringify(order[0]));
				let cart = await this.cartService.getCartById(order.cartId);
				if (cart) {
					cart = JSON.parse(JSON.stringify(cart));
					if (cart.products.length) {
						for (let cartItem of cart.products) {
							let product = await this.productService.getProductDetail(cartItem.productId);
							if (product) {
								cartItem.categoryId = product.categoryId ? product.categoryId.toString() : null,
									cartItem.subCategoryId = product.subCategoryId ? product.subCategoryId.toString() : null
							}
						}
					}
					await this.cartService.updateCart(order.cartId, cart)
				}
				order.cart = cart.products;
				await this.orderService.orderScriptToUpdateDetail(order._id, order);
				console.log("ORDER ID UPDATED", order.orderID);
			}

		}

	}

	// SCRIPT TO UPDATE CART AND ORDER
	@Get('/admin/cart-order-update-script')
	@ApiOperation({ title: 'Cart order update script' })
	@ApiResponse({ status: 200, description: 'Return sales table data', type: ResponseSuccessMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async scriptToUpdate(): Promise<CommonResponseModel> {
		try {
			const count = await this.orderService.countAllOrder({});
			let pageCreation = function (count: any) {
				let limit = 1, arr = [];
				let noOfPage = Math.ceil(count / limit);
				for (let i = 1; i <= noOfPage; i++) {
					let p = (Number(i) - 1) * limit;
					arr.push({ skip: p, limit: limit })
				}
				return arr
			}

			if (count) {
				let pageArr = pageCreation(count);
				if (pageArr && pageArr.length) {
					this.dataFetch(pageArr).then(function (d) { console.log("All Data fetched and updated") })
				}
			}
			return this.utilService.successResponseData({ message: "Script started" });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	//webhook from Stripe to update payment status in db
	@Post('/webhook/stripe')
	public async webhookStripe(@Req() request: any) {
		try {
			const payload = request.body;
			const sig = request.headers['stripe-signature'];
			let event = await this.stripeService.webhookVerify(request.rawBody, sig);
			console.log("---event-----", event)
			if (event.data.object.metadata.PAYMENT_TYPE == PAYMENT_TYPE.ORDER) {
				let order = await this.orderService.getOrderDetail(event.data.object.client_reference_id);
				let user = await this.userService.getUserById(order.userId);
				if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
					const session = event.data.object;
					if (order && order.transactionDetails) {
						order.transactionDetails.transactionStatus = TransactionStatusType.SUCCESS;
						order.transactionDetails.transactionId = session.id;
						order.transactionDetails.paymentMethod = session.payment_method_types[0];
						order.transactionDetails.currency = session.currency;
						order.paymentStatus = PaymentStatusType.SUCCESS;
						order = await this.orderService.orderDetailUpdate(order._id, order)
						const userCart = await this.cartService.getCartByUserId(order.userId);

						const notification: NotificationSaveDTO = {
							notifyType: NotificationType.ORDER_PLACED,
							orderId: order._id,
							orderID: order.orderID,
						}
						this.notificationService.createForOrderPlaced(notification)
						if (user && user.playerId) {
							const title = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_PLACED_TITLE);
							let desc = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_PLACED_DESC);
							desc = desc.replace('${orderID}', order.orderID);
							this.pushService.sendNotificationToUser(user.playerId, title, desc);
						}
						this.emailService.sendEmailForPlacedOrder(order);
						this.socketService.sendOrderStatusNotificationToAdmin(notification);
						return this.utilService.successResponseMsg(ResponseMessage.TRANSACTION_SUCCESS);
					}
				} else if (event.type === 'checkout.session.async_payment_failed') {
					const session = event.data.object;
					let amountRefund = 0;
					if (order.isWalletUsed && order.usedWalletAmount) amountRefund = order.usedWalletAmount;
					order.amountRefunded = amountRefund;
					order.orderStatus = OrderStatusType.CANCELLED;
					order.paymentStatus = PaymentStatusType.FAILED;
					order.transactionDetails.transactionStatus = TransactionStatusType.FAILED;
					await this.orderService.orderDetailUpdate(order._id, order);
					const userCart = await this.cartService.getCartById(order.cartId);
					const products = await this.productService.getProductByIds(userCart.productIds);

					for (let prods of userCart.products) {
						const productIndex = await products.findIndex(val => val._id.toString() == prods.productId.toString());
						const varientIndex = await products[productIndex].variant.findIndex(val => val.unit == prods.unit);
						if (products[productIndex].variant[varientIndex].productStock === 0) {
							await this.productOutOfStockService.deleteOutOfStock(products[productIndex]._id);
						}
						products[productIndex].variant[varientIndex].productStock += prods.quantity;
						await this.productService.updateProductStock(products[productIndex]._id, products[productIndex].variant[varientIndex]);
					}
					if (amountRefund !== 0) {
						let wallet: WalletSaveDTO = {
							userId: user._id,
							amount: amountRefund,
							transactionType: WalletTransactionType.ORDER_CANCELLED,
							orderId: order._id,
							orderID: order.orderID
						}
						this.walletService.cancelOrder(wallet);
					}
					const notification: NotificationSaveDTO = {
						notifyType: NotificationType.ORDER_CANCELLED,
						orderId: order._id,
						orderID: order.orderID,
					}

					const placed = await Promise.all([
						this.userService.updateWallet(user._id, amountRefund),
						this.notificationService.createForOrderCancel(notification)
					])
					let title = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_CANCELLED_TITLE);
					let desc = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_CANCELLED_DESC);
					desc = desc.replace('${orderID}', order.orderID);
					this.userService.descreaseOrderPurchased(user._id);
					this.pushService.sendNotificationToUser(user.playerId, title, desc);
					this.socketService.sendOrderStatusNotificationToAdmin(notification);
					return this.utilService.successResponseMsg(ResponseMessage.TRANSACTION_FAIL);
				} else {
					return this.utilService.successResponseMsg(ResponseMessage.TRANSACTION_PROCESSING);

				}
			} else if (event.data.object.metadata.PAYMENT_TYPE == PAYMENT_TYPE.WALLET) {
				let user = await this.userService.getUserById(event.data.object.client_reference_id);
				if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
					const session = event.data.object;
					let amountTotal = (session.amount_total) / 100;
					if (amountTotal !== 0) {
						let wallet: WalletSaveDTO = {
							userId: user._id,
							amount: amountTotal,
							transactionType: WalletTransactionType.WALLET_TOPUP,
							orderId: '',
							orderID: 0
						}
						this.walletService.topUpWallet(wallet);
					}
					this.userService.updateWallet(user._id, amountTotal);
					return this.utilService.successResponseMsg(ResponseMessage.TRANSACTION_SUCCESS);
				} else if (event.type === 'checkout.session.async_payment_failed') {
					const session = event.data.object;
					let amountRefund = 0;

					return this.utilService.successResponseMsg(ResponseMessage.TRANSACTION_FAIL);
				} else {
					return this.utilService.successResponseMsg(ResponseMessage.TRANSACTION_PROCESSING);

				}
			}
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/admin/pos-order')
	@ApiOperation({ title: 'Cart order update script' })
	@ApiResponse({ status: 200, description: 'Return pos order success response', type: ResponseSuccessMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async orderByPos(@GetUser() user: UsersDTO, @Body() posOrderData: OrderPosDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			posOrderData = JSON.parse(JSON.stringify(posOrderData))
			const productIds = posOrderData.cart.map(function (data) { return data["productId"] })
			posOrderData["products"] = productIds;
			const products = await this.productService.getProductByIds(productIds);
			const cartVerifyData = await this.cartService.verifyPosCart(products, posOrderData);

			if (cartVerifyData.cartArr.length > 0) this.utilService.badRequest(cartVerifyData.cartArr);

			const settings = await this.settingService.getDeliveryTaxSettings();
			let order = {
				subTotal: 0,
				tax: 0,
				product: {
					title: '',
					imageUrl: ''
				},
				totalProduct: 0,
				grandTotal: 0,
				deliveryCharges: 0,
				deliveryInstruction: '',
				couponCode: 0,
				couponAmount: 0,
				transactionDetails: {
					transactionStatus: '',
					receiptUrl: '',
					transactionId: '',
					currency: '',
					paymentCount: 0,
					paymentMethod: '',
					transactionDate: 0,
					transactionAmount: 0
				},
				address: null,
				user: null,
				userId: '',
				paymentType: '',
				orderStatus: OrderStatusType.CONFIRMED,
				paymentStatus: PaymentStatusType.PENDING,
				cartId: '',
				orderID: 0,
				deliveryDate: '',
				deliveryTime: '',
				isWalletUsed: false,
				usedWalletAmount: 0,
				amountRefunded: 0,
				currencySymbol: "",
				currencyCode: "",
				invoiceToken: '',
				orderType: "",
				orderFrom: posOrderData.channel,
				cart: [],
				cashCollected: false
			};
			if (posOrderData.deliverySlotId) {
				const deliveryTimeSlots = await this.settingService.getDeliveryTimeSlots();
				const availableSlots = await this.settingService.getAvailableTimeSlot(deliveryTimeSlots['deliveryTimeSlots']);
				let openSlots = [];
				availableSlots.map(day => {
					day.timings.map(time => { openSlots[time._id] = { date: day.date, slot: time.slot }; })
				})

				const selectedTimeslot = openSlots[posOrderData.deliverySlotId];
				if (!selectedTimeslot) this.utilService.badRequest(ResponseMessage.DELIEVRY_SLOT_NOT_AVAILABLE);

				order.deliveryDate = selectedTimeslot.date;
				order.deliveryTime = selectedTimeslot.slot;
			}

			order.subTotal = posOrderData.subTotal;
			order.tax = posOrderData.tax;
			order.grandTotal = posOrderData.grandTotal;
			order.deliveryCharges = posOrderData.deliveryCharges;
			order.currencyCode = settings.currencyCode;
			order.currencySymbol = settings.currencySymbol;
			order.orderType = posOrderData.orderType
			order.transactionDetails = {
				transactionStatus: null,
				receiptUrl: null,
				transactionId: null,
				currency: null,
				paymentCount: 0,
				paymentMethod: null,
				transactionDate: Date.now(),
				transactionAmount: null
			};
			order.couponCode = null;
			order.couponAmount = 0;

			if (posOrderData.deliveryAddress) {
				order.address = {
					address: posOrderData.deliveryAddress,
					flatNo: "",
					postalCode: "",
					addressType: "",
					apartmentName: "",
					landmark: "",
					location: ""
				}
			}

			order.user = {
				firstName: posOrderData.customerName,
				lastName: "",
				mobileNumber: posOrderData.customerMobileNumber,
				email: posOrderData.customerEmail,
				countryCode: "",
				countryName: ""
			}

			order.userId = null;
			order.paymentType = posOrderData.paymentType;
			order.cashCollected = posOrderData.cashCollected;
			if (posOrderData.cashCollected) {
				order.orderStatus = OrderStatusType.DELIVERED;
				order.paymentStatus = PaymentStatusType.SUCCESS
			}
			order.cartId = null;
			order.totalProduct = posOrderData.cart.length;
			order.product = {
				title: posOrderData.cart[0]["productTitle"],
				imageUrl: posOrderData.cart[0]["imageUrl"]
			}
			// FOR GRAPH
			for (let item of posOrderData.cart) {
				item["_id"] = new ObjectID();
			}
			order.cart = posOrderData.cart;
			order.invoiceToken = await this.utilService.getUUID();
			let sequence = await this.sequenceService.getSequence()
			order.orderID = sequence ? sequence.sequenceNo : Math.floor(900000 * Math.random()) + 100000;

			const orderRes = await this.orderService.createOrder(order);
			if (orderRes) return this.utilService.successResponseMsg(ResponseMessage.ORDER_PLACED);

			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);

		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/pos-list')
	@ApiOperation({ title: 'Get all pos order' })
	@ApiImplicitQuery({ name: "orderStatus", description: "Get order details By Order status", required: false, type: String })
	@ApiImplicitQuery({ name: "assignedToId", description: "Get order details By Delivery-Boy Id", required: false, type: String })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of order ', type: ResponseOrderForAdmin })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async posOder(@GetUser() user: UsersDTO, @Query() query: OrderFilterQuery): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const page = Number(query.page) || AdminSettings.DEFAULT_PAGE_NUMBER;
			const limit = Number(query.limit) || AdminSettings.DEFAULT_PAGE_LIMIT;
			let orderFilter = { "orderFrom": "POS" };
			if (query.orderStatus) orderFilter["orderStatus"] = query.orderStatus;
			if (query.assignedToId) orderFilter["assignedToId"] = query.assignedToId;
			const orders = await Promise.all([
				this.orderService.getAllOrder(orderFilter, page - 1, limit),
				this.orderService.countAllOrder(orderFilter)
			])
			return this.utilService.successResponseData(orders[0], { total: orders[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/pos-payment-update/:orderId')
	@ApiOperation({ title: 'POS Order payment status update' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseDataOfOrder })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async posOrderPaymentUpdate(@GetUser() user: UsersDTO, @Param('orderId') orderId: string, @Body() orderPosPaymentUpdateDTO: OrderPosPaymentUpdateDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let order = await this.orderService.getOrderDetail(orderId);
			if (!order) this.utilService.pageNotFound();
			order = JSON.parse(JSON.stringify(order));
			if (orderPosPaymentUpdateDTO.cashCollected) {
				order.cashCollected = orderPosPaymentUpdateDTO.cashCollected;
				order.orderStatus = OrderStatusType.DELIVERED;
				order.paymentStatus = PaymentStatusType.SUCCESS
			}
			await this.orderService.orderDetailUpdate(order._id, order);
			return this.utilService.successResponseMsg(ResponseMessage.ORDER_UPDATED);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}



	@Put('/admin/update/:orderId')
	@ApiOperation({ title: 'Order update' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseDataOfOrder })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async orderUpdate(@GetUser() user: UsersDTO, @Param('orderId') orderId: string, @Body() orderUpdateDTO: OrderUpdateDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let order = await this.orderService.getOrderDetail(orderId);
			if (!order) this.utilService.pageNotFound();
			order = JSON.parse(JSON.stringify(order));
			let amountRefund;
			if (order.cart.length) {
				const cartIndex = order.cart.findIndex(data => data._id === orderUpdateDTO.product["_id"]);
				if (cartIndex !== -1) {
					const settings = await this.settingService.getDeliveryTaxSettings();
					if (order.paymentType !== PaymentMethod.COD) {
						amountRefund = order.cart[cartIndex]['productTotal'] - orderUpdateDTO.productTotal;
						if (order.cart[cartIndex]['isOrderModified']) order.cart[cartIndex]['amountRefundedOrderModified'] += amountRefund;
						else order.cart[cartIndex]['amountRefundedOrderModified'] = amountRefund;
						order.amountRefundedOrderModified = order.amountRefundedOrderModified + amountRefund;
					}
					if (!order.cart[cartIndex]['isOrderModified']) {
						order.cart[cartIndex]['originalUnit'] = order.cart[cartIndex]['unit'];
						order.cart[cartIndex]['originalPrice'] = order.cart[cartIndex]['price'];
						order.cart[cartIndex]['originalQuantity'] = order.cart[cartIndex]['quantity'];
						order.cart[cartIndex]['originalProductTotal'] = order.cart[cartIndex]['productTotal'];
					}
					order.subTotal = (order.subTotal - order.cart[cartIndex]['productTotal']);
					order.cart[cartIndex]['unit'] = orderUpdateDTO.modifiedVolume;
					order.cart[cartIndex]['price'] = orderUpdateDTO.modifiedPrice;
					order.cart[cartIndex]['quantity'] = orderUpdateDTO.modifiedQuantity;
					order.cart[cartIndex]['dealAmount'] = orderUpdateDTO.modifiedDealAmount;
					order.cart[cartIndex]['productTotal'] = orderUpdateDTO.productTotal;
					order.cart[cartIndex]['isOrderModified'] = true;
					order.subTotal = Number((order.subTotal + order.cart[cartIndex]['productTotal']).toFixed(2));
					order.tax = Number((order.subTotal * settings.taxAmount / 100).toFixed(2));
					order.usedWalletAmount = order.usedWalletAmount || 0;
					let couponDiscount = 0;
					if (order.couponCode) {
						const coupon = await this.couponService.findCouponByCode(order.couponCode);
						if (coupon) {
							if (coupon.couponType === CouponType.PERCENTAGE) couponDiscount = Number((order.subTotal * (coupon.offerValue / 100)).toFixed(2));
							else if (coupon.couponType === CouponType.AMOUNT) couponDiscount = Number(coupon.offerValue);
						}
					}
					order.couponAmount = couponDiscount;
					order.grandTotal = Number((order.subTotal + order.deliveryCharges + order.tax - order.couponAmount - order.usedWalletAmount).toFixed(2));
				} else this.utilService.pageNotFound();
			}
			order.isOrderModified = true;
			//console.log(JSON.stringify(order));
			await this.orderService.orderDetailUpdate(order._id, order);
			return this.utilService.successResponseMsg(ResponseMessage.ORDER_UPDATED);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Delete('/admin/item-delete/:orderId/:itemId')
	@ApiOperation({ title: 'Order item delete' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseDataOfOrder })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async orderCartItemDelete(@GetUser() user: UsersDTO, @Param('orderId') orderId: string, @Param('itemId') itemId: string,): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			console.log("orderId", orderId)
			let order = await this.orderService.getOrderDetail(orderId);
			if (!order) this.utilService.pageNotFound();
			order = JSON.parse(JSON.stringify(order));
			let amountRefund;
			if (order.cart.length) {
				const cartIndex = order.cart.findIndex(data => data._id.toString() === itemId);
				console.log("cartIndex", cartIndex)
				if (cartIndex !== -1) {
					const settings = await this.settingService.getDeliveryTaxSettings();
					if (order.paymentType !== PaymentMethod.COD) {
						order.amountRefundedOrderModified = order.amountRefundedOrderModified + order.cart[cartIndex]['productTotal'];
					}
					order.subTotal = Number((order.subTotal - order.cart[cartIndex]['productTotal']).toFixed(2));
					order.itemCancellList.push(order.cart[cartIndex]);
					order.cart.splice(cartIndex, 1)
					order.tax = Number((order.subTotal * settings.taxAmount / 100).toFixed(2));

					order.usedWalletAmount = order.usedWalletAmount || 0;
					let couponDiscount = 0;
					if (order.couponCode) {
						const coupon = await this.couponService.findCouponByCode(order.couponCode);
						if (coupon) {
							if (coupon.couponType === CouponType.PERCENTAGE) couponDiscount = Number((order.subTotal * (coupon.offerValue / 100)).toFixed(2));
							else if (coupon.couponType === CouponType.AMOUNT) couponDiscount = Number(coupon.offerValue);
						}
					}
					order.couponAmount = couponDiscount;

					order.grandTotal = Number((order.subTotal + order.deliveryCharges + order.tax - order.couponAmount - order.usedWalletAmount).toFixed(2));
					order.isOrderModified = true;

				} else this.utilService.pageNotFound();
			}

			if (order.cart.length === 0) {
				console.log("cancel")
				order.orderStatus = OrderStatusType.CANCELLED;
				if (order.paymentType === PaymentType.COD) {
					console.log("cancel IF")
					if (order.usedWalletAmount) {
						console.log("cancel if wallet")
						let amountRefund = order.usedWalletAmount;
						if (amountRefund !== 0) {
							let wallet: WalletSaveDTO = {
								userId: order.userId,
								amount: amountRefund,
								transactionType: WalletTransactionType.ORDER_CANCELLED,
								orderId: order._id,
								orderID: order.orderID
							}
							const placed = await Promise.all([
								this.walletService.cancelOrder(wallet),
								this.userService.updateWallet(order.userId, amountRefund),
							])
						}
						order.amountRefunded = amountRefund;
					}
				} else {
					console.log("cancel else")
					let amountRefund = order.amountRefundedOrderModified;
					if (amountRefund !== 0) {
						let wallet: WalletSaveDTO = {
							userId: order.userId,
							amount: amountRefund,
							transactionType: WalletTransactionType.ORDER_CANCELLED,
							orderId: order._id,
							orderID: order.orderID
						}
						const placed = await Promise.all([
							this.walletService.cancelOrder(wallet),
							this.userService.updateWallet(order.userId, amountRefund),
						])
					}
					order.amountRefunded = amountRefund;
				}
			}
			order.isOrderModified = true;
			order.isProductDeleted = true;
			console.log("orderUpdateDTO", JSON.stringify(order));
			await this.orderService.orderDetailUpdate(order._id, order);
			return this.utilService.successResponseMsg(ResponseMessage.ORDER_DELETED);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/add-item/:orderId')
	@ApiOperation({ title: 'Order add item in cart' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseDataOfOrder })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async orderAddItem(@GetUser() user: UsersDTO, @Param('orderId') orderId: string, @Body() orderData: OrderAddItemDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let order = await this.orderService.getOrderDetail(orderId);
			if (!order) this.utilService.pageNotFound();
			order = JSON.parse(JSON.stringify(order));

			let product = await this.productService.getProductDetail(orderData.productId);
			if (!product) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);
			const productPrice = this.cartService.calculateProductPrice(product, { unit: orderData.variant["unit"], quantity: orderData.quantity });

			if (!productPrice) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);

			const settings = await this.settingService.getDeliveryTaxSettings();
			productPrice["_id"] = new ObjectID();

			order.cart.push(productPrice);
			order.subTotal = Number((order.subTotal + productPrice['productTotal']).toFixed(2));
			order.tax = Number((order.subTotal * settings.taxAmount / 100).toFixed(2));

			order.usedWalletAmount = order.usedWalletAmount || 0;
			let couponDiscount = 0;
			if (order.couponCode) {
				const coupon = await this.couponService.findCouponByCode(order.couponCode);
				if (coupon) {
					if (coupon.couponType === CouponType.PERCENTAGE) couponDiscount = Number((order.subTotal * (coupon.offerValue / 100)).toFixed(2));
					else if (coupon.couponType === CouponType.AMOUNT) couponDiscount = Number(coupon.offerValue);
				}
			}
			order.couponAmount = couponDiscount;
			order.grandTotal = Number((order.subTotal + order.deliveryCharges + order.tax - order.couponAmount - order.usedWalletAmount).toFixed(2));
			order.isOrderModified = true;

			if (order.paymentType !== PaymentMethod.COD) {
				order.amountRefundedOrderModified = order.amountRefundedOrderModified - productPrice.productTotal;
			}
			order.isOrderModified = true;
			await this.orderService.orderDetailUpdate(order._id, order);
			return this.utilService.successResponseMsg(ResponseMessage.ORDER_UPDATED);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/pos/add-item/:orderId')
	@ApiOperation({ title: 'Order pos add item in cart' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseDataOfOrder })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async orderPosAddItem(@GetUser() user: UsersDTO, @Param('orderId') orderId: string, @Body() orderData: OrderAddItemDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let order = await this.orderService.getOrderDetail(orderId);
			if (!order) this.utilService.pageNotFound();
			order = JSON.parse(JSON.stringify(order));

			let product = await this.productService.getProductDetail(orderData.productId);
			if (!product) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);
			const settings = await this.settingService.getDeliveryTaxSettings();

			const productPrice = this.cartService.calculatePosProductPrice(product, { unit: orderData.variant["unit"], quantity: orderData.quantity });

			if (!productPrice) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);

			productPrice['isOrderModified'] = true;
			productPrice['isOrderAdded'] = true;
			productPrice["_id"] = new ObjectID();

			order.cart.push(productPrice);
			order.subTotal = Number((order.subTotal + productPrice['productTotal']).toFixed(2));
			order.tax = Number((order.subTotal * settings.taxAmount / 100).toFixed(2));

			order.grandTotal = Number((order.subTotal + order.deliveryCharges + order.tax).toFixed(2));
			order.isOrderModified = true;
			console.log("order", JSON.stringify(order));

			await this.orderService.orderDetailUpdate(order._id, order);
			return this.utilService.successResponseMsg(ResponseMessage.ORDER_UPDATED);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}


	@Delete('/admin/pos/item-delete/:orderId/:itemId')
	@ApiOperation({ title: 'Order pos item delete' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseDataOfOrder })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async orderPosCartItemDelete(@GetUser() user: UsersDTO, @Param('orderId') orderId: string, @Param('itemId') itemId: string,): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let order = await this.orderService.getOrderDetail(orderId);
			if (!order) this.utilService.pageNotFound();
			order = JSON.parse(JSON.stringify(order));

			const settings = await this.settingService.getDeliveryTaxSettings();
			if (order.cart.length) {
				const cartIndex = order.cart.findIndex(data => data._id.toString() === itemId);
				console.log("cartIndex", cartIndex)
				if (cartIndex !== -1) {
					order.subTotal = Number((order.subTotal - order.cart[cartIndex]['productTotal']).toFixed(2));
					order.cart.splice(cartIndex, 1)
					order.tax = Number((order.subTotal * settings.taxAmount / 100).toFixed(2));

					order.grandTotal = Number((order.subTotal + order.deliveryCharges + order.tax).toFixed(2));
					order.isOrderModified = true;

					await this.orderService.orderDetailUpdate(order._id, order);

					return this.utilService.successResponseMsg(ResponseMessage.ORDER_DELETED);
				} else this.utilService.pageNotFound();
			}
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/pos/update/:orderId')
	@ApiOperation({ title: 'Order pos update' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseDataOfOrder })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async posOrderUpdate(@GetUser() user: UsersDTO, @Param('orderId') orderId: string, @Body() orderUpdateDTO: OrderUpdateDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let order = await this.orderService.getOrderDetail(orderId);
			if (!order) this.utilService.pageNotFound();
			order = JSON.parse(JSON.stringify(order));
			const settings = await this.settingService.getDeliveryTaxSettings();
			if (order.cart.length) {
				const cartIndex = order.cart.findIndex(data => data._id === orderUpdateDTO.posOrderProduct["_id"]);
				console.log(cartIndex)
				if (cartIndex !== -1) {
					if (!order.cart[cartIndex]['isOrderModified']) {
						order.cart[cartIndex]['originalUnit'] = order.cart[cartIndex]['unit'];
						order.cart[cartIndex]['originalPrice'] = order.cart[cartIndex]['price'];
						order.cart[cartIndex]['originalQuantity'] = order.cart[cartIndex]['quantity'];
						order.cart[cartIndex]['originalProductTotal'] = order.cart[cartIndex]['productTotal'];
					}

					let amountRefund = order.cart[cartIndex]['productTotal'];
					order.cart[cartIndex]['unit'] = orderUpdateDTO.modifiedVolume;
					order.cart[cartIndex]['productPrice'] = orderUpdateDTO.modifiedPrice;
					order.cart[cartIndex]['quantity'] = orderUpdateDTO.modifiedQuantity;
					order.cart[cartIndex]['dealAmount'] = orderUpdateDTO.modifiedDealAmount;
					order.cart[cartIndex]['productTotal'] = orderUpdateDTO.productTotal;
					order.cart[cartIndex]['isOrderModified'] = true;

					order.subTotal = Number((order.subTotal - amountRefund + order.cart[cartIndex]['productTotal']).toFixed(2));
					order.tax = Number((order.subTotal * settings.taxAmount / 100).toFixed(2));

					order.grandTotal = Number((order.subTotal + order.deliveryCharges + order.tax).toFixed(2));
					order.isOrderModified = true;
				} else this.utilService.pageNotFound();
			}
			//console.log("order", JSON.stringify(order));


			await this.orderService.orderDetailUpdate(order._id, order);
			return this.utilService.successResponseMsg(ResponseMessage.ORDER_UPDATED);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/cut-off/:orderId')
	@ApiOperation({ title: 'Get cut-off amount' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseDataOfOrder })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getCutOffAmount(@GetUser() user: UsersDTO, @Param('orderId') orderId: string): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let order = await this.orderService.getOrderDetail(orderId);
			if (!order) this.utilService.pageNotFound();

			const data = await Promise.all([
				this.settingService.getMaxWalletAmountUsed(),
				this.userService.getUserInfo(order.userId)
			])

			let maxWalletAmountUsed = data[0] ? data[0] : 0;
			let walletAmount = data[1] ? data[1].walletAmount : 0
			order.amountRefundedOrderModified = order.amountRefundedOrderModified || 0;

			console.log({ maxWalletAmountUsed })
			console.log({ walletAmount })
			console.log(order.amountRefundedOrderModified)

			let cutOffAmount = maxWalletAmountUsed + walletAmount + order.amountRefundedOrderModified;
			return this.utilService.successResponseData({ cutOffAmount });

		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/notify-mail/:orderId')
	@ApiOperation({ title: 'Order notify mail sent' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseDataOfOrder })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async orderUpdateNotifyMailAndPush(@GetUser() user: UsersDTO, @Param('orderId') orderId: string): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const orderDetail = await this.orderService.getOrderDetail(orderId);
			if (!orderDetail) this.utilService.badRequest(ResponseMessage.ORDER_NOT_FOUND);

			const orders = await Promise.all([
				this.cartService.getCartById(orderDetail.cartId),
				this.businessService.getBusinessDetail(),
				this.userService.getUserById(orderDetail.userId)
			]);

			let userDetail = orders[2];
			if (user.playerId) {
				let title = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_MODIFIED_TITLE);
				let desc = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_MODIFIED_DESC);
				desc = desc.replace('${orderID}', orderDetail.orderID);
				this.pushService.sendNotificationToUser(user.playerId, title, desc);
			}

			this.emailService.sendEmailOrderDelivered(orderDetail, orders[1]);
			return this.utilService.successResponseMsg(ResponseMessage.MAIL_SENT);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
}






