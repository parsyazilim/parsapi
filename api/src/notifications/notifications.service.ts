import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationSaveDTO, NotificationType, NotificationDTO } from './notifications.model';

@Injectable()
export class NotificationService {
	constructor(
		@InjectModel('Notification') private readonly notificationModel: Model<any>
	) {
	}

	public async getAllNotification(page: number, limit: number): Promise<Array<NotificationDTO>> {
		const skip = page * limit;
		return await this.notificationModel.find({ isRead: false }, 'title notifyType isRead description orderID orderId deliveryBoyId deliveryBoyName createdAt').limit(limit).skip(skip).sort({ createdAt: -1 });
	}

	public async countAllnotification(): Promise<number> {
		return await this.notificationModel.countDocuments({});
	}

	public async readNotification(notifyId): Promise<number> {
		return await this.notificationModel.updateOne({ _id: notifyId }, { isRead: true });
	}

	public async countUnread(): Promise<number> {
		return await this.notificationModel.countDocuments({ isRead: false });
	}

	public async createForOrderPlaced(notificationData: NotificationSaveDTO): Promise<NotificationDTO> {
		notificationData.title = "New order placed"; //Need to make translation
		notificationData.notifyType = NotificationType.ORDER_PLACED;
		return await this.notificationModel.create(notificationData);
	}

	public async createForOrderCancel(notificationData: NotificationSaveDTO): Promise<NotificationDTO> {
		notificationData.title = "Order Cancelled"; //Need to make translation
		notificationData.notifyType = NotificationType.ORDER_CANCELLED;
		return await this.notificationModel.create(notificationData);
	}

	public async createForAcceptedByBoy(notificationData: NotificationSaveDTO): Promise<NotificationDTO> {
		notificationData.title = "Order Accepted by delivery boy"; //Need to make translation
		notificationData.notifyType = NotificationType.ORDER_ACCEPTED_BY_DELIVERY_BOY;
		return await this.notificationModel.create(notificationData);
	}

	public async createForRejectedByBoy(notificationData: NotificationSaveDTO): Promise<NotificationDTO> {
		notificationData.title = "Order Rejected by delivery boy"; //Need to make translation
		notificationData.notifyType = NotificationType.ORDER_REJECTED_BY_DELIVERY_BOY;
		return await this.notificationModel.create(notificationData);
	}
	public async createForProductOutOfStock(productOutOfStockData: NotificationSaveDTO): Promise<NotificationDTO> {
		return await this.notificationModel.create(productOutOfStockData);

	}

	public async deleteNotificationByordrId(orderId:string): Promise<any> {
		return await this.notificationModel.remove({ orderId: orderId })
	}
}
