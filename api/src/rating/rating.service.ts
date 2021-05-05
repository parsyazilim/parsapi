import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RatingDTO, RatingSaveDTO } from './rating.model';

@Injectable()
export class RatingService {
	constructor(
		@InjectModel('Rating') private readonly ratingModel: Model<any>
	) {
	}

	public async getProductRate(userId: string, productId: string): Promise<RatingDTO> {
		return await this.ratingModel.findOne({ userId: userId, productId: productId });
	}

	public async saveRating(userId: string, ratingData: RatingSaveDTO): Promise<RatingDTO> {
		ratingData.userId = userId;
		return await this.ratingModel.create(ratingData);
	}

	public async updateRating(userId: string, productId: string, rate: number): Promise<RatingDTO> {
		return await this.ratingModel.updateOne({ userId: userId, productId: productId }, { rate: rate });
	}
}
