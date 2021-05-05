import { Controller, UseGuards, Post, UseInterceptors, UploadedFile, Delete, Param, Body, Get, Put, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CategoryService } from './categories.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiConsumes, ApiImplicitFile, ApiUseTags, ApiOperation, ApiResponse, ApiImplicitQuery } from '@nestjs/swagger';
import { UsersDTO } from '../users/users.model';
import { CategoryStatusUpdateDTO, CategorySaveDTO, ResponseUserCategoryList, ResponseCategoryAdmin, CategoryAdminDetailDTO, ResponseDropDown } from './categories.model';
import { UtilService } from '../utils/util.service';
import { UploadService } from '../utils/upload.service';
import { ResponseMessage, UploadImageDTO, UploadImageResponseDTO, ResponseErrorMessage, ResponseSuccessMessage, CommonResponseModel, ResponseBadRequestMessage, AdminQuery } from '../utils/app.model';
import { ProductService } from '../products/products.service';
import { SubCategoryService } from '../sub-categories/sub-categories.service';
import { GetUser } from '../utils/jwt.strategy';
import { BannerService } from '../banner/banner.service';
import { DealService } from '../deals/deals.service';

@Controller('categories')
@ApiUseTags('Categories')
export class CategoryController {
	constructor(
		private categoryService: CategoryService,
		private SubCategoryService: SubCategoryService,
		private productService: ProductService,
		private bannerService: BannerService,
		private dealService: DealService,
		private utilService: UtilService,
		private uploadService: UploadService
	) {
	}

	// #################################################### USER ##########################################
	@Get('/list')
	@ApiOperation({ title: 'Get All enabled categories' })
	@ApiResponse({ status: 200, description: 'Return list of enabled categories', type: ResponseUserCategoryList })
	public async getAllEnabledCategories(): Promise<CommonResponseModel> {
		try {
			const categories = await this.categoryService.getAllEnabledCategories();
			return this.utilService.successResponseData(categories);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	// #################################################### ADMIN ##########################################
	@Get('/admin/list')
	@ApiOperation({ title: 'Get All categories for admin' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of category', type: ResponseCategoryAdmin })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAllCategories(@GetUser() user: UsersDTO, @Query() adminQuery: AdminQuery): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let pagination = this.utilService.getAdminPagination(adminQuery);
			const categories = await Promise.all([
				this.categoryService.getAllCategories(pagination.page - 1, pagination.limit, pagination.q),
				this.categoryService.countAllCategory(pagination.q)
			])
			return this.utilService.successResponseData(categories[0], { total: categories[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/detail/:categoryId')
	@ApiOperation({ title: 'Get category detail by categoryId' })
	@ApiResponse({ status: 200, description: 'Return category detail by categoryId', type: CategoryAdminDetailDTO })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getCategorieDetail(@GetUser() user: UsersDTO, @Param('categoryId') categoryId: string): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const category = await this.categoryService.getCategorieDetail(categoryId);
			if (category) return this.utilService.successResponseData(category);
			else this.utilService.badRequest(ResponseMessage.CATEGORY_NOT_FOUND);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/dropdown-list')
	@ApiOperation({ title: 'Get category Id and Tilte ' })
	@ApiResponse({ status: 200, description: 'return Api response in array of Object', type: ResponseDropDown })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getDropdownListCategory(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const categories = await this.categoryService.getDropdownListCategory();
			return this.utilService.successResponseData(categories);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/admin/create')
	@ApiOperation({ title: 'Create category' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async createCategory(@GetUser() user: UsersDTO, @Body() categoryData: CategorySaveDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const categoryExist = await this.categoryService.findCategoryByTitle(categoryData.title);
			if (categoryExist) this.utilService.badRequest(ResponseMessage.CATEGORY_ALREADY_EXIST);

			categoryData.userId = user._id;
			const category = await this.categoryService.createCategory(categoryData);

			if (category) return this.utilService.successResponseMsg(ResponseMessage.CATEGORY_SAVED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/update/:categoryId')
	@ApiOperation({ title: 'Update category by categoryId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateCategory(@GetUser() user: UsersDTO, @Param('categoryId') categoryId: string, @Body() categoryData: CategorySaveDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const categoryExist = await this.categoryService.getCategorieDetail(categoryId);
			if (!categoryExist._id) this.utilService.badRequest(ResponseMessage.CATEGORY_NOT_FOUND);
			const category = await this.categoryService.updateCategory(categoryId, categoryData);

			if (category._id) return this.utilService.successResponseMsg(ResponseMessage.CATEGORY_UPDATED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/status-update/:categoryId')
	@ApiOperation({ title: 'Update category status by categoryId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateCategoryStatus(@GetUser() user: UsersDTO, @Param('categoryId') categoryId: string, @Body() categoryStatusData: CategoryStatusUpdateDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const categoryExist = await this.categoryService.getCategorieDetail(categoryId);
			if (!categoryExist._id) this.utilService.badRequest(ResponseMessage.CATEGORY_NOT_FOUND);

			const updates = await Promise.all([
				this.categoryService.statusUpdate(categoryId, categoryStatusData),
				this.SubCategoryService.updateSubCategortStatusByCategoryId(categoryId, categoryStatusData),
				this.productService.updateProductStatusByCategoryId(categoryId, categoryStatusData)
			]);
			if (updates[0]) return this.utilService.successResponseMsg(ResponseMessage.CATEGORY_STATUS_UPDATED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Delete('/admin/delete/:categoryId')
	@ApiOperation({ title: 'Delete category by categoryId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async deleteCategory(@GetUser() user: UsersDTO, @Param('categoryId') categoryId: string): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const categoryExist = await this.categoryService.getCategorieDetail(categoryId);
			if (!categoryExist._id) this.utilService.badRequest(ResponseMessage.CATEGORY_NOT_FOUND);

			if (categoryExist.subCategoryCount > 0) this.utilService.badRequest(ResponseMessage.CATEGORY_NOT_DELETED_HAVE_SUBCATEGORY);

			const products = await this.productService.countProductByCategoryId(categoryId);
			if (products) this.utilService.badRequest(ResponseMessage.CATEGORY_NOT_DELETED_HAVE_PRODUCT);

			const banners = await this.bannerService.countBannerByCategoryId(categoryId);
			if (banners) this.utilService.badRequest(ResponseMessage.CATEGORY_NOT_DELETED_HAVE_BANNER);

			const deals = await this.dealService.countDealByCategoryId(categoryId);
			if (deals) this.utilService.badRequest(ResponseMessage.CATEGORY_NOT_DELETED_HAVE_DEAL);

			const category = await this.categoryService.deleteCategory(categoryId);
			if (category) return this.utilService.successResponseMsg(ResponseMessage.CATEGORY_DELETED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/admin/upload/image')
	@ApiOperation({ title: 'Category image upload' })
	@ApiResponse({ status: 200, description: 'Return image detail', type: UploadImageResponseDTO })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseInterceptors(FileInterceptor('file'))
	@ApiConsumes('multipart/form-data')
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	@ApiImplicitFile({ name: 'file', required: true, description: 'Category image upload' })
	public async categoryImageUpload(@GetUser() user: UsersDTO, @UploadedFile() file, @Body() image: UploadImageDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const uploadedImage = await this.uploadService.uploadImage(file, image.type) as UploadImageResponseDTO;
			if (uploadedImage.url) return this.utilService.successResponseData(uploadedImage)
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
}
