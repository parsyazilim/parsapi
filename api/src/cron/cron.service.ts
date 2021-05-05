import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UtilService } from '../utils/util.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionService } from '../subscription/subscription.service';
import { SettingService } from '../settings/settings.service';
import { OrderService } from '../order/order.service';
import { CartService } from '../cart/cart.service';
import { WalletService } from '../wallet/wallet.service';
import { ProductService } from '../products/products.service';
import { SequenceService } from '../sequence/sequence.service';
import { NotificationService } from '../notifications/notifications.service';
import { PushService } from '../utils/push.service';
import { AppGateway } from '../app.gateway';
import { UserService } from '../users/users.service'
import { SubscriptionSchedule, SubscriptionStatus } from '../subscription/subscription.model'
import { PaymentStatusType, OrderStatusType, TransactionStatusType } from '../order/order.model';
import { ShippingMethod } from '../settings/settings.model';
import { ResponseMessage } from '../utils/app.model';
import { NotificationSaveDTO, NotificationType } from '../notifications/notifications.model';
import { WalletSaveDTO } from '../wallet/wallet.model';
import { SubscriptionStatusService } from '../subscription-status/subscription-status.service';
@Injectable()
export class CronService {
	constructor(
		private utilService: UtilService,
		private subscriptionService: SubscriptionService,
		private settingService: SettingService,
		private orderService: OrderService,
		private cartService: CartService,
		private walletService: WalletService,
		private productService: ProductService,
		private sequenceService: SequenceService,
		private userService: UserService,
		private notificationService: NotificationService,
		private pushService: PushService,
		private socketService: AppGateway,
		private subscriptionStatusService: SubscriptionStatusService
	) { }



	// SERVICE TO CHECK PAUSE
	public checkPause(element) {
		let pauseEndDate = new Date(element.pauseEndDate);
		let pauseStartDate = new Date(element.pauseStartDate)
		pauseStartDate.setHours(0, 0, 0, 0);
		pauseStartDate = new Date(pauseStartDate)
		let today = new Date();
		today.setHours(0, 10, 0, 0);
		today = new Date(today);
		console.log("pauseStartDate", pauseStartDate, "pauseEndDate", pauseEndDate, "today", today);
		if (new Date(pauseStartDate) <= today && pauseEndDate >= today) {
			element.subscriptionTodayStatus = "INACTIVE";
			console.log("INSIDE PAUSE");
		} else {
			element.subscriptionTodayStatus = "PENDING";
			console.log("OUTSIDE PAUSE");
		}
		return element;
	}


	// SERVICE TO CREATE ORDER
	public async serviceSubscriptionOrderCreate(subscriptionData: any, settings) {
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
			orderFrom: subscriptionData.orderFrom,
			cart: [],
			isSubscriptionOrder: true,
			subscriptionId: null
		};
		const promise = await Promise.all([
			this.userService.getUserInfo(subscriptionData.userId)
		]);
		const userData = promise[0];
		if (!userData) return;

		let subscriptionProduct = subscriptionData.products[0];
		console.log("userData.walletAmount", userData.walletAmount, subscriptionProduct.subscriptionTotal)
		if (userData.walletAmount >= subscriptionProduct.subscriptionTotal) {
			order.address = subscriptionData.address;
			order.user = {
				firstName: userData.firstName,
				lastName: userData.lastName,
				mobileNumber: userData.mobileNumber,
				email: userData.email,
				countryCode: userData.countryCode,
				countryName: userData.countryName
			}
			let cart = {
				"productImages": subscriptionProduct.productImages,
				"productId": subscriptionProduct.productId,
				"productName": subscriptionProduct.productName,
				"unit": subscriptionProduct.unit,
				"price": subscriptionProduct.subScriptionAmount,
				"quantity": subscriptionProduct.quantity,
				"productTotal": subscriptionProduct.subscriptionTotal,
				"imageUrl": subscriptionProduct.imageUrl,
				"filePath": subscriptionProduct.filePath,
				"dealAmount": 0,
				"dealTotalAmount": 0,
				"isDealAvailable": false,
				"categoryId": subscriptionProduct.categoryId,
				"subCategoryId": subscriptionProduct.subCategoryId
			}

			order.cart = [cart];
			order.userId = userData._id;
			order.deliveryAddress = order.address._id;

			order.paymentStatus = PaymentStatusType.SUCCESS;
			order.orderStatus = OrderStatusType.PENDING;
			order.shippingMethod = ShippingMethod.DELIVERY;
			order.paymentType = "STRIPE";
			order.totalProduct = subscriptionData.products.length;
			order.product = {
				title: subscriptionData.products[0].productName,
				imageUrl: subscriptionProduct.productImages[0].imageUrl
			}
			const taxInfo = {
				taxName: settings.taxName,
				amount: "0"
			}

			order.taxInfo = taxInfo;
			order.invoiceToken = await this.utilService.getUUID();
			let sequence = await this.sequenceService.getSequence()
			order.orderID = sequence ? sequence.sequenceNo : Math.floor(900000 * Math.random()) + 100000;

			order.subTotal = subscriptionProduct.subscriptionTotal;
			order.tax = 0;
			order.usedWalletAmount = order.subTotal;
			order.grandTotal = 0;
			order.isWalletUsed = true;
			order.deliveryCharges = 0;
			order.transactionDetails.transactionDate = Date.now();
			order.transactionDetails.transactionAmount = order.subTotal;
			order.transactionDetails.transactionStatus = TransactionStatusType.SUCCESS;
			order.currencyCode = settings.currencyCode;
			order.currencySymbol = settings.currencySymbol;
			order.subscriptionId = subscriptionData._id;
			const orderRes = await this.orderService.createOrder(order);
			console.log("orderRes", JSON.stringify(orderRes));
			if (orderRes) {
				const walletPayment: WalletSaveDTO = {
					userId: userData._id,
					orderId: orderRes._id,
					orderID: orderRes.orderID,
					amount: orderRes.usedWalletAmount
				}

				const notification: NotificationSaveDTO = {
					notifyType: NotificationType.ORDER_PLACED,
					orderId: orderRes._id,
					orderID: orderRes.orderID,
					isSubscriptionOrder: true
				}
				subscriptionData.subscriptionTodayStatus = "COMPLETED";
				let subscriptionStatusData = {
					status: "PENDING",
					description: "order created",
					userId: subscriptionData.userId,
					subscriptionId: subscriptionData._id
				}
				const placed = await Promise.all([
					this.subscriptionStatusService.createSubscriptionStatus(subscriptionStatusData),
					this.walletService.madeOrder(walletPayment),
					this.userService.updateWallet(userData._id, -orderRes.usedWalletAmount),
					this.notificationService.createForOrderPlaced(notification),
					this.subscriptionService.updateSubscription(subscriptionData._id, subscriptionData)
				]);

				let subscriptionStatusCreateRes = placed[0];
				if (subscriptionStatusCreateRes) await this.orderService.orderDetailUpdate(orderRes._id, { subscriptionStatusId: subscriptionStatusCreateRes._id });

				if (userData && userData.playerId) {
					const title = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_PLACED_TITLE);
					let desc = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_NOTIFY_ORDER_PLACED_DESC);
					desc = desc.replace('${orderID}', orderRes.orderID);
					this.pushService.sendNotificationToUser(userData.playerId, title, desc);
				}
				// this.emailService.sendEmailForPlacedOrder(orderRes, userCart);
				this.socketService.sendOrderStatusNotificationToAdmin(notification);
			}
		} else {
			console.log("INSIDE FAILED**********************")
			let subscriptionStatusData = {
				status: "FAILED",
				description: "INSUFFCIENT BALANCE",
				userId: subscriptionData.userId,
				subscriptionId: subscriptionData._id
			}
			await this.subscriptionStatusService.createSubscriptionStatus(subscriptionStatusData)
			subscriptionData.subscriptionTodayStatus = "COMPLETED";
			await this.subscriptionService.updateSubscription(subscriptionData._id, subscriptionData);
		}
	}





	// (CRON JOB FUNCTION) TO CREATE ORDER
	public async cronJobOrderCreate() {
		const promise = await Promise.all([
			this.settingService.getDeliveryTaxSettings(),
			this.subscriptionService.getAllActiveSubscription()
		]);
		const settings = promise[0];
		let allSubscriptionData = promise[1];
		if (allSubscriptionData.length) {
			for (let subscriptionData of allSubscriptionData) {
				this.serviceSubscriptionOrderCreate(subscriptionData, settings)
			}
		}
	}

	// (CRON JOB FUNCTION) IT WILL UPDATE STATUS FOR TODAY ORDER
	public async cronScheduleJobForSubscription() {
		let subscriptionOrder = await this.subscriptionService.getAllSubscription();
		subscriptionOrder = JSON.parse(JSON.stringify(subscriptionOrder));
		if (subscriptionOrder.length) {
			for (let element of subscriptionOrder) {
				let subscriptionStartDate = new Date(element.subscriptionStartDate)
				if (subscriptionStartDate <= new Date()) {
					let diff = Date.now() - subscriptionStartDate.getTime();
					const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
					if (element.schedule === SubscriptionSchedule.DAILY) {
						if (element.status === SubscriptionStatus.PAUSE) {
							let pauseRes = this.checkPause(element);
							if (pauseRes.subscriptionTodayStatus === "INACTIVE") {
								let subscriptionStatusData = {
									status: "PAUSE",
									description: "Pause by user",
									userId: element.userId,
									subscriptionId: element._id
								}
								await this.subscriptionStatusService.createSubscriptionStatus(subscriptionStatusData)
							}
							element.subscriptionTodayStatus = pauseRes.subscriptionTodayStatus;
						} else {
							element.subscriptionTodayStatus = "PENDING";
						}
						console.log("DAILY", JSON.stringify(element));
					} else if (element.schedule === SubscriptionSchedule.ALTERNATE && diffDays % 2 == 0) {
						if (element.status === SubscriptionStatus.PAUSE) {
							let pauseRes = this.checkPause(element);
							if (pauseRes.subscriptionTodayStatus === "INACTIVE") {
								let subscriptionStatusData = {
									status: "PAUSE",
									description: "Pause by user",
									userId: element.userId,
									subscriptionId: element._id
								}
								await this.subscriptionStatusService.createSubscriptionStatus(subscriptionStatusData)
							}
							element.subscriptionTodayStatus = pauseRes.subscriptionTodayStatus;
						} else {
							element.subscriptionTodayStatus = "PENDING";
						}
						console.log("ALTERNATE", JSON.stringify(element));
					} else if (element.schedule === SubscriptionSchedule.EVERY_3_DAY && diffDays % 3 == 0) {
						if (element.status === SubscriptionStatus.PAUSE) {
							let pauseRes = this.checkPause(element);
							if (pauseRes.subscriptionTodayStatus === "INACTIVE") {
								let subscriptionStatusData = {
									status: "PAUSE",
									description: "Pause by user",
									userId: element.userId,
									subscriptionId: element._id
								}
								await this.subscriptionStatusService.createSubscriptionStatus(subscriptionStatusData)
							}
							element.subscriptionTodayStatus = pauseRes.subscriptionTodayStatus;
						} else {
							element.subscriptionTodayStatus = "PENDING";
						}
						console.log("EVERY_3_DAY", JSON.stringify(element));
					} else if (element.schedule === SubscriptionSchedule.WEEKLY && diffDays % 7 == 0) {
						if (element.status === SubscriptionStatus.PAUSE) {
							let pauseRes = this.checkPause(element);
							if (pauseRes.subscriptionTodayStatus === "INACTIVE") {
								let subscriptionStatusData = {
									status: "PAUSE",
									description: "Pause by user",
									userId: element.userId,
									subscriptionId: element._id
								}
								await this.subscriptionStatusService.createSubscriptionStatus(subscriptionStatusData)
							}
							element.subscriptionTodayStatus = pauseRes.subscriptionTodayStatus;
						} else {
							element.subscriptionTodayStatus = "PENDING";
						}
						console.log("WEEKLY", JSON.stringify(element));
					} else if (element.schedule === SubscriptionSchedule.MONTHLY && diffDays % 30 == 0) {
						if (element.status === SubscriptionStatus.PAUSE) {
							let pauseRes = this.checkPause(element);
							if (pauseRes.subscriptionTodayStatus === "INACTIVE") {
								let subscriptionStatusData = {
									status: "PAUSE",
									description: "Pause by user",
									userId: element.userId,
									subscriptionId: element._id
								}
								await this.subscriptionStatusService.createSubscriptionStatus(subscriptionStatusData)
							}
							element.subscriptionTodayStatus = pauseRes.subscriptionTodayStatus;
						} else {
							element.subscriptionTodayStatus = "PENDING";
						}
						console.log("MONTHLY", JSON.stringify(element));
					}
					await this.subscriptionService.updateSubscription(element._id, element);
				}
			}
			return true;
		} else return true;
	}



	// ##################   CRON STARTER ####################
	// mins, hrs
	@Cron('00 01 * * *')
	runEveryMidNight() {
		console.log('CRON TO SET STATUS');
		this.cronScheduleJobForSubscription()
	}


	@Cron('00 06 * * *')
	async runEveryMorning() {
		console.log('CRON TO ORDER');
		this.cronJobOrderCreate()
	}
}