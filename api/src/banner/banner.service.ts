import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BannerDTO, BannerSaveDTO, BannerType } from './banner.model';

@Injectable()
export class BannerService {
	constructor(
		@InjectModel('Banner') private readonly bannerModel: Model<any>,
	) {
	}

	// #################################################### USER ##########################################
	// Get banners for user
	public async getAllEnabledBanners(): Promise<Array<BannerDTO>> {
		return await this.bannerModel.find({ status: true }, 'title bannerType filePath imageUrl categoryId productId description');
	}

	// #################################################### ADMIN ##########################################
	// Get banner list
	public async getAllBanner(page: number, limit: number, search: string): Promise<Array<BannerDTO>> {
		const skip = page * limit;
		let filter = {};
		if (search) filter = { title: { $regex: search, $options: 'i' } }
		return await this.bannerModel.find(filter, 'title bannerType filePath imageUrl categoryId categoryName productId productName description status').limit(limit).skip(skip);
	}

	public async getBannerDetail(bannerId: String): Promise<BannerDTO> {
		return await this.bannerModel.findOne({ _id: bannerId }, 'title bannerType filePath imageUrl categoryId categoryName productId productName description');
	}

	// Count all banner
	public async countAllBanner(search: string): Promise<number> {
		let filter = {};
		if (search) filter = { title: { $regex: search, $options: 'i' } }
		return await this.bannerModel.countDocuments(filter);
	}

	// create new banner
	public async createBanner(bannerData: BannerSaveDTO): Promise<BannerDTO> {
		return await this.bannerModel.create(bannerData);
	}

	// Update banner by bannerId
	public async updateBanner(bannerId: string, bannerData: BannerSaveDTO): Promise<BannerDTO> {
		return await this.bannerModel.findByIdAndUpdate(bannerId, bannerData);
	}

	// Delete banner by bannerId
	public async deleteBanner(bannerId: string): Promise<BannerDTO> {
		return await this.bannerModel.findByIdAndRemove(bannerId);
	}

	public async countBannerByCategoryId(categoryId: string): Promise<number> {
		return await this.bannerModel.countDocuments({ categoryId: categoryId });
	}

	public async countBannerByProductId(productId: string): Promise<number> {
		return await this.bannerModel.countDocuments({ productId: productId });
	}

	// Get user banner list
	public async getBannerTypeList() {
		const list = {};
		for (var key in BannerType) {
			const val = BannerType[key];
			list[val] = val;
		}
		return list;
	}
}
