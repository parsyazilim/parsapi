import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeliveryBoyRatingSaveDTO } from './delivery-boy-ratings.model';

@Injectable()
export class DeliveryBoyRatingsService {
	constructor(
		@InjectModel('DeliveryBoyRating') private readonly deliveryBoyRatingModel: Model<any>
	) {
	}

	public async getDeliveryBoyRating(orderId: string): Promise<DeliveryBoyRatingSaveDTO> {
		return await this.deliveryBoyRatingModel.findOne({ orderId: orderId }, '-_id -createdAt -updatedAt -__v');
	}

	public async saveDeliveryBoyRating(userId: string, ratingData: DeliveryBoyRatingSaveDTO): Promise<DeliveryBoyRatingSaveDTO> {
		ratingData.userId = userId;
		return await this.deliveryBoyRatingModel.create(ratingData);
	}

	public async getDeliveryBoyRatingForUser(userId: string, orderId: string): Promise<DeliveryBoyRatingSaveDTO> {
		return await this.deliveryBoyRatingModel.findOne({ userId: userId, orderId: orderId }, '-_id -createdAt -updatedAt -__v');
	}

}
