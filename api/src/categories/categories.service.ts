import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CategoryStatusUpdateDTO, CategoryListDTO, CategoryAdminListDTO, CategoryAdminDetailDTO, CategorySaveDTO } from './categories.model';

@Injectable()
export class CategoryService {
	constructor(
		@InjectModel('Category') private readonly categoryModel: Model<any>
	) {
	}

	// #################################################### USER ##########################################
	// Get All enabled catgories
	public async getAllEnabledCategories(): Promise<Array<CategoryListDTO>> {
		const categories = await this.categoryModel.find({ status: true }, 'title filePath imageUrl description').sort({ createdAt: 1 });
		return categories;
	}

	public async getCategoryListForHome(limit: number): Promise<Array<CategoryListDTO>> {
		limit = limit || 10;
		const categories = await this.categoryModel.find({ status: true }, 'title filePath imageUrl').limit(limit).sort({ createdAt: 1 });
		return categories;
	}

	// #################################################### ADMIN ##########################################
	// get all categories
	public async getAllCategories(page: number, limit: number, search: string): Promise<Array<CategoryAdminListDTO>> {
		const skip = page * limit;
		let filter = {};
		if (search) filter = { title: { $regex: search, $options: 'i' } }
		return await this.categoryModel.find(filter, 'title subCategoryCount imageUrl status isDealAvailable dealPercent').limit(limit).skip(skip).sort({ createdAt: 1 });
	}

	public async countAllCategory(search: string): Promise<number> {
		let filter = {};
		if (search) filter = { title: { $regex: search, $options: 'i' } }
		return await this.categoryModel.countDocuments(filter);
	}
	// get category count active
	public async countActiveCategory(): Promise<number> {
		return await this.categoryModel.countDocuments({ status: true });
	}
	// get categoriy deail by categoryId
	public async getCategorieDetail(categoryId: String): Promise<CategoryAdminDetailDTO> {
		const category = await this.categoryModel.findOne({ _id: categoryId }, 'title description imageUrl imageId filePath status isDealAvailable dealPercent subCategoryCount');
		return category;
	}

	// find category by title
	public async findCategoryByTitle(title: String): Promise<CategoryAdminDetailDTO> {
		const category = await this.categoryModel.findOne({ title: title }, 'title');
		return category;
	}

	// save category
	public async createCategory(categoryData: CategorySaveDTO): Promise<CategoryAdminDetailDTO> {
		const response = await this.categoryModel.create(categoryData) as CategoryAdminDetailDTO;
		return response;
	}

	// updates category
	public async updateCategory(categoryId: string, categoryData: CategorySaveDTO): Promise<CategoryAdminDetailDTO> {
		const response = await this.categoryModel.findByIdAndUpdate(categoryId, categoryData);
		return response;
	}

	public async deleteCategory(categoryId: string): Promise<CategoryAdminDetailDTO> {
		const response = await this.categoryModel.findByIdAndRemove(categoryId);
		return response;
	}

	//category status update
	public async statusUpdate(categoryId: string, categoryStatusData: CategoryStatusUpdateDTO): Promise<any> {
		const response = await this.categoryModel.findByIdAndUpdate(categoryId, categoryStatusData);
		return response;
	}

	public async increaseSubCategoryCount(categoryId: string): Promise<any> {
		const category = await this.categoryModel.findByIdAndUpdate(categoryId, { $inc: { subCategoryCount: 1 } });
		return category;
	}

	public async descreaseSubCategoryCount(categoryId: string): Promise<any> {
		const category = await this.categoryModel.findByIdAndUpdate(categoryId, { $inc: { subCategoryCount: -1 } });
		return category;
	}

	public async updateDeal(categoryId: string, dealData): Promise<any> {
		const category = await this.categoryModel.findByIdAndUpdate(categoryId, dealData, { new: true });
		return category;
	}

	public async getDropdownListCategory(): Promise<Array<any>> {
		const products = await this.categoryModel.find({}, 'title status');
		return products;
	}

	public async getAllCategoriesWithNoSubCategories(): Promise<Array<any>> {
		return await this.categoryModel.find({ subCategoryCount: 0 })
	}

	public async getCategoryTitle(IDS): Promise<Array<any>> {
		return await this.categoryModel.find({ _id: { $in: IDS } }, 'title')
	}


}
