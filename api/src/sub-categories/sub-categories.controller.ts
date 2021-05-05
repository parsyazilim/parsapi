import { Controller, Body, Post, Get, Put, Param, UseGuards, Delete, Query } from '@nestjs/common';
import { SubCategoryService } from './sub-categories.service';
import { CategoryService } from '../categories/categories.service';
import { SubCategoryStatusDTO, ResponseSubCategoryDTO, ResponseSubCategoryListDTO, ResponseSubCategoryUserListDTO, SubCategorySaveDTO, ResponseSubCategoryDrpodownDTO, ResponseSubCategoryDetailDTO } from './sub-categories.model';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiUseTags, ApiOperation, ApiResponse, ApiImplicitQuery } from '@nestjs/swagger';
import { UtilService } from '../utils/util.service';
import { UsersDTO } from '../users/users.model';
import { ResponseMessage, ResponseSuccessMessage, ResponseErrorMessage, CommonResponseModel, ResponseBadRequestMessage, AdminQuery } from '../utils/app.model';
import { GetUser } from '../utils/jwt.strategy';
import { ProductService } from '../products/products.service';

@Controller('sub-categories')
@ApiUseTags('Sub Categories')
export class SubCategoryController {
	constructor(
		private subCategoryService: SubCategoryService,
		private categoryService: CategoryService,
		private productService: ProductService,
		private utilService: UtilService
	) {
	}

	// #################################################### USER ##########################################
	@Get('/list')
	@ApiOperation({ title: 'Get All enabled sub-categories' })
	@ApiResponse({ status: 200, description: 'Return list of enabled sub-categories', type: ResponseSubCategoryUserListDTO })
	public async getAllEnabledSubCategories(): Promise<CommonResponseModel> {
		try {
			const subCategories = await this.subCategoryService.getAllEnabledSubCategories();
			return this.utilService.successResponseData(subCategories);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	// #################################################### ADMIN ##########################################
	@Get('/admin/list')
	@ApiOperation({ title: 'Get All sub-categories' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of category', type: ResponseSubCategoryListDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAllSubCategories(@GetUser() user: UsersDTO, @Query() adminQuery: AdminQuery): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let pagination = this.utilService.getAdminPagination(adminQuery);
			const subCategories = await Promise.all([
				this.subCategoryService.getAllSubCategories(pagination.page - 1, pagination.limit, pagination.q),
				this.subCategoryService.countAllSubCategories(pagination.q)
			])
			return this.utilService.successResponseData(subCategories[0], { total: subCategories[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/dropdown-list/:categoryId')
	@ApiOperation({ title: 'Get all sub-categories by categoryId' })
	@ApiResponse({ status: 200, description: ' Return list of sub-categories by categoryId', type: ResponseSubCategoryDrpodownDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getDropdownListCategory(@GetUser() user: UsersDTO, @Param('categoryId') categoryId: string): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const subCategories = await this.subCategoryService.getDropdownListSubCategory(categoryId);
			return this.utilService.successResponseData(subCategories);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/detail/:subCategoryId')
	@ApiOperation({ title: 'Get sub-category detail by subCategoryId' })
	@ApiResponse({ status: 200, description: 'sub-category detail', type: ResponseSubCategoryDetailDTO })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getSubCategoryDetail(@GetUser() user: UsersDTO, @Param('subCategoryId') subCategoryId: string): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const subCategory = await this.subCategoryService.getSubCategoryDetail(subCategoryId);
			if (!subCategory) this.utilService.badRequest(ResponseMessage.SUB_CATEGORY_NOT_FOUND);
			else return this.utilService.successResponseData(subCategory);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/admin/create')
	@ApiOperation({ title: 'Create sub-category' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async createSubCategory(@GetUser() user: UsersDTO, @Body() subCategoryData: SubCategorySaveDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const subCategoryExist = await this.subCategoryService.findSubCategoryByTitle(subCategoryData.title, subCategoryData.categoryId);
			if (subCategoryExist) this.utilService.badRequest(ResponseMessage.SUB_CATEGORY_ALREADY_EXIST);

			const category = await this.categoryService.getCategorieDetail(subCategoryData.categoryId);
			if (!category) this.utilService.badRequest(ResponseMessage.CATEGORY_NOT_FOUND);
			subCategoryData.categoryName = category.title;

			const subCategory = await this.subCategoryService.createSubCategory(subCategoryData);
			if (subCategory) {
				const category = await this.categoryService.increaseSubCategoryCount(subCategoryData.categoryId);
				if (category) return this.utilService.successResponseMsg(ResponseMessage.SUB_CATEGORY_SAVED);
				this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
			}
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/update/:subCategoryId')
	@ApiOperation({ title: 'Update sub-category by subCategoryId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateSubCategory(@GetUser() user: UsersDTO, @Param('subCategoryId') subCategoryId: string, @Body() subCategoryData: SubCategorySaveDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const subCategoryExist = await this.subCategoryService.getSubCategoryDetail(subCategoryId);
			if (!subCategoryExist) this.utilService.badRequest(ResponseMessage.SUB_CATEGORY_NOT_FOUND);

			const category = await this.categoryService.getCategorieDetail(subCategoryData.categoryId);
			if (!category) this.utilService.badRequest(ResponseMessage.CATEGORY_NOT_FOUND);
			subCategoryData.categoryName = category.title;

			const subCategory = await this.subCategoryService.updateSubCategory(subCategoryId, subCategoryData);
			if (subCategory) return this.utilService.successResponseMsg(ResponseMessage.SUB_CATEGORY_UPDATED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/status-update/:subCategoryId')
	@ApiOperation({ title: 'Update sub-category status by subCategoryId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateStatusSubCategory(@GetUser() user: UsersDTO, @Param('subCategoryId') subCategoryId: string, @Body() statusData: SubCategoryStatusDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const subCategoryExist = await this.subCategoryService.getSubCategoryDetail(subCategoryId);
			if (!subCategoryExist) this.utilService.badRequest(ResponseMessage.SUB_CATEGORY_NOT_FOUND);

			const subCategory = await this.subCategoryService.updateSubCategoryStatus(subCategoryId, statusData);
			if (subCategory) return this.utilService.successResponseMsg(ResponseMessage.SUB_CATEGORY_STATUS_UPDATED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Delete('/admin/delete/:subCategoryId')
	@ApiOperation({ title: 'Delete sub-category by subCategoryId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async deleteSubCategory(@GetUser() user: UsersDTO, @Param('subCategoryId') subCategoryId: string): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const subCategoryData = await this.subCategoryService.getSubCategoryDetail(subCategoryId);
			if (!subCategoryData) this.utilService.badRequest(ResponseMessage.SUB_CATEGORY_NOT_FOUND);

			const products = await this.productService.countAllProductBySubCategory(subCategoryId);
			if (products && products > 0) this.utilService.badRequest(ResponseMessage.SUB_CATEGORY_NOT_DELETED_HAVE_PRODUCT);

			const subCategory = await this.subCategoryService.deleteSubCategory(subCategoryId);
			if (subCategory) {
				const category = await this.categoryService.descreaseSubCategoryCount(subCategoryData.categoryId);
				if (category) return this.utilService.successResponseMsg(ResponseMessage.SUB_CATEGORY_DELETED);
				this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
			}
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
}
