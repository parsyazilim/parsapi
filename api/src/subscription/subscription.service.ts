import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubscriptionStatus, } from './subscription.model';

@Injectable()
export class SubscriptionService {
	constructor(
		@InjectModel('Subscription') private readonly subscriptionModel: Model<any>
	) { }

	public async getSubscriptionById(subscriptionId: string): Promise<any> {
		return await this.subscriptionModel.findById(subscriptionId);
	}

	public async getSubscriptionsByUserId(userId: string, page: number, limit: number): Promise<Array<any>> {
		let skip = page * limit;
		return await this.subscriptionModel.find({ userId: userId }).limit(limit).skip(skip).sort({ createdAt: - 1 });
	}

	public async createSubscription(subscriptionData: any): Promise<any> {
		return await this.subscriptionModel.create(subscriptionData);
	}

	public async deleteSubscription(subscriptionId: string): Promise<any> {
		return await this.subscriptionModel.findByIdAndRemove(subscriptionId);
	}

	public async updateSubscription(subscriptionId: string, subscriptionData: any): Promise<any> {
		return await this.subscriptionModel.findByIdAndUpdate(subscriptionId, subscriptionData, {new: true});
	}

	public async pauseSubscription(subscriptionId: string): Promise<any> {
		return await this.subscriptionModel.findByIdAndUpdate(subscriptionId, { $set: { status: SubscriptionStatus.PAUSE } })
	}

	public async startSubscription(subscriptionId: string): Promise<any> {
		return await this.subscriptionModel.findByIdAndUpdate(subscriptionId, { $set: { status: SubscriptionStatus.ACTIVE } })
	}

	public async getAllActiveSubscription(): Promise<Array<any>> {
		return await this.subscriptionModel.find({subscriptionTodayStatus : "PENDING", status: { $in: [ SubscriptionStatus.ACTIVE, SubscriptionStatus.PAUSE]}});
	}

	public async getAllSubscription(): Promise<Array<any>> {
		return await this.subscriptionModel.find({status: { $in: [ SubscriptionStatus.ACTIVE, SubscriptionStatus.PAUSE] }});
	}
	
}