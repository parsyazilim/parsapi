import * as mongoose from 'mongoose';
import {
	ArrayMinSize,
	IsMongoId,
	IsArray,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsPositive,
	Min,
	IsString,
	IsBoolean,
	IsEnum
} from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { CouponsDTO } from '../coupons/coupons.model';
import { ProductImagesDTO } from '../products/products.model';
import { ShippingMethod } from '../settings/settings.model';

const Product = {
	productId: { type: String },
	productName: { type: String },
	unit: { type: String },
	price: { type: Number },
	quantity: { type: Number },
	productTotal: { type: Number },
	imageUrl: { type: String },
	filePath: { type: String },
	dealAmount: { type: Number },
	dealPercent: { type: Number },
	dealTotalAmount: { type: Number },
	isDealAvailable: { type: Boolean },
	productImages: { type: Array },
	categoryId: { type: String },
	subCategoryId: { type: String },
	offerPrice: { type: Number },
	offerTotalAmount: { type: Number },
	isOfferAvailable: { type: Boolean },
	offerPercent: { type: Number }
}

export const CartSchema = new mongoose.Schema({
	products: [Product],
	productIds: [{ type: String }],
	subTotal: { type: Number },
	grandTotal: { type: Number },
	tax: { type: Number },
	taxInfo: { type: Object },
	shippingMethod: { type: ShippingMethod },
	deliveryCharges: { type: Number },
	deliveryAddress: { type: String },
	userId: { type: String },
	couponCode: { type: String },
	couponAmount: { type: Number, default: 0 },
	walletAmount: { type: Number, default: 0 },
	isOrderLinked: { type: Boolean, default: false },
}, {
	timestamps: true
});

export const ProductOrderUserSchema = new mongoose.Schema({
	userId: { type: String },
	productId: { type: String },
	isRated: { type: Boolean, default: false },
	rating: { type: Number, default: 0 }
}, {
	timestamps: true
});

export class CartModelDTO {
	@ApiModelProperty()
	_id: string;

	@ApiModelProperty()
	products: Array<String>;

	@ApiModelProperty()
	productIds: Array<string>;

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
	user: string;

	@ApiModelProperty()
	deliveryAddress?: string;

	@ApiModelProperty()
	isOrderLinked: boolean;

	@ApiModelProperty()
	coupon?: string;

	@ApiModelProperty()
	couponInfo?: object;

	@ApiModelProperty()
	taxInfo?: object;
}

export interface CartModel {
	productId: string;
	title: string;
	productName: string;
	filePath: string;
	imageUrl: string;
	quantity: number;
	price: number;
	productTotal: number;
	unit: string;
	description: string;
	rating?: number;
	offerInfo?: CouponsDTO;
	dealPercent?: number;
	dealTotalAmount?: number;
	isDealAvailable?: boolean;
	productImages?: Array<ProductImagesDTO>
}

export interface CartDataModel {
	_id?: string;
	cart: Array<String>;
	products: Array<string>;
	subTotal: number;
	tax: number;
	isFreeDelivery: boolean;
	grandTotal: number;
	deliveryCharges: number;
	user: string
	userId: string
	deliveryAddress?: string;
	isOrderLinked: boolean;
	coupon?: string;
	couponInfo?: object;
	taxInfo?: object;
}

export class DeleteCartProductDTO {
	@IsNotEmpty()
	@IsMongoId()
	@ApiModelProperty()
	cartId: string;

	@IsNotEmpty()
	@IsMongoId()
	@ApiModelProperty()
	productId: string;
}

export class CartUpdateDTO {
	@IsNotEmpty()
	@ApiModelProperty()
	@IsString()
	productId: string;

	@IsNotEmpty()
	@IsString()
	@ApiModelProperty()
	unit: string;

	@IsNotEmpty()
	@IsNumber()
	@ApiModelProperty()
	quantity: number;
}

export class UpdateCartDTO {
	@IsOptional()
	@IsMongoId()
	@ApiModelProperty()
	cartId: string;

	@IsNotEmpty()
	@IsMongoId()
	@ApiModelProperty()
	productId: string;

	@IsNotEmpty()
	@IsNumber()
	@IsPositive()
	@Min(1)
	@ApiModelProperty()
	quantity: number;
}

export class CartProductDTO {
	@ApiModelProperty()
	productId: string;

	@ApiModelProperty()
	productName: string;

	@ApiModelProperty()
	unit: string;

	@ApiModelProperty()
	price: number;

	@ApiModelProperty()
	quantity: number;

	@ApiModelProperty()
	productTotal: number;

	@ApiModelProperty()
	imageUrl: string;

	@ApiModelProperty()
	filePath: string;

	@ApiModelProperty()
	dealAmount: number;

	@ApiModelProperty()
	dealPercent: number;

	@ApiModelProperty()
	dealTotalAmount?: number;

	@ApiModelProperty()
	isDealAvailable?: boolean;
	isRated: any;
	rating: any;

	@ApiModelProperty({ type: [ProductImagesDTO] })
	productImages: Array<ProductImagesDTO>
}

export class TaxDTO {
	@ApiModelProperty()
	taxName: string;

	@ApiModelProperty()
	amount: number;
}

export class UserCartDTO {
	@ApiModelProperty()
	_id: string;

	@ApiModelProperty({ type: CartProductDTO })
	products?: Array<CartProductDTO>;

	@ApiModelProperty()
	productIds: Array<String>;

	@ApiModelProperty()
	couponAmount: number;

	@ApiModelProperty()
	walletAmount: number;

	@ApiModelProperty()
	isOrderLinked: boolean;

	@ApiModelProperty()
	subTotal: number;

	@ApiModelProperty()
	tax: number;

	@ApiModelProperty()
	grandTotal: number;

	@ApiModelProperty()
	deliveryCharges: number;

	@ApiModelProperty()
	taxInfo?: TaxDTO;
}

export class ResponseMyCartDetail {
	@ApiModelProperty()
	@IsString()
	response_code: string;

	@ApiModelProperty()
	response_data: UserCartDTO;
}

export class ShippingMethodDTO {
	@IsNotEmpty()
	@ApiModelProperty({ enum: Object.keys(ShippingMethod) })
	@IsString()
	@IsEnum(ShippingMethod, { message: ' Shipping Method must be one of these ' + Object.keys(ShippingMethod) })
	shippingMethod: string;
}
export class UpdateAddressDTO {

	@ApiModelProperty()
	@IsNotEmpty()
	deliveryAddress: string
}