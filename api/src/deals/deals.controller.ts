import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiConsumes, ApiImplicitFile, ApiUseTags, ApiOperation, ApiResponse, ApiImplicitQuery } from '@nestjs/swagger';
import { DealService } from './deals.service';
import { UsersDTO } from '../users/users.model';
import { DealStatusDTO, DealType, DealSaveDTO } from './deals.model';
import { UtilService } from '../utils/util.service';
import { UploadService } from '../utils/upload.service';
import { CategoryService } from '../categories/categories.service';
import { ProductService } from '../products/products.service';
import { ResponseMessage, UploadImageDTO, UploadImageResponseDTO, AdminSettings, CommonResponseModel, ResponseBadRequestMessage, ResponseErrorMessage, ResponseSuccessMessage, AdminQuery, UserQuery } from '../utils/app.model';
import { GetUser, OptionalJwtAuthGuard } from '../utils/jwt.strategy';
import { CartService } from '../cart/cart.service'
import { ProductsResponsePaginationDTO } from '../products/products.model';

@Controller('deals')
@ApiUseTags('Deals')
export class DealController {
	constructor(
		private dealService: DealService,
		private categoryService: CategoryService,
		private productService: ProductService,
		private utilService: UtilService,
		private uploadService: UploadService,
		private cartService: CartService
	) { }

	// #################################################### USER ##########################################
	@Get('/top')
	@ApiOperation({ title: 'Get all enabled top deals for user' })
	@ApiResponse({ status: 200, description: 'Return list of enabled top deals' })
	public async topDeal(): Promise<CommonResponseModel> {
		try {
			const deals = await this.dealService.topDeals();
			return this.utilService.successResponseData(deals);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/of-the-day')
	@ApiOperation({ title: 'Get all enabled deals of the day for user' })
	@ApiResponse({ status: 200, description: 'Return list of enabled deals of the day' })
	public async dealOfTheDay(): Promise<CommonResponseModel> {
		try {
			const deals = await this.dealService.dealOfTheDay();
			return this.utilService.successResponseData(deals);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/products/:dealId')
	@ApiOperation({ title: 'Get related product by dealId' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Get related product by dealId', type: ProductsResponsePaginationDTO })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(OptionalJwtAuthGuard)
	@ApiBearerAuth()
	public async getDealByProduct(@GetUser() user: UsersDTO, @Param('dealId') dealId: string, @Query() userQuery: UserQuery): Promise<CommonResponseModel> {
		let query = this.utilService.getUserPagination(userQuery)
		try {
			const deal = await this.dealService.getDealDetail(dealId);
			if (!deal) this.utilService.badRequest(ResponseMessage.DEAL_NOT_FOUND);
			let productIds = []
			let total = deal.products.length;
			deal.products.forEach(function (d) {
				productIds.push(d.productId);
			})
			let products = await this.productService.getDealProductByIds(productIds, query.page, query.limit);


			if (user && user._id) {
				let cart = await this.cartService.getCartByUserId(user._id);
				products = await this.productService.addCartInProduct(cart, products);
			}
			if (!products) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);
			return this.utilService.successResponseData(products, { total: total });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	// #################################################### ADMIN ##########################################
	@Get('/admin/list')
	@ApiOperation({ title: 'Get all deals' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of deals' })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found' })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getDeals(@GetUser() user: UsersDTO, @Query() adminQuery: AdminQuery): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let pagination = this.utilService.getAdminPagination(adminQuery);
			const deals = await Promise.all([
				this.dealService.getAllDeal(pagination.page - 1, pagination.limit, pagination.q),
				this.dealService.countAllDeal(pagination.q)
			])
			return this.utilService.successResponseData(deals[0], { total: deals[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/detail/:dealId')
	@ApiOperation({ title: 'Get deal by dealId' })
	@ApiResponse({ status: 200, description: 'Get deal detail by dealId', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getDealInformation(@GetUser() user: UsersDTO, @Param('dealId') dealId: string): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const deal = await this.dealService.getDealDetail(dealId);
			if (deal) return this.utilService.successResponseData(deal);
			else this.utilService.badRequest(ResponseMessage.DEAL_NOT_FOUND);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/admin/create')
	@ApiOperation({ title: 'Create deal' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async createDeal(@GetUser() user: UsersDTO, @Body() dealData: DealSaveDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			if (dealData.dealType === DealType.CATEGORY && !dealData.categoryId) {
				this.utilService.badRequest(ResponseMessage.DEAL_CATEGORY_ID_MISSING);
			} else if (dealData.dealType === DealType.PRODUCT && !(dealData.productId || dealData.products.length > 0)) {
				this.utilService.badRequest(ResponseMessage.DEAL_PRODUCT_ID_MISSING);
			}
			if (dealData.dealType === DealType.CATEGORY) {
				const dealExist = await this.dealService.getDealByCategoryId(dealData.categoryId);
				if (dealExist) this.utilService.badRequest(ResponseMessage.DEAL_ALREADY_EXIST);
				const category = await this.categoryService.getCategorieDetail(dealData.categoryId);
				if (!category) this.utilService.badRequest(ResponseMessage.CATEGORY_NOT_FOUND);
				dealData.categoryName = category.title;
				dealData.productId = null;
				dealData.productName = null;
			} else if (dealData.dealType === DealType.PRODUCT) {
				if (dealData.products && dealData.products.length > 0) {
					for (let i = 0; i < dealData.products.length; i++) {
						const dealExist = await this.dealService.getDealByProductId(dealData.products[i].productId);
						if (dealExist) this.utilService.badRequest(ResponseMessage.DEAL_ALREADY_EXIST);
						const product = await this.productService.getProductDetail(dealData.products[i].productId);
						if (!product) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);
						dealData.products[i].productName = product.title;
					}
				} else {
					const dealExist = await this.dealService.getDealByProductId(dealData.productId);
					if (dealExist) this.utilService.badRequest(ResponseMessage.DEAL_ALREADY_EXIST);
					const product = await this.productService.getProductDetail(dealData.productId);
					if (!product) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);
					dealData.productName = product.title;
				}
				dealData.categoryId = null;
				dealData.categoryName = null;
			}
			const deal = await this.dealService.createDeal(dealData);
			if (deal) {
				let dealObj = { isDealAvailable: true, dealPercent: deal.dealPercent, dealId: deal._id, dealType: deal.dealType };
				if (deal.dealType === DealType.CATEGORY) {
					await Promise.all([
						this.productService.updateDealByCategoryId(deal.categoryId, dealObj),
						this.categoryService.updateDeal(deal.categoryId, dealObj)
					]);
				}
				if (deal.dealType === DealType.PRODUCT) {
					if (dealData.products && dealData.products.length > 0) {
						for (let i = 0; i < deal.products.length; i++) {
							await this.productService.updateDealById(deal.products[i].productId, dealObj);
						}
					} else {
						await this.productService.updateDealById(deal.productId, dealObj);
					}
				}
				return this.utilService.successResponseMsg(ResponseMessage.DEAL_SAVED);
			}
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/update/:dealId')
	@ApiOperation({ title: 'Update deal by dealId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateDeal(@GetUser() user: UsersDTO, @Param('dealId') dealId: string, @Body() dealData: DealSaveDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const dealExist = await this.dealService.getDealDetail(dealId);
			if (!dealExist) this.utilService.badRequest(ResponseMessage.DEAL_NOT_FOUND);
			if (dealData.dealType === DealType.CATEGORY && !dealData.categoryId) {
				this.utilService.badRequest(ResponseMessage.DEAL_CATEGORY_ID_MISSING);
			} else if (dealData.dealType === DealType.PRODUCT && !(dealData.productId || dealData.products.length > 0)) {
				this.utilService.badRequest(ResponseMessage.DEAL_PRODUCT_ID_MISSING);
			}
			if (dealExist) {
				let dealObj = { isDealAvailable: false };
				if (dealExist.dealType === DealType.CATEGORY) {
					await Promise.all([
						this.productService.updateDealByCategoryId(dealExist.categoryId, dealObj),
						this.categoryService.updateDeal(dealExist.categoryId, dealObj)
					]);
				}
				if (dealExist.dealType === DealType.PRODUCT) {
					if (dealExist.products && dealExist.products.length > 0) {
						for (let i = 0; i < dealExist.products.length; i++) {

							await this.productService.updateDealById(dealExist.products[i].productId, dealObj);
						}
					} else {
						await this.productService.updateDealById(dealExist.productId, dealObj);
					}
				}
			}



			if (dealData.dealType === DealType.CATEGORY) {
				if (dealExist.categoryId != dealData.categoryId) {
					const isCatExist = await this.dealService.getDealByCategoryId(dealData.categoryId);
					if (isCatExist) this.utilService.badRequest(ResponseMessage.DEAL_ALREADY_EXIST);
				}

				const category = await this.categoryService.getCategorieDetail(dealData.categoryId);
				if (!category) this.utilService.badRequest(ResponseMessage.CATEGORY_NOT_FOUND);
				dealData.categoryName = category.title;
				dealData.productId = null;
				dealData.productName = null;
			} else if (dealData.dealType === DealType.PRODUCT) {
				if (dealData.products && dealData.products.length > 0) {
					for (let i = 0; i < dealData.products.length; i++) {
						const dealExist = await this.dealService.getDealByProductId(dealData.products[i].productId);
						if (dealExist) this.utilService.badRequest(ResponseMessage.DEAL_ALREADY_EXIST);
						const product = await this.productService.getProductDetail(dealData.products[i].productId);
						if (!product) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);
						dealData.products[i].productName = product.title;
					}
				} else {
					const dealExist = await this.dealService.getDealByProductId(dealData.productId);
					if (dealExist) this.utilService.badRequest(ResponseMessage.DEAL_ALREADY_EXIST);
					const product = await this.productService.getProductDetail(dealData.productId);
					if (!product) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);
					dealData.productName = product.title;
				}
				dealData.categoryId = null;
				dealData.categoryName = null;
			}

			const deal = await this.dealService.updateDeal(dealExist._id, dealData);
			if (deal) {
				let dealObj = { isDealAvailable: true, dealPercent: deal.dealPercent, dealId: deal._id, dealType: deal.dealType };
				if (deal.dealType === DealType.CATEGORY) {
					await Promise.all([
						this.productService.updateDealByCategoryId(deal.categoryId, dealObj),
						this.categoryService.updateDeal(deal.categoryId, dealObj)
					]);
				}
				if (deal.dealType === DealType.PRODUCT) {
					if (deal.products && deal.products.length > 0) {
						for (let i = 0; i < deal.products.length; i++) {
							await this.productService.updateDealById(deal.products[i].productId, dealObj);
						}
					} else {
						await this.productService.updateDealById(deal.productId, dealObj);
					}
				}
				return this.utilService.successResponseMsg(ResponseMessage.DEAL_UPDATED);
			}
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/status-update/:dealId')
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateDealStatus(@GetUser() user: UsersDTO, @Param('dealId') dealId: string, @Body() dealStatusData: DealStatusDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const dealExist = await this.dealService.getDealDetail(dealId);
			if (!dealExist) this.utilService.badRequest(ResponseMessage.DEAL_NOT_FOUND);

			const deal = await this.dealService.updateDealStatus(dealId, dealStatusData);
			if (deal) {
				let dealObj = {};
				if (dealStatusData.status == true) dealObj = { isDealAvailable: true, dealPercent: deal.dealPercent, dealId: deal._id, dealType: deal.dealType };
				else dealObj = { isDealAvailable: false };

				if (deal.dealType === DealType.CATEGORY) {
					await Promise.all([
						this.productService.updateDealByCategoryId(deal.categoryId, dealObj),
						this.categoryService.updateDeal(deal.categoryId, dealObj)
					]);
				}
				if (deal.dealType === DealType.PRODUCT) {
					if (deal.products && deal.products.length > 0) {
						for (let i = 0; i < deal.products.length; i++) {
							await this.productService.updateDealById(deal.products[i].productId, dealObj);
						}
					} else {
						await this.productService.updateDealById(deal.productId, dealObj);
					}
				}
				return this.utilService.successResponseMsg(ResponseMessage.DEAL_STATUS_UPDATED);
			}
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Delete('/admin/delete/:dealId')
	@ApiResponse({ status: 200, description: 'Return image detail', type: UploadImageResponseDTO })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async deleteDeal(@GetUser() user: UsersDTO, @Param('dealId') dealId: string): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const dealExist = await this.dealService.getDealDetail(dealId);
			if (!dealExist) this.utilService.badRequest(ResponseMessage.DEAL_NOT_FOUND);

			const deal = await this.dealService.deleteDeal(dealId);
			if (deal) {
				let dealObj = { isDealAvailable: false, dealPercent: 0, dealId: null, dealType: null };
				if (deal.dealType === DealType.CATEGORY) {
					await Promise.all([
						this.productService.updateDealByCategoryId(deal.categoryId, dealObj),
						this.categoryService.updateDeal(deal.categoryId, dealObj)
					]);
				}
				if (deal.dealType === DealType.PRODUCT) {
					if (deal.products && deal.products.length > 0) {
						for (let i = 0; i < deal.products.length; i++) {
							await this.productService.updateDealById(deal.products[i].productId, dealObj);
						}
					} else {
						await this.productService.updateDealById(deal.productId, dealObj);
					}
				}
				return this.utilService.successResponseMsg(ResponseMessage.DEAL_DELETED);
			} else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/admin/upload/image')
	@ApiOperation({ title: 'Deal image upload' })
	@ApiResponse({ status: 200, description: 'Return image detail', type: UploadImageResponseDTO })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseInterceptors(FileInterceptor('file'))
	@ApiConsumes('multipart/form-data')
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	@ApiImplicitFile({ name: 'file', required: true, description: 'Deal image upload' })
	public async dealImageUpload(@GetUser() user: UsersDTO, @UploadedFile() file, @Body() image: UploadImageDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const uploadedImage = await this.uploadService.uploadImage(file, image.type) as UploadImageResponseDTO;
			if (uploadedImage.url) return this.utilService.successResponseData(uploadedImage)
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/type/list')
	@ApiOperation({ title: 'Get all banner type for deal' })
	@ApiResponse({ status: 200, description: 'Return list of deal type' })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getDealTypeList(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const dealTypeList = await this.dealService.getDealTypeList();
			return this.utilService.successResponseData(dealTypeList);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
}
