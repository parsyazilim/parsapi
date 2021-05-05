import * as mongoose from 'mongoose';
import { AddressSaveDTO, } from '../address/address.model';
import {
	IsArray,
	IsEnum,
	IsMongoId,
	IsNotEmpty,
	IsNumber,
	IsOptional, ValidateNested, Min, Max, IsString, IsBoolean
} from 'class-validator';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';
import { DeliveryType, PaymentMethod, ShippingMethod, TaxType } from '../settings/settings.model';
import { UserCartDTO } from '../cart/cart.model';
import { DeliveryBoyRatingSaveDTO } from '../delivery-boy-ratings/delivery-boy-ratings.model';

export enum OrderStatusType {
	PENDING = 'PENDING',
	CONFIRMED = 'CONFIRMED',
	OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
	DELIVERED = 'DELIVERED',
	CANCELLED = 'CANCELLED',
}

export enum TransactionStatusType {
	PENDING = 'PENDING',
	SUCCESS = 'SUCCESS',
	FAILED = 'FAILED'
}

export enum PaymentStatusType {
	PENDING = 'PENDING',
	SUCCESS = 'SUCCESS',
	FAILED = 'FAILED'
}

export enum PAYMENT_TYPE {
	ORDER = 'ORDER',
	WALLET = 'WALLET'
}

export const OrderSchema = new mongoose.Schema({
	cartId: { type: String },
	userId: { type: String },
	subTotal: { type: Number },
	tax: { type: Number },
	taxInfo: { type: Object },
	grandTotal: { type: Number },
	couponAmount: { type: Number },
	couponCode: { type: String },
	orderFrom: { type: String },
	deliveryType: { type: DeliveryType },
	shippingMethod: { type: ShippingMethod },
	deliveryAddress: { type: String },
	deliveryDate: { type: String },
	deliveryTime: { type: String },
	deliveryInstruction: { type: String },
	deliveryCharges: { type: Number },
	paymentType: { type: PaymentMethod },
	transactionDetails: {
		paymentMethodId: String,
		transactionId: String,
		transactionStatus: String,
		transactionAmount: Number,
		transactionDate: Number,
		receiptUrl: String,
		currency: String,
		paymentMethod: String,
		paymentCount: Number
	},
	orderStatus: { type: OrderStatusType },
	paymentStatus: { type: PaymentStatusType },
	orderID: { type: Number },
	isOrderAssigned: { type: Boolean, default: false },
	assignedToId: { type: String },
	assignedToName: { type: String },
	isAcceptedByDeliveryBoy: { type: Boolean, default: false },
	isDeliveryBoyRated: { type: Boolean, default: false },
	amountRefunded: { type: Number },
	usedWalletAmount: { type: Number },
	isWalletUsed: { type: Boolean, default: false },
	address: { type: Object },
	storeAddress: { type: Object },
	user: { type: Object },
	product: {
		title: { type: String },
		imageUrl: { type: String }
	},
	totalProduct: { type: Number },
	currencyCode: { type: String },
	currencySymbol: { type: String },
	invoiceToken: { type: String },
	rejectedByDeliveryBoy: [{
		deliveryBoyId: { type: String },
		deliveryBoyName: { type: String },
	}],
	cart: { type: Array },
	orderType: { type: String },
	isOrderModified: { type: Boolean },
	amountRefundedOrderModified: { type: Number, default: 0 },
	isProductDeleted: { type: Boolean },
	itemCancellList: { type: Array, default: [] },
	cashCollected: { type: Boolean },
	isSubscriptionOrder: { type: Boolean , default: false},
	subscriptionId: { type: String},
	subscriptionStatusId: { type: String},
}, {
	timestamps: true
});

export class OrderFilterQuery {
	page?: number;
	limit?: number;
	orderStatus?: string;
	subCategoryId?: string;
	assignedToId?: string;
	type?:string
}

export interface TransactionModel {
	paymentMethodId?: string,
	transactionId?: string;
	transactionStatus?: string;
	transactionAmount?: number;
	transactionDate?: number;
	receiptUrl?: string;
	currency?: string,
	paymentMethod?: string,
	paymentCount?: number
}

export class AssignOrderDTO {
	@ApiModelProperty()
	deliveryBoyId: string;
}

export class OrderStatusDTO {
	@IsNotEmpty()
	@ApiModelProperty({ enum: Object.keys(OrderStatusType) })
	@IsEnum(OrderStatusType, { message: 'Order status type must be one of these ' + Object.keys(OrderStatusType) })
	status: string;
}

export class OrderRatingDTO {
	@IsNotEmpty()
	@IsNumber()
	@ApiModelProperty()
	rating: number;
}

export enum PaymentType {
	COD = 'COD',
	STRIPE = 'STRIPE'
}

export enum StripePaymentStatus {
	SUCCESS = "succeeded",
	REQUIRES_CAPTURE = 'requires_capture',
	MANUAL = "manual"
}

export enum PaymentFrom {
	WEB_APP = "WEB_APP",
	USER_APP = "USER_APP"
}

export class OrdersSaveDTO {
	subTotal: number;
}

export class OrderCreateDTO {
	@IsNotEmpty()
	@ApiModelProperty({ enum: Object.keys(PaymentType) })
	@IsEnum(PaymentType, { message: 'Payment type must be one of these ' + Object.keys(PaymentType) })
	paymentType: string;

	@IsOptional()
	@ApiModelProperty()
	paymentId: string;

	@ApiModelProperty()
	orderFrom: string

	@IsNotEmpty()
	@IsString()
	@ApiModelProperty()
	deliverySlotId: string;

	@IsOptional()
	@IsString()
	@ApiModelPropertyOptional()
	deliveryInstruction?: string
}

export class OrdersDTO {
	@IsNotEmpty()
	@IsMongoId()
	@ApiModelProperty()
	cart: string

	cartId: string

	@IsString()
	@IsOptional()
	user: string;

	@IsNumber()
	@IsOptional()
	subTotal: number;

	@IsNumber()
	@IsOptional()
	tax: number;

	@IsOptional()
	@IsNumber()
	grandTotal: number;

	@ApiModelProperty()
	@IsString()
	deliveryType: string;

	@IsOptional()
	@ApiModelProperty()
	@IsString()
	deliveryAddress: string;

	deliveryCharges: number;

	@IsOptional()
	@IsString()
	@ApiModelProperty()
	deliveryDate: string;

	@IsOptional()
	@IsString()
	@ApiModelProperty()
	deliveryTime: string;

	@IsOptional()
	@IsNumber()
	@ApiModelProperty()
	loyalty: number

	@IsOptional()
	@IsNumber()
	@ApiModelProperty()
	appTimestamp: number;

	@IsOptional()
	@IsNumber()
	@ApiModelProperty()
	pickUpDate: number;

	@IsOptional()
	@IsString()
	@ApiModelProperty()
	pickUpTime: string;

	deliveryInstruction: string;

	@IsBoolean()
	@ApiModelProperty()
	shouldCallBeforeDelivery: boolean;

	@IsNotEmpty()
	@IsString()
	@ApiModelProperty()
	paymentType: string;

	@IsOptional()
	@IsString()
	@ApiModelProperty()
	cardId: string;

	@IsOptional()
	@IsString()
	@ApiModelProperty()
	orderFrom?: string

	@IsOptional()
	transactionDetails: TransactionModel;

	@IsOptional()
	@IsNumber()
	usedWalletAmount: number;

	@IsOptional()
	@IsBoolean()
	isWalletUsed: boolean


	@IsOptional()
	@IsString()
	orderStatus: string;

	@IsOptional()
	@IsNumber()
	orderID: number;

	@ApiModelProperty()
	ratings: Array<any>;

	@IsOptional()
	@IsNumber()
	@ApiModelProperty()
	rating: number;

	orderAssigned: boolean;

	assignedTo: string;

	isAcceptedByDeliveryBoy: boolean;
}

export class StartEndDTO {
	@ApiModelProperty()
	startDate: Date;
	@ApiModelProperty()
	endDate: Date;
}

export class GraphTotalCountDTO {
	@ApiModelProperty()
	totalOrder: number;

	@ApiModelProperty()
	totalPrice: number;
}

export class orderAssignDeliveryDTO {
	@ApiModelProperty()
	orderAssigned: Boolean;

	@ApiModelProperty()
	isAcceptedByDeliveryBoy: boolean;

	@ApiModelProperty()
	assignedTo: string;
}

export enum OrderStatusDeliveryBoyType {
	OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
	DELIVERED = 'DELIVERED',
}

export class DBStatusUpdateDTO {
	@IsNotEmpty()
	@ApiModelProperty({ enum: Object.keys(OrderStatusDeliveryBoyType) })
	@IsEnum(OrderStatusDeliveryBoyType, { message: 'status must be one of these ' + Object.keys(OrderStatusDeliveryBoyType) })
	status: string;
}

export class ResponseProductDTO {
	@ApiModelProperty()
	title: string

	@ApiModelProperty()
	imageUrl: string
}

export class ResponseUsersDTO {
	@ApiModelProperty()
	firstName: string

	@ApiModelProperty()
	lastName: string

	@ApiModelProperty()
	mobileNumber: string
}

export class OrderResponseListDTO {
	@ApiModelProperty({})
	product: ResponseProductDTO

	@ApiModelProperty()
	_id: string

	@ApiModelProperty()
	totalProduct: number

	@ApiModelProperty()
	grandTotal: number

	@ApiModelProperty()
	orderStatus: string

	@ApiModelProperty()
	orderID: string

	@ApiModelProperty()
	createdAt: string
}

export class ResponseOrderDTO {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: OrderResponseListDTO;
}

export class ResponseOrderDTOPagination extends ResponseOrderDTO {
	@ApiModelProperty()
	total: string
}

export class ResponseOrderByOrderDTO extends AddressSaveDTO {
	@ApiModelProperty()
	user: ResponseUsersDTO

	@ApiModelProperty()
	paymentType: string

	@ApiModelProperty()
	orderStatus: string

	@ApiModelProperty()
	cartId: string

	@ApiModelProperty()
	orderID: string

	@ApiModelProperty()
	deliveryDate: string

	@ApiModelProperty()
	deliveryTime: string

	@ApiModelProperty()
	createdAt: string
}

export class ResponseOrderDetails extends ResponseOrderByOrderDTO {
	@ApiModelProperty()
	_id: string;

	@ApiModelProperty()
	cart: Array<String>;

	@ApiModelProperty()
	productsIds: Array<string>;

	@ApiModelProperty()
	subTotal: number;

	@ApiModelProperty()
	tax: number;

	@ApiModelProperty()
	isFreeDelivery: boolean;

	@ApiModelProperty()
	grandTotal: number;

	@ApiModelProperty()
	deliveryCharges: number;

	@ApiModelProperty()
	deliveryAddress?: string;

	@ApiModelProperty()
	isOrderLinked: boolean;

	@ApiModelProperty()
	coupon?: string;

	@ApiModelProperty()
	couponInfo?: string

	@ApiModelPropertyOptional()
	assignedToId?: string;

	@ApiModelPropertyOptional()
	assignedToName?: string;

	@ApiModelPropertyOptional()
	isDeliveryBoyRated?: boolean;
}

export class ResponseDataOfOrder {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: ResponseOrderDetails
}

export class ResponseOrderAdminListDTO extends ResponseOrderByOrderDTO {

	@ApiModelProperty()
	product: ResponseProductDTO

	@ApiModelProperty()
	isOrderAssigned: boolean

	@ApiModelProperty()
	isAcceptedByDeliveryBoy: boolean

	@ApiModelProperty()
	isWalletUsed: boolean

	@ApiModelProperty()
	userId: string

	@ApiModelProperty()
	usedWalletAmount: number

	@ApiModelProperty()
	amountRefunded: number

	@ApiModelProperty()
	orderFrom: string

	@ApiModelProperty()
	rejectedByDeliveryBoy: []
}

export class ResponseOrderForAdmin {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: ResponseOrderAdminListDTO;
}

export class ResponseOrderDetailsOrderId {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: ResponseOrderDetails;
}
export class ResponseAdminOrderDetails {
	@ApiModelProperty()
	order: ResponseOrderDetails;

	@ApiModelProperty()
	cart: UserCartDTO;

	@ApiModelProperty()
	deliveryBoyRating: DeliveryBoyRatingSaveDTO;

}

export class ResponseAdminOrderDetailsOrderId {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: ResponseAdminOrderDetails;
}

export class ResponseStatusListAdmin {
	PENDING: string
	CONFIRMED: string
	OUT_FOR_DELIVERY: string
	DELIVERED: string
	CANCELLED: string
}

export class ResponseStatusList {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: ResponseStatusListAdmin;
}

export class OrderChartDTO {
	@ApiModelProperty()
	labels: []

	@ApiModelProperty()
	data: []
}

export class ResponseChartDTO {
	@ApiModelProperty()
	graph: OrderChartDTO

	@IsNumber()
	@ApiModelProperty()
	totalOrder: number

	@IsNumber()
	@ApiModelProperty()
	totalPrice: number

	@IsNumber()
	@ApiModelProperty()
	totalProduct: number

	@IsNumber()
	@ApiModelProperty()
	totalCategory: number
}

export class ResponseChardOrderDTO {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: ResponseChartDTO;
}

export class ResposeUserData {
	@ApiModelProperty()
	firstName: string

	@ApiModelProperty()
	lastName: string

	@ApiModelProperty()
	mobileNumber: string

	@ApiModelProperty()
	email: string
}

export class ResposeForDeliveryBoy extends AddressSaveDTO {
	@ApiModelProperty()
	user: ResposeUserData

	@ApiModelProperty()
	orderID: string

	@ApiModelProperty()
	deliveryDate: string

	@ApiModelProperty()
	deliveryTime: string
}

export class ResponseDeliveryBoyDTO {
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: ResposeForDeliveryBoy;

}

export class ResponseDeiveryBoyPagination extends ResponseDeliveryBoyDTO {
	@ApiModelProperty()
	total: number
}

export class ResponseDeliveredOrder {
	@ApiModelProperty()
	_id: string

	@ApiModelProperty()
	orderID: string

	@ApiModelProperty()
	deliveryDate: string

	@ApiModelProperty()
	deliveryTime: string
}

export class ResponseDelivedOrder {
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: ResponseDeliveredOrder;
}

export class ResponseDeliveredOrderPagination extends ResponseDelivedOrder {
	@ApiModelProperty()
	total: number
}

export class OrderStartEndDTO {
	@ApiModelProperty()
	startDate: number

	@ApiModelProperty()
	endDate: number
}

export class SalesTable {
	@ApiModelProperty()
	totalRevenueWithTax: number

	@ApiModelProperty()
	totalRevenueWithoutTax: number

	@ApiModelProperty()
	totalOrders: number

	@ApiModelProperty()
	avgOrderWithTax: number

	@ApiModelProperty()
	avgOrderWithoutTax: number

	@ApiModelProperty()
	avgTotalOrders: number

	@ApiModelProperty()
	categoriesCount: number

	@ApiModelProperty()
	productsCount: number

	@ApiModelProperty()
	registerUser: number

	@ApiModelProperty()
	avgRegisterUser: number

	@ApiModelProperty()
	purchaseUser: number

	@ApiModelProperty()
	avgPurchaseUser: number
}

export class ResponseSalesTable {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: SalesTable;
}

export class OrderGraphsDTO {
	@ApiModelProperty()
	graphType: string

	@ApiModelProperty()
	categoryId?: string


}

export class OrderPosDTO {
	@ApiModelProperty()
	cart: Array<Object>

	@ApiModelProperty()
	subTotal: number

	@ApiModelProperty()
	tax: number

	@ApiModelProperty()
	deliveryCharges: number

	@ApiModelProperty()
	grandTotal: number

	@ApiModelProperty()
	customerName: string

	@ApiModelProperty()
	customerMobileNumber: string

	@ApiModelProperty()
	deliveryAddress?: string

	@ApiModelProperty()
	orderType: string

	@ApiModelProperty()
	paymentType: string

	@ApiModelProperty()
	channel: string

	@ApiModelProperty()
	deliverySlotId?: string

	@ApiModelProperty()
	customerEmail?: string

	@ApiModelProperty()
	cashCollected: boolean
}

export class OrderUpdateDTO {
	@ApiModelProperty()
	product?: Object

	@ApiModelProperty()
	posOrderProduct?: Object

	@ApiModelProperty()
	modifiedDealAmount: number

	@ApiModelProperty()
	modifiedPrice: number

	@ApiModelProperty()
	modifiedQuantity: number

	@ApiModelProperty()
	modifiedVolume: string

	@ApiModelProperty()
	productTotal: number
}

export class OrderAddItemDTO {
	@ApiModelProperty()
	variant: Object

	@ApiModelProperty()
	productId: string

	@ApiModelProperty()
	quantity: number

	@ApiModelProperty()
	maximumAmount: number

	@ApiModelProperty()
	productTotal: string

	@ApiModelProperty()
	dealAmount: number
}

export class OrderPosPaymentUpdateDTO {
	@ApiModelProperty()
	cashCollected: Boolean
}
