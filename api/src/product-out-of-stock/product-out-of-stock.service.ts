import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StockVariantDTO } from './product-out-of-stock.model';

@Injectable()
export class ProductOutOfStockService {

	constructor(
		@InjectModel('ProductOutOfStock') private readonly productOutOfStockModel: Model<any>
	) { }

	public async createProductStock(notificationData: any): Promise<StockVariantDTO> {
		return await this.productOutOfStockModel.create(notificationData);
	}
	public async getAllList(page: number, limit: number): Promise<Array<any>> {
		const skip = page * limit;
		return await this.productOutOfStockModel.find({}).sort({ createdAt: -1 }).limit(limit).skip(skip);
	}

	public async countAllList(): Promise<number> {
		return await this.productOutOfStockModel.countDocuments({});
	}

	public async deleteOutOfStock(productId: string) {
		return await this.productOutOfStockModel.deleteMany({ productId: productId });
	}

}
