import { Injectable } from '@nestjs/common';
import { ProductsDTO, PuductStatusDTO, ProductListAdminDTO, ProductTitleListAdminDTO, ImportProductDTO, ProductsSaveDTO } from './products.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ProductService {
	constructor(
		@InjectModel('Product') private readonly productModel: Model<any>
	) { }

	// home page products pagination
	public async GetProductsForUser(page: number, limit: number): Promise<Array<any>> {
		const skip = page * limit;
		let products = await this.productModel.find({ status: true }, 'title filePath imageUrl productImages isDealAvailable dealPercent categoryName variant averageRating productImages').limit(limit).skip(skip).sort({ createdAt: - 1 });
		return products;
	}

	public async countAllProductForUser(): Promise<number> {
		const products = await this.productModel.countDocuments({ status: true });
		return products;
	}

	public async GetSubscriptionProductsForUser(page: number, limit: number): Promise<Array<any>> {
		const skip = page * limit;
		return await this.productModel.aggregate([
			// Get just the docs that contain a shapes element where color is 'red'
			{ $match: { 'variant.isSubScriptionAllowed': true, status: true } },
			{
				$skip: skip
			},
			{
				$limit: limit
			},
			{
				$project: {
					variant: {
						$filter: {
							input: '$variant',
							as: 'variant',
							cond: { $eq: ['$$variant.isSubScriptionAllowed', true] }
						}
					},
					_id: 1,
					title: 1,
					description: 1,
					filePath: 1,
					imageUrl: 1,
					productImages: 1,
					isDealAvailable: 1,
					dealPercent: 1,
					categoryName: 1,
					averageRating: 1,
				}
			}
		])
	}
	public async countAllSubscriptionProductForUser(): Promise<number> {
		const products = await this.productModel.countDocuments({ "status": true, "variant.isSubScriptionAllowed": true });
		return products;
	}

	public async searchProduct(searchKey: string, page: number, limit: number): Promise<Array<ProductsDTO>> {
		const skip = page * limit;
		searchKey = searchKey.trim();
		let filter = { status: true };

		let response = await this.productModel.aggregate([
			{
				$search: {
					"autocomplete": {
						"query": searchKey,
						"path": "keyWords"
					}
				}
			},
			{ $match: filter },
			{
				$skip: skip
			},
			{
				$limit: limit
			},
			{
				$project: {
					"_id": 1,
					"title": 1,
					"filePath": 1,
					"imageUrl": 1,
					"isDealAvailable": 1,
					"dealPercent": 1,
					"categoryName": 1,
					"variant": 1,
					"averageRating": 1,
					"productImages": 1
				}
			}
		]);
		if (!response || response == [] || response == null || response == undefined) {
			response = await this.productModel.find({ keyWords: { $regex: searchKey, $options: 'i' }, status: true }, '_id title productImages filePath imageUrl isDealAvailable dealPercent categoryName variant averageRating').limit(limit).skip(skip);
		}
		return response;
	}

	public async countAllSearchProduct(searchKey: string): Promise<number> {
		searchKey = searchKey.trim();
		let filter = { status: true };

		let response = await this.productModel.aggregate([
			{
				$search: {
					"autocomplete": {
						"query": searchKey,
						"path": "keyWords"
					}
				}
			},
			{ $match: filter },
			{
				$project: {
					"_id": 1,
					"title": 1,
					"filePath": 1,
					"imageUrl": 1,
					"isDealAvailable": 1,
					"dealPercent": 1,
					"categoryName": 1,
					"variant": 1,
					"averageRating": 1,
					"productImages": 1
				}
			}
		]);
		if (!response || response == [] || response == null || response == undefined) {
			response = await this.productModel.find({ keyWords: { $regex: searchKey, $options: 'i' }, status: true }, '_id title productImages filePath imageUrl isDealAvailable dealPercent categoryName variant averageRating');
		}
		return response.length;
	}
	public async getAllProduct(productFilter, page: number, limit: number): Promise<Array<any>> {
		const skip = page * limit;
		const products = await this.productModel.find(productFilter, 'title categoryName subCategoryName isDealAvailable dealPercent status imageUrl productImages').limit(limit).skip(skip);
		return products;
	}

	public async countAllProduct(): Promise<number> {
		const products = await this.productModel.countDocuments({});
		return products;
	}

	public async getAllProductByCategory(categoryId: string, page: number, limit: number): Promise<Array<any>> {
		const skip = page * limit;
		const products = await this.productModel.find({ categoryId: categoryId }, 'title categoryName subCategoryName isDealAvailable dealPercent status imageUrl productImages').limit(limit).skip(skip);
		return products;
	}

	public async countAllProductByCategory(categoryId: string): Promise<number> {
		const products = await this.productModel.countDocuments({ categoryId: categoryId });
		return products;
	}

	public async getAllProductBySubCategory(subCategoryId: string, page: number, limit: number): Promise<Array<any>> {
		const skip = page * limit;
		const products = await this.productModel.find({ subCategoryId: subCategoryId }, 'title categoryName subCategoryName isDealAvailable dealPercent status imageUrl productImages').limit(limit).skip(skip);
		return products;
	}

	public async countAllProductBySubCategory(subCategoryId: string): Promise<number> {
		const products = await this.productModel.countDocuments({ subCategoryId: subCategoryId });
		return products;
	}

	public async getDropdownListProduct(): Promise<Array<any>> {
		const products = await this.productModel.find({}, 'title status isDealAvailable dealId');
		return products;
	}

	// find product by title
	public async findProductByTitle(title: String) {
		const response = await this.productModel.findOne({ title: title });
		return response;
	}

	// product detail
	public async getProductDetail(productId: string): Promise<ProductsDTO> {
		const product = await this.productModel.findById(productId);
		return product;
	}

	// product detail
	public async getProductDetailForUser(productId: string): Promise<any> {
		const product = await this.productModel.findById(productId, 'title description sku filePath imageUrl productImages isDealAvailable dealPercent categoryId categoryName subCategoryId subCategoryName variant averageRating totalRating noOfUsersRated keyWords');
		return product;
	}

	// creates product
	public async createProduct(productData: ProductsSaveDTO): Promise<ProductsDTO> {
		const product = await this.productModel.create(productData);
		return product;
	}

	// updates product 
	public async updateProduct(productId: string, productData: ProductsSaveDTO): Promise<ProductsDTO> {
		const product = await this.productModel.findByIdAndUpdate(productId, productData, { new: true });
		return product;
	}

	//product status update
	public async updateProductStatus(productId: string, productStatusData: PuductStatusDTO): Promise<ProductsDTO> {
		const product = await this.productModel.findByIdAndUpdate(productId, productStatusData, { new: true });
		return product;
	}

	public async deleteProduct(productId: string): Promise<ProductsDTO> {
		const response = await this.productModel.findByIdAndRemove(productId);
		return response;
	}

	public async getDealProductByIds(productIds: any, page: number, limit: number): Promise<any> {
		const skip = page * limit;
		const products = await this.productModel.find({ _id: { $in: productIds } }, 'title description status sku filePath imageUrl productImages isDealAvailable dealPercent variant averageRating').limit(limit).skip(skip);
		return products;
	}

	public async getProductByIds(productIds: any): Promise<any> {
		const products = await this.productModel.find({ _id: { $in: productIds } }, 'title description status sku filePath imageUrl productImages isDealAvailable dealPercent variant averageRating');
		return products;
	}

	public async countProductByCategoryId(categoryId: string): Promise<number> {
		const count = await this.productModel.countDocuments({ categoryId: categoryId });
		return count;
	}

	public async countProductBySubCategoryId(subCategoryId: string): Promise<number> {
		const count = await this.productModel.countDocuments({ subCategoryId: subCategoryId });
		return count;
	}

	public async updateProductStatusByCategoryId(categoryId: string, productStatusData: PuductStatusDTO): Promise<number> {
		const products = await this.productModel.updateMany({ categoryId: categoryId }, productStatusData);
		return products;
	}

	public async addCartInProduct(cartData, products) {
		if (!cartData) return products;
		for (let item of cartData.products) {
			let unit = item.unit;
			let quantity = item.quantity;
			const productIndex = products.findIndex(val => val._id.toString() == item.productId);

			if (productIndex !== -1) {
				let obj = JSON.parse(JSON.stringify(products[productIndex]));
				if (obj && obj.variant.length > 1) {
					const unitIndex = obj.variant.findIndex(val => val.unit == unit);
					if (unitIndex !== -1) {
						var temp = obj.variant[unitIndex];
						obj.variant[unitIndex] = obj.variant[0];
						obj.variant[0] = temp;
						obj.unitInCart = unit;
					}
				}
				obj.quantityToCart = quantity;
				obj.isAddedToCart = true;
				products.splice(productIndex, 1, obj);
			}
		}
		return products;
	}

	public async updateDealByCategoryId(categoryId: string, dealData): Promise<ProductsDTO> {
		const products = await this.productModel.updateMany({ categoryId: categoryId }, dealData);
		return products;
	}

	public async updateDealById(productId: string, dealData): Promise<ProductsDTO> {
		const products = await this.productModel.updateOne({ _id: productId }, dealData);
		return products;
	}

	public async updateProductStock(productId: string, variantData): Promise<ProductsDTO> {
		const products = await this.productModel.updateOne({ _id: productId }, { variant: variantData });
		return products;
	}

	public async findProductStock(productId: string, unit: string): Promise<ProductsDTO> {
		const products = await this.productModel.findOne({ _id: productId });
		return products;
	}

	public async updateRating(productId: string, ratingData): Promise<ProductsDTO> {
		const products = await this.productModel.updateOne({ _id: productId }, ratingData);
		return products;
	}

	public async getAllProductForExport(page: number, limit: number): Promise<Array<any>> {
		const skip = page * limit;
		let products = await this.productModel.find({ status: true }, 'title description imageUrl productImages categoryId subCategoryId variant keyWords').limit(limit).skip(skip).sort({ createdAt: - 1 });
		return products;
	}

	public async updateProductByImport(productId: string, productData: ImportProductDTO): Promise<ProductsDTO> {
		console.log("-----------productupfate data--------------", productData)
		const product = await this.productModel.updateOne({ _id: productId }, productData, { new: true });
		console.log("-------------product-----------", product);
		return product;
	}

	public async addProductByImport(productData: Array<ImportProductDTO>): Promise<any> {
		const product = await this.productModel.insertMany(productData);
		return product;
	}

	public async getAllProductByCategoryForPos(categoryId: string, page: number, limit: number): Promise<Array<any>> {
		const skip = page * limit;
		const products = await this.productModel.find({ categoryId: categoryId }).limit(limit).skip(skip);
		return products;
	}


	// ###########################  USER ####################################################
	public async getProductByCategoryId(categoryId: string, page: number, limit: number): Promise<Array<ProductsDTO>> {
		const skip = page * limit;
		let products = await this.productModel.find({ categoryId: categoryId, status: true },
			'title imageUrl productImages filePath category isDealAvailable dealPercent variant averageRating').limit(limit).skip(skip)
			.sort({ createdAt: -1 });
		return products;
	}

	// returns products by sub-category
	public async getProductsBySubCategory(subCategoryId: string, page: number, limit: number): Promise<Array<ProductsDTO>> {
		const skip = page * limit;
		let response = await this.productModel.find({ subCategoryId: subCategoryId, status: true },
			'title imageUrl productImages filePath category subcategory isDealAvailable dealPercent variant averageRating').limit(limit).skip(skip)
			.sort({ createdAt: -1 });
		return response;
	}

}


