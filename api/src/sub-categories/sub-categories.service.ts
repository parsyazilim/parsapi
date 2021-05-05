import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubCategoryDTO, SubCategoryStatusDTO, SubCategoryUserDTO, SubCategoryDropdownDTO, SubCategorySaveDTO, } from './sub-categories.model';

@Injectable()
export class SubCategoryService {
	constructor(
		@InjectModel('SubCategory') private readonly subcategoryModel: Model<any>
	) {
	}

	// ######################################### USER #######################################
	public async getAllEnabledSubCategories(): Promise<Array<SubCategoryUserDTO>> {
		return await this.subcategoryModel.find({ status: true }, 'title description categoryId categoryName');
	}

	// ######################################### ADMIN #######################################
	// Get All SubCategory
	public async getAllSubCategories(page: number, limit: number, search: string): Promise<Array<SubCategoryDTO>> {
		const skip = page * limit;
		let filter = {};
		if (search) filter = { title: { $regex: search, $options: 'i' } }
		return await this.subcategoryModel.find(filter, 'title description categoryId categoryName status').limit(limit).skip(skip).sort({ createdAt: 1 });
	}
	public async getAllSubCategoriesForImport(): Promise<Array<SubCategoryDTO>> {
		return await this.subcategoryModel.find({}, 'title description categoryId categoryName status').sort({ createdAt: 1 });
	}

	
	public async countAllSubCategories(search: string): Promise<number> {
		let filter = {};
		if (search) filter = { title: { $regex: search, $options: 'i' } }
		return await this.subcategoryModel.countDocuments(filter);
	}

	// find sub category by title and categoryId
	public async findSubCategoryByTitle(title: String, categoryId: String): Promise<Array<SubCategoryDTO>> {
		return await this.subcategoryModel.findOne({ title: title, categoryId: categoryId }, 'title description categoryId categoryName status');
	}

	// get sub categoriy deail by subCategoryId
	public async getSubCategoryDetail(subCategoryId: String): Promise<SubCategoryDropdownDTO> {
		return await this.subcategoryModel.findOne({ _id: subCategoryId }, 'title description categoryId status');
	}

	public async findSubCategoryByIdAndCatId(subCategoryId: String, categoryId: string): Promise<SubCategoryDropdownDTO> {
		return await this.subcategoryModel.findOne({ _id: subCategoryId, categoryId: categoryId }, 'title ');
	}

	public async createSubCategory(subCategoryData: SubCategorySaveDTO): Promise<SubCategoryDTO> {
		return await this.subcategoryModel.create(subCategoryData);
	}

	public async deleteSubCategory(subCategoryId: string): Promise<SubCategoryDropdownDTO> {
		return await this.subcategoryModel.findByIdAndRemove(subCategoryId);
	}

	//Update the SubCategory By Id
	public async updateSubCategory(subCategoryId: string, subCategoryData: SubCategorySaveDTO): Promise<SubCategoryDTO> {
		return await this.subcategoryModel.findByIdAndUpdate(subCategoryId, subCategoryData);
	}

	public async updateSubCategoryStatus(subCategoryId: string, statusData: SubCategoryStatusDTO): Promise<SubCategoryDTO> {
		return await this.subcategoryModel.findByIdAndUpdate(subCategoryId, statusData);
	}

	public async updateSubCategortStatusByCategoryId(categoryId: string, subCategoryStatusData: SubCategoryStatusDTO): Promise<number> {
		return await this.subcategoryModel.updateMany({ categoryId: categoryId }, subCategoryStatusData);
	}

	public async getDropdownListSubCategory(categoryId: string): Promise<Array<SubCategoryDropdownDTO>> {
		return await this.subcategoryModel.find({ categoryId: categoryId }, 'title status');
	}

	public async getDropdownListSubCategoryEnabled(categoryId: string): Promise<Array<SubCategoryDropdownDTO>> {
		return await this.subcategoryModel.find({ categoryId: categoryId, status: true }, 'title');
	}
}
