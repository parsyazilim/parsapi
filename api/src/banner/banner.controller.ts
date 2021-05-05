import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BannerService } from './banner.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiConsumes, ApiImplicitFile, ApiUseTags, ApiOperation, ApiResponse, ApiImplicitQuery } from '@nestjs/swagger';
import { UsersDTO } from '../users/users.model';
import { BannerType, BannerSaveDTO, ResponseUserBannerList, ResponseBannerList, ResponseBannerType, ResponseBanner } from './banner.model';
import { UtilService } from '../utils/util.service';
import { UserRoles, ResponseMessage, UploadImageDTO, UploadImageResponseDTO, ResponseErrorMessage, ResponseSuccessMessage, AdminSettings, CommonResponseModel, ResponseBadRequestMessage, AdminQuery } from '../utils/app.model';
import { UploadService } from '../utils/upload.service';
import { CategoryService } from '../categories/categories.service';
import { ProductService } from '../products/products.service';
import { GetUser } from '../utils/jwt.strategy';

@Controller('banners')
@ApiUseTags('Banners')
export class BannerController {
	constructor(
		private bannerService: BannerService,
		private categoryService: CategoryService,
		private ProductService: ProductService,
		private utilService: UtilService,
		private uploadService: UploadService
	) {
	}

	// #################################################### USER ##########################################
	@Get('/list')
	@ApiOperation({ title: 'Get all enabled banner for user' })
	@ApiResponse({ status: 200, description: 'Return list of enabled banners', type: ResponseUserBannerList })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async getAllEnabledBanners(): Promise<CommonResponseModel> {
		try {
			const banners = await this.bannerService.getAllEnabledBanners();
			return this.utilService.successResponseData(banners);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	// #################################################### ADMIN ##########################################
	@Get('/admin/list')
	@ApiOperation({ title: 'Get all banner list' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of banners', type: ResponseBannerList })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAllBanner(@GetUser() user: UsersDTO, @Query() adminQuery: AdminQuery): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let pagination = this.utilService.getAdminPagination(adminQuery);
			const banners = await Promise.all([
				this.bannerService.getAllBanner(pagination.page - 1, pagination.limit, pagination.q),
				this.bannerService.countAllBanner(pagination.q)
			])
			return this.utilService.successResponseData(banners[0], { total: banners[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/detail/:bannerId')
	@ApiOperation({ title: 'Get banner by bannerId' })
	@ApiResponse({ status: 200, description: 'Get banner detail by bannerId', type: ResponseBanner })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getBannerDetail(@GetUser() user: UsersDTO, @Param('bannerId') bannerId: string): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const banner = await this.bannerService.getBannerDetail(bannerId);
			if (banner) return this.utilService.successResponseData(banner);
			else this.utilService.badRequest(ResponseMessage.BANNER_NOT_FOUND);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/admin/create')
	@ApiOperation({ title: 'Create banner' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async createBanner(@GetUser() user: UsersDTO, @Body() bannerData: BannerSaveDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			if (bannerData.bannerType === BannerType.CATEGORY && !bannerData.categoryId) {
				this.utilService.badRequest(ResponseMessage.BANNER_CATEGORY_ID_MISSING);
			} else if (bannerData.bannerType === BannerType.PRODUCT && !bannerData.productId) {
				this.utilService.badRequest(ResponseMessage.BANNER_PRODUCT_ID_MISSING);
			}

			if (bannerData.bannerType === BannerType.CATEGORY) {
				const category = await this.categoryService.getCategorieDetail(bannerData.categoryId);

				if (!category) this.utilService.badRequest(ResponseMessage.CATEGORY_NOT_FOUND);
				bannerData.categoryName = category.title;
				bannerData.productId = null;
			} else if (bannerData.bannerType === BannerType.PRODUCT) {
				const product = await this.ProductService.getProductDetail(bannerData.productId);

				if (!product) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);
				bannerData.productName = product.title;
				bannerData.categoryId = null;
			}
			const banner = await this.bannerService.createBanner(bannerData);

			if (banner) return this.utilService.successResponseMsg(ResponseMessage.BANNER_SAVED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/update/:bannerId')
	@ApiOperation({ title: 'Update banner by bannerId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateBanner(@GetUser() user: UsersDTO, @Param('bannerId') bannerId: string, @Body() bannerData: BannerSaveDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const bannerExist = await this.bannerService.getBannerDetail(bannerId);
			if (!bannerExist._id) this.utilService.badRequest(ResponseMessage.BANNER_NOT_FOUND);

			if (bannerData.bannerType === BannerType.CATEGORY && !bannerData.categoryId) {
				this.utilService.badRequest(ResponseMessage.BANNER_CATEGORY_ID_MISSING);
			} else if (bannerData.bannerType === BannerType.PRODUCT && !bannerData.productId) {
				this.utilService.badRequest(ResponseMessage.BANNER_PRODUCT_ID_MISSING);
			}
			if (bannerData.bannerType === BannerType.CATEGORY) {
				const category = await this.categoryService.getCategorieDetail(bannerData.categoryId);
				if (!category._id) this.utilService.badRequest(ResponseMessage.CATEGORY_NOT_FOUND);
				bannerData.categoryName = category.title;
				bannerData.productId = null;
			} else if (bannerData.bannerType === BannerType.PRODUCT) {
				const product = await this.ProductService.getProductDetail(bannerData.productId);
				if (!product._id) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);
				bannerData.productName = product.title;
				bannerData.categoryId = null;
			}
			const banner = await this.bannerService.updateBanner(bannerId, bannerData);

			if (banner) return this.utilService.successResponseMsg(ResponseMessage.BANNER_UPDATED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Delete('/admin/delete/:bannerId')
	@ApiOperation({ title: 'Delete banner by bannerId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async deleteBanner(@GetUser() user: UsersDTO, @Param('bannerId') bannerId: string): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const bannerExist = await this.bannerService.getBannerDetail(bannerId);
			if (!bannerExist) this.utilService.badRequest(ResponseMessage.BANNER_NOT_FOUND);

			const banner = await this.bannerService.deleteBanner(bannerId);
			if (banner) return this.utilService.successResponseMsg(ResponseMessage.BANNER_DELETED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/admin/upload/image')
	@ApiOperation({ title: 'Banner image upload' })
	@ApiResponse({ status: 200, description: 'Return image detail', type: UploadImageResponseDTO })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseInterceptors(FileInterceptor('file'))
	@ApiConsumes('multipart/form-data')
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	@ApiImplicitFile({ name: 'file', required: true, description: 'Banner image upload' })
	public async categoryImageUpload(@GetUser() user: UsersDTO, @UploadedFile() file, @Body() image: UploadImageDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const uploadedImage = await this.uploadService.uploadImage(file, image.type) as UploadImageResponseDTO;
			if (uploadedImage && uploadedImage.url) return this.utilService.successResponseData(uploadedImage);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/type/list')
	@ApiOperation({ title: 'Get all banner type for dropdown' })
	@ApiResponse({ status: 200, description: 'Return list of banner type', type: ResponseBannerType })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getBannerTypeList(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const bannerTypeList = await this.bannerService.getBannerTypeList();
			return this.utilService.successResponseData(bannerTypeList);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
}
