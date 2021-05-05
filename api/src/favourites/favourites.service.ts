import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FavouritesDTO } from './favourites.model';

@Injectable()
export class FavouriteService {
	constructor(
		@InjectModel('Favourite') private readonly favouritesModel: Model<any>
	) { }

	public async getAllFavourite(userId: string): Promise<any> {
		const favourites = await this.favouritesModel.findOne({ userId: userId }, 'productId');
		return favourites;
	}

	public async getFavouriteByProductId(userId: string, productId: string): Promise<any> {
		const favourites = await this.favouritesModel.findOne({ userId: userId, productId: productId }, 'productId');
		return favourites;

	}

	public async saveFavourite(userId: string, productList: Array<string>): Promise<FavouritesDTO> {
		const response = await this.favouritesModel.create({ userId: userId, productId: productList });
		return response;
	}

	public async updateFavourite(userId: string, productList: Array<string>): Promise<FavouritesDTO> {
		const response = await this.favouritesModel.updateOne({ userId: userId }, { productId: productList });
		return response;
	}
}
