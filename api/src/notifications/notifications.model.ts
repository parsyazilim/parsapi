import * as mongoose from 'mongoose';
import { ApiModelProperty } from '@nestjs/swagger';
import { IsArray, IsEmpty, IsNotEmpty, IsNumber, IsOptional, Max, Min, IsUrl, IsString, IsBoolean } from 'class-validator';

export enum NotificationType {
	ORDER_PLACED = 'ORDER_PLACED',
	ORDER_CANCELLED = 'ORDER_CANCELLED',
	ORDER_ACCEPTED_BY_DELIVERY_BOY = 'ORDER_ACCEPTED_BY_DELIVERY_BOY',
	ORDER_REJECTED_BY_DELIVERY_BOY = 'ORDER_REJECTED_BY_DELIVERY_BOY',
	PRODUCT_OUT_OF_STOCK = 'PRODUCT_OUT_OF_STOCK',
}

export const NotificationSchema = new mongoose.Schema({
	title: { type: String },
	notifyType: { type: NotificationType },
	isRead: { type: Boolean, default: false },
	description: { type: String },
	orderID: { type: Number },
	orderId: { type: String },
	deliveryBoyId: { type: String },
	deliveryBoyName: { type: String },
	productId: { type: String },
	unit: { type: String },
	isSubscriptionOrder: { type: Boolean , default: false}
}, {
	timestamps: true
});

export class NotificationSaveDTO {
	title?: string;
	description?: string;
	notifyType?: NotificationType;
	orderId: string;
	orderID: number;
	deliveryBoyId?: string;
	deliveryBoyName?: string;
	productId?: string;
	unit?: string;
	isSubscriptionOrder?: boolean
}
export class NotificationDTO {
	@ApiModelProperty()
	title: string;

	@ApiModelProperty()
	description: string;

	@ApiModelProperty()
	notifyType: NotificationType;

	@ApiModelProperty()
	orderId: string;

	@ApiModelProperty()
	orderID: number;

	@ApiModelProperty()
	deliveryBoyId: string;

	@ApiModelProperty()
	deliveryBoyName: string;

	@ApiModelProperty()
	isRead: boolean;

	productId: string;
	unit: string;

	isSubscriptionOrder?: boolean

}
export class ResponseNotificationListDTO {
	@ApiModelProperty()
	@IsString()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: NotificationDTO;
}
export class SendNotificationDTO {
	@ApiModelProperty()
	title: string;

	@ApiModelProperty()
	body: string;
}
export class readNotificationDTO {
	@ApiModelProperty()
	notificationId: string;
}