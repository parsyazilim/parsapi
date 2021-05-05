import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppGateway } from 'src/app.gateway';
import { BusinessService } from '../business/business.service';
import { CartService } from '../cart/cart.service';
import { CouponService } from '../coupons/coupons.service';
import { NotificationSaveDTO, NotificationType } from '../notifications/notifications.model';
import { NotificationService } from '../notifications/notifications.service';
import { ProductOutOfStockService } from '../product-out-of-stock/product-out-of-stock.service';
import { ProductService } from '../products/products.service';
import { SequenceService } from '../sequence/sequence.service';
import { ShippingMethod } from '../settings/settings.model';
import { SettingService } from '../settings/settings.service';
import { UserService } from '../users/users.service';
import { ResponseMessage } from '../utils/app.model';
import { EmailService } from '../utils/email.service';
import { PushService } from '../utils/push.service';
import { UtilService } from '../utils/util.service';
import { WalletSaveDTO } from '../wallet/wallet.model';
import { WalletService } from '../wallet/wallet.service';
import { GraphTotalCountDTO, OrderStatusType, PaymentStatusType } from './order.model';

@Injectable()
export class OrderService {
	constructor(
		@InjectModel('Order') private readonly orderModel: Model<any>,
	) {

	}

	// ########################################################### USER ###########################################################
	// Get all order for user
	public async getAllOrderForUser(isSubscriptionOrder, userId: string, page: number, limit: number): Promise<Array<any>> {
		let query
		if(isSubscriptionOrder) query = {userId: userId , isSubscriptionOrder}
		else query = {userId: userId , isSubscriptionOrder : {$nin : [true]}}

		const skip = page * limit;
		return await this.orderModel.find(query, 'isSubscriptionOrder orderID orderStatus paymentStatus shippingMethod createdAt grandTotal usedWalletAmount product totalProduct').sort({ createdAt: -1 }).limit(limit).skip(skip);
	}

	public async getAllOrderForUserSection(userId: string, page: number, limit: number): Promise<Array<any>> {
		const skip = page * limit;
		return await this.orderModel.find({ userId: userId }, 'isSubscriptionOrder orderID orderStatus paymentStatus shippingMethod createdAt grandTotal usedWalletAmount product totalProduct').sort({ createdAt: -1 }).limit(limit).skip(skip);
	}

	// Count all order for user
	public async countAllOrderForUser(isSubscriptionOrder, userId: string): Promise<number> {
		let query
		if(isSubscriptionOrder) query = {userId: userId , isSubscriptionOrder}
		else query = {userId: userId , isSubscriptionOrder : {$nin : [true]}}
		return await this.orderModel.countDocuments(query);
	}

	// Get order detail by order id for user
	public async getOrderDetailForUser(userId: string, orderId: string): Promise<any> {
		return await this.orderModel.findOne({ _id: orderId, userId: userId },
			'isSubscriptionOrder cart cartId taxInfo grandTotal couponAmount deliveryInstruction deliveryCharges tax subTotal shippingMethod deliveryAddress storeAddress paymentType isOrderModified paymentStatus orderID orderStatus deliveryDate deliveryTime address user assignedToId assignedToName isDeliveryBoyRated createdAt usedWalletAmount'
		);
	}

	public async getOrderDetailForCancel(userId: string, orderId: string): Promise<any> {
		return await this.orderModel.findOne({ _id: orderId, userId: userId });
	}

	// Create order
	public async createOrder(orderData): Promise<any> {
		return await this.orderModel.create(orderData);
	}

	// Order cancel by user
	public async orderCancelByUser(userId: string, orderId: string, amountRefund: number): Promise<any> {
		const updateData = {
			orderStatus: OrderStatusType.CANCELLED,
			amountRefunded: amountRefund
		}
		return await this.orderModel.updateOne({ _id: orderId, userId: userId }, updateData, { new: true })
	}

	//Order delivery boy rated by user
	public async updateOrderRatedByUser(userId: string, orderId: string): Promise<any> {
		const updateData = { isDeliveryBoyRated: true };
		return await this.orderModel.updateOne({ _id: orderId, userId: userId }, updateData, { new: true })
	}

	// ########################################################### DELIVERY BOY ###########################################################
	// Get all delivered order for delivery boy
	public async getAllDeliveredOrderForDeliveryBoy(deliveryBoyId: string, page: number, limit: number): Promise<Array<any>> {
		const orderFilter = { assignedToId: deliveryBoyId, orderStatus: OrderStatusType.DELIVERED }
		const skip = page * limit;
		return await this.orderModel.find(orderFilter, 'orderID deliveryDate deliveryTime').sort({ createdAt: -1 }).limit(limit).skip(skip);
	}

	// count all delivered order for delivery boy
	public async countAllDeliveredOrderForDeliveryBoy(deliveryBoyId: string): Promise<number> {
		const orderFilter = { assignedToId: deliveryBoyId, orderStatus: OrderStatusType.DELIVERED }
		return await this.orderModel.countDocuments(orderFilter);
	}

	// Get order detail by order id for delivery boy
	public async getOrderDetailForBoy(boyId: string, orderId: string): Promise<any> {
		return await this.orderModel.findOne({ _id: orderId, assignedToId: boyId, isOrderAssigned: true },
			'cartId paymentType orderID paymentStatus orderStatus deliveryDate deliveryTime address user'
		);
	}

	// Get all assigned order for delivery boy
	public async getAllAssginedOrderForDeliveryBoy(deliveryBoyId: string, page: number, limit: number): Promise<Array<any>> {
		const orderFilter = { $or: [{ assignedToId: deliveryBoyId, orderStatus: OrderStatusType.CONFIRMED }, { assignedToId: deliveryBoyId, orderStatus: OrderStatusType.OUT_FOR_DELIVERY }] };
		const skip = page * limit;
		const orders = await this.orderModel.find(orderFilter, 'orderId orderID deliveryDate deliveryTime user address isAcceptedByDeliveryBoy').sort({ createdAt: -1 }).limit(limit).skip(skip);
		return orders;
	}

	// count all assigned order for delivery boy
	public async countAllAssginedOrderForDeliveryBoy(deliveryBoyId: string): Promise<number> {
		const orderFilter = { assignedToId: deliveryBoyId, orderStatus: OrderStatusType.CONFIRMED }
		const orders = await this.orderModel.countDocuments(orderFilter);
		return orders;
	}

	// order accept by delivery boy
	public async orderAcceptByDelivery(orderId: string): Promise<any> {
		return await this.orderModel.findByIdAndUpdate(orderId, { isAcceptedByDeliveryBoy: true });
	}

	// order reject by delivery boy
	public async orderRejectedByDelivery(orderId: string, deliveryBoyId: string, deliveryBoyName: string): Promise<any> {
		const updateData = {
			isAcceptedByDeliveryBoy: false,
			isOrderAssigned: false,
			assignedToId: null,
			assignedToName: null,
			"$push": { rejectedByDeliveryBoy: { deliveryBoyId: deliveryBoyId, deliveryBoyName: deliveryBoyName } }
		}
		const order = await this.orderModel.findByIdAndUpdate(orderId, updateData);
		return order;
	}

	// Update order status by delivery boy
	public async orderStatusUpdateByDelivery(orderId: string, orderStatus: string, paymentStatus?: string): Promise<any> {
		let updateData = { orderStatus: orderStatus };
		if (paymentStatus) updateData['paymentStatus'] = paymentStatus;
		const order = await this.orderModel.findByIdAndUpdate(orderId, updateData);
		return order;
	}

	// ########################################################### ADMIN ###########################################################
	// Get all order for admin
	public async getAllOrder(orderFilter, page: number, limit: number): Promise<Array<any>> {
		const skip = page * limit;
		return await this.orderModel.find(orderFilter).sort({ createdAt: -1 }).limit(limit).skip(skip);
	}

	// Count all order for admin
	public async countAllOrder(orderFilter): Promise<number> {
		return await this.orderModel.countDocuments(orderFilter);
	}

	// Get order detail by order id for admin
	public async getOrderDetail(orderId: string): Promise<any> {
		return await this.orderModel.findById(orderId);
	}

	// Get order detail by order id for admin
	public async getOrderDetailByToken(orderId: string, token: string): Promise<any> {
		return await this.orderModel.findOne({ _id: orderId, invoiceToken: token });
	}
	// Update order status
	public async orderStatusUpdate(orderId: string, orderStatus: string): Promise<any> {
		return await this.orderModel.findByIdAndUpdate(orderId, { orderStatus: orderStatus }, { new: true })
	}

	// Order assign to delivery boy
	public async orderAssignToDelivery(orderId: string, orderAssignData): Promise<any> {
		return await this.orderModel.findByIdAndUpdate(orderId, orderAssignData, { new: true });
	}

	// Get order status type list
	public async getOrderStatusTypeList() {
		const list = {};
		for (var key in OrderStatusType) {
			const val = OrderStatusType[key];
			list[val] = val;
		}
		return list;
	}
	// Order cancel by admin
	public async orderCancelByAdmin(orderId: string, amountRefund: number): Promise<any> {
		const updateData = {
			orderStatus: OrderStatusType.CANCELLED,
			amountRefunded: amountRefund
		}
		return await this.orderModel.updateOne({ _id: orderId }, updateData, { new: true })
	}

	// Get total order and it's sum
	public async getTotalOrderAmdSum(): Promise<GraphTotalCountDTO> {
		const orders = await this.orderModel.aggregate([
			{ $match: { orderStatus: OrderStatusType.DELIVERED } },
			{ $group: { _id: {}, data: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
		]);
		let totalOrder = 0, totalPrice = 0;
		if (orders && orders.length) {
			totalOrder = orders[0].count;
			totalPrice = orders[0].data;
		}
		return { totalOrder, totalPrice }
	}

	// Get all order total price of last seven days
	public async getOrdersPriceInLast7Days(): Promise<any> {
		let date = new Date();
		let today = date.setHours(0, 0, 0, 0);
		let sevenDaysBack = new Date(today - 6 * 24 * 60 * 60 * 1000);
		const result = await this.orderModel.aggregate([
			{ $match: { orderStatus: OrderStatusType.DELIVERED, createdAt: { $gt: sevenDaysBack, $lt: date } } },
			{
				$group: {
					_id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, date: { $dayOfMonth: '$createdAt' } },
					data: { $sum: '$grandTotal' }
				}
			}
		]);
		return result;
	}

	// Get all order total price of last seven days
	public async totalSalesByFilter(startDate, endDate): Promise<any> {
		startDate = startDate.setHours(0, 0, 0, 0);
		const result = await this.orderModel.aggregate([
			{ $match: { orderStatus: OrderStatusType.DELIVERED, createdAt: { $gt: new Date(startDate), $lt: new Date(endDate) } } },
			{
				$group: {
					_id: {},
					totalSalesWithTax: { $sum: '$grandTotal' },
					totalTax: { $sum: '$tax' },
					count: { $sum: 1 }
				}
			}
		]);
		return result;
	}

	// Get all order total price of last seven days
	public async totalPuchaseUserFilter(startDate, endDate): Promise<any> {
		startDate = startDate.setHours(0, 0, 0, 0);
		const result = await this.orderModel.distinct("userId", { createdAt: { $gt: new Date(startDate), $lt: new Date(endDate) } })
		return result.length;
	}
	public async categoryModeGraph(startDate, endDate): Promise<any> {
		let query = { createdAt: { $gt: new Date(startDate), $lt: new Date(endDate) } }
		console.log("categoryModeGraph query", query);
		const result = await this.orderModel.aggregate([
			{ $match: query },
			{ '$unwind': '$cart' },
			{ $group: { _id: { "category": "$cart.categoryId" }, count: { $sum: "$cart.quantity" }, total: { $sum: "$cart.productTotal" } } }
		]);
		return result;

	}
	public async productModeGraph(startDate, endDate, categoryId): Promise<any> {
		let query = { "cart.categoryId": categoryId, createdAt: { $gt: new Date(startDate), $lt: new Date(endDate) } }
		console.log("productModeGraph query", query);
		const result = await this.orderModel.aggregate([
			{ $match: query },
			{ '$unwind': '$cart' },
			{ $group: { _id: { "productName": "$cart.productName" }, count: { $sum: "$cart.quantity" }, total: { $sum: "$cart.productTotal" } } }
		]);
		return result;

	}

	public async productModeTable(startDate, endDate): Promise<any> {
		let query = { createdAt: { $gt: new Date(startDate), $lt: new Date(endDate) } }
		console.log("productModeGraph query", query);
		const result = await this.orderModel.aggregate([
			{ $match: query },
			{ '$unwind': '$cart' },
			{ $group: { _id: { "productName": "$cart.productName" }, count: { $sum: "$cart.quantity" }, total: { $sum: "$cart.productTotal" } } },
			{ "$sort": { "count": -1 } },
			{ "$limit": 10 }
		]);
		return result;


	}

	public async salesGraph(startDate, endDate, type): Promise<any> {
		let query = { createdAt: { $gt: new Date(startDate), $lt: new Date(endDate) } }
		console.log("productModeGraph query", query);
		let result;
		if (type === "DAILY") {
			result = await this.orderModel.aggregate([
				{ $match: query },
				{
					$group: {
						_id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, date: { $dayOfMonth: '$createdAt' } },
						data: { $sum: '$grandTotal' }
					}
				}
			]);
		} else {
			result = await this.orderModel.aggregate([
				{ $match: query },
				{
					$group: {
						_id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
						data: { $sum: '$grandTotal' }
					}
				}
			]);
		}

		return result;
	}

	public async paymentModeGraph(startDate, endDate): Promise<any> {
		let query = { createdAt: { $gt: new Date(startDate), $lt: new Date(endDate) } }
		console.log("paymentModeGraph query", query);
		const result = await this.orderModel.aggregate([
			{ $match: query },
			{ $group: { _id: { "paymentType": "$paymentType" }, total: { $sum: "$grandTotal" } } },
		]);
		return result;

	}

	public async orderScriptToUpdate(orderFilter, skip: number, limit: number): Promise<Array<any>> {
		return await this.orderModel.find(orderFilter).sort({ createdAt: -1 }).limit(limit).skip(skip);
	}

	public async orderScriptToUpdateDetail(orderId, orderInfo): Promise<any> {
		const order = await this.orderModel.findByIdAndUpdate(orderId, orderInfo, { new: true });
		return order
	}

	public async orderDetailUpdate(orderId: string, orderData): Promise<any> {
		return await this.orderModel.findByIdAndUpdate(orderId, orderData, { new: true })
	}

	public async deleteOrder(orderId: string): Promise<any> {
		return await this.orderModel.findByIdAndDelete(orderId);
	}

}