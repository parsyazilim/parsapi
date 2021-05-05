import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DealsDTO, DealStatusDTO, DealType, DealSaveDTO } from './deals.model';

@Injectable()
export class DealService {
	constructor(
		@InjectModel('Deal') private readonly dealsModel: Model<any>
	) {
	}

	public async getAllDeal(page: number, limit: number, search: string): Promise<Array<any>> {
		const skip = page * limit;
		let filter = {};
		if (search) filter = { title: { $regex: search, $options: 'i' } }
		return await this.dealsModel.find(filter).limit(limit).skip(skip);
	}

	// Count all coupon
	public async countAllDeal(search: string): Promise<number> {
		let filter = {};
		if (search) filter = { title: { $regex: search, $options: 'i' } }
		return await this.dealsModel.countDocuments(filter);
	}

	public async getDealDetail(dealId: string): Promise<DealsDTO> {
		return await this.dealsModel.findById(dealId);
	}

	// Get deal detail by categoryId
	public async getDealByCategoryId(categoryId: string): Promise<any> {
		return await this.dealsModel.findOne({ categoryId: categoryId });
	}

	public async getDealByProductId(productId: string): Promise<any> {
		return await this.dealsModel.findOne({ productId: productId });
	}

	public async countDealByCategoryId(categoryId: string): Promise<number> {
		return await this.dealsModel.countDocuments({ categoryId: categoryId });
	}

	public async countDealByProductId(productId: string): Promise<number> {
		return await this.dealsModel.countDocuments({ productId: productId });
	}

	// Create new deal
	public async createDeal(dealData: DealSaveDTO): Promise<DealsDTO> {
		return await this.dealsModel.create(dealData) as DealsDTO;
	}

	// Update deal by dealId
	public async updateDeal(dealId: string, dealData: DealSaveDTO): Promise<DealsDTO> {
		return await this.dealsModel.findByIdAndUpdate(dealId, dealData, { new: true });
	}

	// Delete deal by dealId
	public async deleteDeal(dealId: string): Promise<DealsDTO> {
		return await this.dealsModel.findByIdAndRemove(dealId);
	}

	// Update deal status
	public async updateDealStatus(dealId: string, dealStatusData: DealStatusDTO): Promise<DealsDTO> {
		return await this.dealsModel.findByIdAndUpdate(dealId, dealStatusData, { new: true });
	}

	// Top deal home page user
	public async topDeals(): Promise<Array<any>> {
		return await this.dealsModel.find({ status: true, topDeal: true }, 'title imageUrl filePath dealPercent dealType categoryId productId products').sort({ createdAt: -1 });
	}

	public async topDealsForHome(limit: number): Promise<Array<any>> {
		limit = limit || 10;
		return await this.dealsModel.find({ status: true, topDeal: true }, 'title imageUrl filePath dealPercent dealType categoryId productId products').limit(limit).sort({ createdAt: -1 });
	}

	public async dealOfTheDay(): Promise<Array<any>> {
		return await this.dealsModel.find({ status: true }, 'title imageUrl filePath dealPercent dealType categoryId productId products').sort({ createdAt: -1 });
	}

	public async dealOfTheDayForHome(limit: number): Promise<Array<any>> {
		limit = limit || 10;
		return await this.dealsModel.find({ status: true }, 'title imageUrl filePath dealPercent dealType categoryId productId products').limit(limit).sort({ createdAt: -1 });
	}

	public async getDealTypeList() {
		const list = {};
		for (var key in DealType) {
			const val = DealType[key];
			list[val] = val;
		}
		return list;
	}
}
