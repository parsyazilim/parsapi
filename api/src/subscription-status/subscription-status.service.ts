import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubscriptionDTO} from './subscription-status.model';

@Injectable()
export class SubscriptionStatusService {
	constructor(
		@InjectModel('SubscriptionStatus') private readonly subscriptionStatusModel: Model<any>
	) { }

	public async createSubscriptionStatus(subscriptionData): Promise<any> {
		return await this.subscriptionStatusModel.create(subscriptionData);
	}

	public async getSubscriptionsStatusList(subscriptionId: string): Promise<Array<any>> {
		return await this.subscriptionStatusModel.find({ subscriptionId}).sort({ createdAt: - 1 });
	}
}
