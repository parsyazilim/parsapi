import { ApiBearerAuth, ApiConsumes, ApiImplicitFile, ApiUseTags, ApiOperation, ApiResponse, ApiImplicitQuery } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Body, Controller, UseInterceptors, UploadedFile, Delete, Get, Param, Post, Put, UseGuards, Query, UploadedFiles } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductService } from './products.service';
import { ProductsDTO, PuductStatusDTO, ProductFilterQuery, ProductResponseDTO, ProductResponseUserDTO, ProductDetailsByIdDTO, ProductResponseByCategoryIdDTO, ProductResponseBySubCategoryIdDTO, ProductsResponsePaginationDTO, ProductsAdminResponse, ProductsDropDownResponse, ResponseProductsDetailsDTO, ResponseCategoryAndProductDTOPagenation, ProductsSaveDTO, ResponseCategoryByIdProductDTOPagenation, ProductsResponseBySubCategoryIdPagination } from './products.model';
import { UsersDTO } from '../users/users.model';
import { ExportedFileDTO } from '../users/users.model';
import { UserService } from '../users/users.service';
import { UtilService } from '../utils/util.service';
import { ResponseMessage, UploadImageDTO, UploadImageResponseDTO, AdminSettings, CommonResponseModel, ResponseErrorMessage, ResponseBadRequestMessage, ResponseSuccessMessage, UserQuery, UploadImagesResponseDTO } from '../utils/app.model';
import { UploadService } from '../utils/upload.service';
import { SubCategoryService } from '../sub-categories/sub-categories.service';
import { CategoryService } from '../categories/categories.service';
import { DealService } from '../deals/deals.service';
import { CartService } from '../cart/cart.service';
import { FavouriteService } from '../favourites/favourites.service';
import { RatingService } from '../rating/rating.service';
import { OptionalJwtAuthGuard, GetUser } from '../utils/jwt.strategy';
import { ExcelService } from '../utils/excel.service';
import { BannerService } from '../banner/banner.service';
import { ProductOutOfStockService } from '../product-out-of-stock/product-out-of-stock.service';


@Controller('products')
@ApiUseTags('Products')
export class ProductController {
	constructor(
		private productService: ProductService,
		private cartService: CartService,
		private categoryService: CategoryService,
		private subCategoryService: SubCategoryService,
		private dealService: DealService,
		private bannerService: BannerService,
		private favouriteService: FavouriteService,
		private ratingService: RatingService,
		private utilService: UtilService,
		private uploadService: UploadService,
		private userService: UserService,
		private excelService: ExcelService,
		private productOutOfStockService: ProductOutOfStockService
	) {
	}

	// #######################################  USER  #################################


	@Get('/home')
	@ApiOperation({ title: 'Get deals, categories and products for home page for user' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return deals, categories and products for user', type: ProductResponseDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(OptionalJwtAuthGuard)
	@ApiBearerAuth()
	public async homePage(@GetUser() user: UsersDTO, @Query() userQuery: UserQuery): Promise<CommonResponseModel> {
		try {
			let pagination = this.utilService.getUserPagination(userQuery);
			const list = await Promise.all([
				this.productService.GetProductsForUser(pagination.page, pagination.limit - 6),
				this.categoryService.getCategoryListForHome(8),
				this.dealService.dealOfTheDayForHome(4),
				this.dealService.topDealsForHome(4)
			])
			let products = list[0];
			if (user && user._id) {
				let cart = await this.cartService.getCartByUserId(user._id);
				products = await this.productService.addCartInProduct(cart, products);
			}
			return this.utilService.successResponseData({ products: products, categories: list[1], dealsOfDay: list[2], topDeals: list[3] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/list')
	@ApiOperation({ title: 'Get all enabled product fo user' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of enabled product fo user', type: ProductsResponsePaginationDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(OptionalJwtAuthGuard)
	@ApiBearerAuth()
	public async productList(@GetUser() user: UsersDTO, @Query() userQuery: UserQuery): Promise<CommonResponseModel> {
		try {
			let pagination = this.utilService.getUserPagination(userQuery);
			const list = await Promise.all([
				await this.productService.GetProductsForUser(pagination.page, pagination.limit),
				this.productService.countAllProductForUser()
			])
			let products = list[0];
			if (user && user._id) {
				let cart = await this.cartService.getCartByUserId(user._id);
				products = await this.productService.addCartInProduct(cart, products);
			}
			return this.utilService.successResponseData(products, { total: list[1] });
		} catch (e) {

			this.utilService.errorResponse(e);
		}
	}

	@Get('/list/subscription')
	@ApiOperation({ title: 'Get all enabled subscription product fo user' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of enabled subscription product fo user', type: ProductsResponsePaginationDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(OptionalJwtAuthGuard)
	@ApiBearerAuth()
	public async subscriptionProductList(@GetUser() user: UsersDTO, @Query() userQuery: UserQuery): Promise<CommonResponseModel> {
		try {
			let pagination = this.utilService.getUserPagination(userQuery);
			const list = await Promise.all([
				await this.productService.GetSubscriptionProductsForUser(pagination.page, pagination.limit),
				this.productService.countAllSubscriptionProductForUser()
			])
			let products = list[0];
			if (user && user._id) {
				let cart = await this.cartService.getCartByUserId(user._id);
				products = await this.productService.addCartInProduct(cart, products);
			}
			return this.utilService.successResponseData(products, { total: list[1] });
		} catch (e) {

			this.utilService.errorResponse(e);
		}
	}

	@Get('/related')
	@ApiOperation({ title: 'Get all releted product fo user' })
	@ApiResponse({ status: 200, description: 'Return list of releted product fo user' })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(OptionalJwtAuthGuard)
	@ApiBearerAuth()
	public async getRelatedProducts(): Promise<CommonResponseModel> {
		try {
			const products = await this.productService.GetProductsForUser(0, 5);
			return this.utilService.successResponseData(products);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/detail/:productId')
	@ApiOperation({ title: 'Get product detail by productId for user' })
	@ApiResponse({ status: 200, description: 'Return product detail by productId for user', type: ProductDetailsByIdDTO })
	@ApiResponse({ status: 200, description: 'Return product detail by productId for user' })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(OptionalJwtAuthGuard)
	@ApiBearerAuth()
	public async getProductDetail(@GetUser() user: UsersDTO, @Param('productId') productId: string): Promise<CommonResponseModel> {
		try {
			let product = await this.productService.getProductDetailForUser(productId);
			if (product) {
				if (user && user._id) {
					let products = [product];

					const list = await Promise.all([
						this.cartService.getCartByUserId(user._id),
						this.favouriteService.getAllFavourite(user._id)
					])
					let cart = list[0];
					let favourite = list[1];
					products = await this.productService.addCartInProduct(cart, products);
					product = JSON.parse(JSON.stringify(products[0]));
					product['isFavourite'] = false;
					if (favourite) {
						const index = favourite.productId.findIndex(p => p === productId);
						if (index > -1) product.isFavourite = true;
					}
				}
				return this.utilService.successResponseData(product);
			} else this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/search')
	@ApiOperation({ title: 'Search product by product keyword' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of product', type: ProductResponseUserDTO })
	@ApiResponse({ status: 200, description: 'Return list of product' })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(OptionalJwtAuthGuard)
	@ApiBearerAuth()
	public async searchProduct(@GetUser() user: UsersDTO, @Query('q') q: string, @Query() userQuery: UserQuery) {
		try {
			q = q || '*';
			let pagination = this.utilService.getUserPagination(userQuery);
			let products = await this.productService.searchProduct(q, pagination.page, pagination.limit);
			if (user && user._id) {
				let cart = await this.cartService.getCartByUserId(user._id);
				products = await this.productService.addCartInProduct(cart, products);
			}
			return this.utilService.successResponseData(products);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/category/:categoryId')
	@ApiOperation({ title: 'Get all product by category for user' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of product by category for user', type: ResponseCategoryByIdProductDTOPagenation })
	@ApiResponse({ status: 200, description: 'Return list of product by category for user' })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(OptionalJwtAuthGuard)
	@ApiBearerAuth()
	public async getProductsByCategory(@GetUser() user: UsersDTO, @Param('categoryId') categoryId: string, @Query() userQuery: UserQuery): Promise<CommonResponseModel> {
		try {
			let pagination = this.utilService.getUserPagination(userQuery);
			const list = await Promise.all([
				this.productService.getProductByCategoryId(categoryId, pagination.page, pagination.limit),
				this.subCategoryService.getDropdownListSubCategoryEnabled(categoryId),
				this.productService.countProductByCategoryId(categoryId)
			])
			let products = list[0];
			if (user && user._id) {
				let cart = await this.cartService.getCartByUserId(user._id);
				products = await this.productService.addCartInProduct(cart, products);
			}
			return this.utilService.successResponseData({ products: products, subCategories: list[1] }, { total: list[2] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/sub-category/:subCategoryId')
	@ApiOperation({ title: 'Get all product by sub-category for user' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of product by sub-category for user', type: ProductsResponseBySubCategoryIdPagination })
	@ApiResponse({ status: 200, description: 'Return list of product by sub-category for user' })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(OptionalJwtAuthGuard)
	@ApiBearerAuth()
	public async getProductsBySubCategory(@GetUser() user: UsersDTO, @Param('subCategoryId') subCategoryId: string, @Query() userQuery: UserQuery): Promise<CommonResponseModel> {
		try {
			let pagination = this.utilService.getUserPagination(userQuery);

			const list = await Promise.all([
				this.productService.getProductsBySubCategory(subCategoryId, pagination.page, pagination.limit),
				this.productService.countProductBySubCategoryId(subCategoryId)
			])

			let products = list[0];
			if (user && user._id) {
				let cart = await this.cartService.getCartByUserId(user._id);
				products = await this.productService.addCartInProduct(cart, products);
			}
			return this.utilService.successResponseData(products, { total: list[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	// ################################################################################ ADMIN ##############################################################################
	@Get('/admin/list')
	@ApiOperation({ title: 'Get all product' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of product', type: ProductsAdminResponse })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAllProduct(@GetUser() user: UsersDTO, @Query() query: ProductFilterQuery): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const page = Number(query.page) || AdminSettings.DEFAULT_PAGE_NUMBER;
			const limit = Number(query.limit) || AdminSettings.DEFAULT_PAGE_LIMIT;

			let productFilter = {};
			if (query.categoryId) productFilter["categoryId"] = query.categoryId;
			if (query.subCategoryId) productFilter["subCategoryId"] = query.subCategoryId;

			const products = await Promise.all([
				this.productService.getAllProduct(productFilter, page - 1, limit),
				this.productService.countAllProduct()
			])
			return this.utilService.successResponseData(products[0], { total: products[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('admin/search')
	@ApiOperation({ title: 'Search product by product keyword' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of product', type: ProductResponseUserDTO })
	@ApiResponse({ status: 200, description: 'Return list of product' })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(OptionalJwtAuthGuard)
	@ApiBearerAuth()
	public async searchProductsAdmin(@GetUser() user: UsersDTO, @Query('q') q: string, @Query() query: ProductFilterQuery) {
		try {
			q = q || '*';
			const page = Number(query.page) || AdminSettings.DEFAULT_PAGE_NUMBER;
			const limit = Number(query.limit) || AdminSettings.DEFAULT_PAGE_LIMIT;
			let list = await Promise.all([
				this.productService.searchProduct(q, page - 1, limit),
				this.productService.countAllSearchProduct(q)
			]);
			return this.utilService.successResponseData(list[0], { total: list[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/dropdown-list')
	@ApiOperation({ title: 'Get all enabled product for dropdown' })
	@ApiResponse({ status: 200, description: 'Return list of enabled product for dropdown', type: ProductsDropDownResponse })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getDropdownListProduct(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const products = await this.productService.getDropdownListProduct();
			return this.utilService.successResponseData(products);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/detail/:productId')
	@ApiOperation({ title: 'Get product detail by productId' })
	@ApiResponse({ status: 200, description: 'Return product detail by productId', type: ResponseProductsDetailsDTO })
	@ApiResponse({ status: 200, description: 'Return product detail by productId' })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAdminProductDetail(@GetUser() user: UsersDTO, @Param('productId') productId: string): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const product = await this.productService.getProductDetail(productId);
			if (product) return this.utilService.successResponseData(product);
			else this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/category/:categoryId')
	@ApiOperation({ title: 'Get all product by category' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of product by category', type: ResponseCategoryAndProductDTOPagenation })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAdminAllProductByCategory(@GetUser() user: UsersDTO, @Param('categoryId') categoryId: string, @Query() query: ProductFilterQuery): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const page = Number(query.page) || AdminSettings.DEFAULT_PAGE_NUMBER;
			const limit = Number(query.limit) || AdminSettings.DEFAULT_PAGE_LIMIT;
			const products = await Promise.all([
				this.productService.getAllProductByCategory(categoryId, page - 1, limit),
				this.productService.countAllProductByCategory(categoryId)
			])
			return this.utilService.successResponseData(products[0], { total: products[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/sub-category/:subCategoryId')
	@ApiOperation({ title: 'Get all product by sub-category' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of product by sub-category', type: ResponseCategoryAndProductDTOPagenation })
	@ApiResponse({ status: 200, description: 'Return list of product by sub-category' })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAdminAllProductBySubCategory(@GetUser() user: UsersDTO, @Param('subCategoryId') subCategoryId: string, @Query() query: ProductFilterQuery): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const page = Number(query.page) || AdminSettings.DEFAULT_PAGE_NUMBER;
			const limit = Number(query.limit) || AdminSettings.DEFAULT_PAGE_LIMIT;
			const products = await Promise.all([
				this.productService.getAllProductBySubCategory(subCategoryId, page - 1, limit),
				this.productService.countAllProductBySubCategory(subCategoryId)
			])
			return this.utilService.successResponseData(products[0], { total: products[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/admin/create')
	@ApiOperation({ title: 'Create product' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async createProduct(@GetUser() user: UsersDTO, @Body() productData: ProductsSaveDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const productExist = await this.productService.findProductByTitle(productData.title);
			if (productExist) this.utilService.badRequest(ResponseMessage.PRODUCT_ALREADY_EXIST);

			const category = await this.categoryService.getCategorieDetail(productData.categoryId);
			if (!category) this.utilService.badRequest(ResponseMessage.CATEGORY_NOT_FOUND);
			productData.categoryName = category.title;
			productData.variant.forEach(function (d) {
				if (d.offerPercent > 0) {
					d.offerPrice = d.price - (d.offerPercent * d.price) / 100;
					d.isOfferAvailable = true;
				}
			})

			if (productData.subCategoryId) {
				const subCategory = await this.subCategoryService.findSubCategoryByIdAndCatId(productData.subCategoryId, productData.categoryId);
				if (!subCategory) this.utilService.badRequest(ResponseMessage.SUB_CATEGORY_NOT_FOUND);
				productData.subCategoryName = subCategory.title;
			} else productData.subCategoryName = null;

			if (!productData.keyWords) {
				productData.keyWords = productData.title;
			}
			const product = await this.productService.createProduct(productData);
			if (product) return this.utilService.successResponseMsg(ResponseMessage.PRODUCT_SAVED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/update/:productId')
	@ApiOperation({ title: 'Update product by productId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateProduct(@GetUser() user: UsersDTO, @Param('productId') productId: string, @Body() productData: ProductsSaveDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const productExist = await this.productService.getProductDetail(productId);
			if (!productExist) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);

			const category = await this.categoryService.getCategorieDetail(productData.categoryId);
			if (!category) this.utilService.badRequest(ResponseMessage.CATEGORY_NOT_FOUND);
			productData.categoryName = category.title;
			productData.variant.forEach(function (d) {
				if (d.offerPercent > 0) {
					d.offerPrice = d.price - (d.offerPercent * d.price) / 100;
					d.isOfferAvailable = true;
				}
			});

			if (productData.subCategoryId) {
				const subCategory = await this.subCategoryService.findSubCategoryByIdAndCatId(productData.subCategoryId, productData.categoryId);
				if (!subCategory) this.utilService.badRequest(ResponseMessage.SUB_CATEGORY_NOT_FOUND);
				productData.subCategoryName = subCategory.title;
			} else productData.subCategoryName = null;

			const product = await this.productService.updateProduct(productId, productData);
			this.productOutOfStockService.deleteOutOfStock(productId);
			if (product) return this.utilService.successResponseMsg(ResponseMessage.PRODUCT_UPDATED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/status-update/:productId')
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateProductStatus(@GetUser() user: UsersDTO, @Param('productId') productId: string, @Body() productStatusData: PuductStatusDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const productExist = await this.productService.getProductDetail(productId);
			if (!productExist) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);

			const product = await this.productService.updateProductStatus(productId, productStatusData);
			if (product) return this.utilService.successResponseMsg(ResponseMessage.PRODUCT_STATUS_UPDATED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Delete('/admin/delete/:productId')
	@ApiOperation({ title: 'Delete product by productId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async deleteProduct(@GetUser() user: UsersDTO, @Param('productId') productId: string): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const productExist = await this.productService.getProductDetail(productId);
			if (!productExist) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);

			const banners = await this.bannerService.countBannerByProductId(productId);
			if (banners) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_DELETED_HAVE_BANNER);

			const deals = await this.dealService.countDealByProductId(productId);
			if (deals) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_DELETED_HAVE_DEAL);

			const product = await this.productService.deleteProduct(productId);
			if (product) return this.utilService.successResponseMsg(ResponseMessage.PRODUCT_DELETED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/admin/upload/image')
	@ApiOperation({ title: 'Product image upload' })
	@ApiResponse({ status: 200, description: 'Return image detail', type: UploadImageResponseDTO })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseInterceptors(FileInterceptor('file'))
	@ApiConsumes('multipart/form-data')
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	@ApiImplicitFile({ name: 'file', required: true, description: 'Product image upload' })
	public async productImageUpload(@GetUser() user: UsersDTO, @UploadedFile() file, @Body() image: UploadImageDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const uploadedImage = await this.uploadService.uploadImage(file, image.type) as UploadImageResponseDTO;
			if (uploadedImage.url) return this.utilService.successResponseData(uploadedImage)
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/admin/upload/images')
	@ApiOperation({ title: 'Product images upload' })
	@ApiResponse({ status: 200, description: 'Return  array of image details', type: UploadImagesResponseDTO })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseInterceptors(FilesInterceptor('file', 8))
	@ApiConsumes('multipart/form-data')
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	@ApiImplicitFile({ name: 'file', required: true, description: 'Product image upload' })
	public async productImagesUpload(@GetUser() user: UsersDTO, @UploadedFiles() file, @Body() image: UploadImageDTO) {
		this.utilService.validateAdminRole(user);
		try {
			const uploadedImage = await this.uploadService.uploadImages(file, image.type) as Array<UploadImageResponseDTO>;
			if (uploadedImage.length > 0) return this.utilService.successResponseData(uploadedImage)
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/exports')
	@ApiOperation({ title: 'Export all products as xlsx file' })
	@ApiResponse({ status: 200, description: 'Export all products as xlsx file', type: ExportedFileDTO })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async excelExports(@GetUser() user: UsersDTO) {
		this.utilService.validateAdminRole(user);
		try {
			const count = await this.productService.countAllProduct();
			if (!count) this.utilService.badRequest(ResponseMessage.PRODUCT_NOT_FOUND);

			const categories = await this.subCategoryService.getAllSubCategoriesForImport();
			const categoriesWithNoSubCat = await this.categoryService.getAllCategoriesWithNoSubCategories();
			const products = await this.productService.getAllProductForExport(0, count);

			this.excelService.exportProducts(products, categories, categoriesWithNoSubCat, user._id, this.userService);
			let obj = { productExportedFile: { url: null, status: "Processing", publicId: null } };
			const response = await this.userService.updateMyInfo(user._id, obj);

			if (response) return this.utilService.successResponseData(obj)
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG)
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/exports/download')
	@ApiOperation({ title: 'Start converting all product data to xlsx file' })
	@ApiResponse({ status: 200, description: 'Return imagekit file detail', type: ExportedFileDTO })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getExportFile(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const userInfo = await this.userService.getExportedFileInfo(user._id);
			if (userInfo) return this.utilService.successResponseData(userInfo);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG)
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/imports/template')
	@ApiOperation({ title: 'Export all products as xlsx file' })
	@ApiResponse({ status: 200, description: 'Return imagekit file detail', type: ExportedFileDTO })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async excelImportTemplate(@GetUser() user: UsersDTO) {
		this.utilService.validateAdminRole(user);
		try {
			const categories = await this.subCategoryService.getAllEnabledSubCategories();
			const categoriesWithNoSubCat = await this.categoryService.getAllCategoriesWithNoSubCategories()
			const response = await this.excelService.createImportTemplate(categories, categoriesWithNoSubCat);
			if (response) return this.utilService.successResponseData(response)
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG)
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/admin/imports')
	@ApiOperation({ title: 'Product iimports' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseInterceptors(FileInterceptor('file'))
	@ApiConsumes('multipart/form-data')
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	@ApiImplicitFile({ name: 'file', required: true, description: 'Only xlsx file accepted' })
	public async importProducts(@UploadedFile() file) {
		try {
			if (file.mimetype !== 'text/csv' && file.mimetype !== 'application/vnd.ms-excel' && file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
				this.utilService.badRequest(ResponseMessage.FILE_TYPE_ERROR)
			}
			const categories = await this.subCategoryService.getAllSubCategoriesForImport();
			const categoriesWithNoSubCat = await this.categoryService.getAllCategoriesWithNoSubCategories()
			let { existProducts, newProducts } = await this.excelService.importProducts(file, categories, categoriesWithNoSubCat);

			for (let key in existProducts) {
				console.log("-----------key-------", key)
				console.log("--------------products----------", existProducts[key])
				let product = existProducts[key];
				for (let i = 0; i < product.productImages.length; i++) {
					let item = product.productImages[i];
					let pathArray = item.imageUrl.split('/');
					let protocol = pathArray[0];
					let host = pathArray[2];
					let url = protocol + '//' + host + '/' + pathArray[3] + '/';
					if (process.env.IMAGEKIT_URL !== url) {
						let fileName = Date.now() + '_original_' + i + '_' + product.title
						if (host === 'www.dropbox.com') {
							let firstPart = item.imageUrl.split("=")[0];
							item.imageUrl = firstPart + '=1';
						}
						let result = await this.uploadService.uploadBase64(item.imageUrl, fileName)
						existProducts[key].productImages[i].imageId = result.key;
						existProducts[key].productImages[i].filePath = result.filePath;
						existProducts[key].productImages[i].imageUrl = `${process.env.IMAGEKIT_URL}tr:dpr-auto,tr:w-auto${result.filePath}`;
					} else {
						existProducts[key].productImages[i].filePath = pathArray[5];
					}
					console.log("--------------products----------", existProducts[key])
					if (key !== 'Product Id') await this.productService.updateProductByImport(key, existProducts[key]);
				}
			}
			if (newProducts && newProducts.length > 0) {
				for (let key in newProducts) {
					console.log("-----------key-------", key)
					console.log("-------------- new products----------", newProducts[key])
					let product = newProducts[key];
					for (let i = 0; i < product.productImages.length; i++) {
						let item = product.productImages[i];
						let pathArray = item.imageUrl.split('/');
						let protocol = pathArray[0];
						let host = pathArray[2];
						let url = protocol + '//' + host + '/' + pathArray[3] + '/';
						if (process.env.IMAGEKIT_URL !== url) {
							let fileName = Date.now() + '_original_' + i + '_' + product.title
							if (host === 'www.dropbox.com') {
								let firstPart = item.imageUrl.split("=")[0];
								item.imageUrl = firstPart + '=1';
							}
							let result = await this.uploadService.uploadBase64(item.imageUrl, fileName)
							newProducts[key].productImages[i].imageId = result.key;
							newProducts[key].productImages[i].filePath = result.filePath;
							newProducts[key].productImages[i].imageUrl = `${process.env.IMAGEKIT_URL}tr:dpr-auto,tr:w-auto${result.filePath}`;
						} else {
							newProducts[key].productImages[i].filePath = pathArray[5];
						}
						console.log("--------------new products----------", newProducts[key])
					}
				}
				await this.productService.addProductByImport(newProducts);
			}
			return this.utilService.successResponseMsg(ResponseMessage.PRODUCT_IMPORTED_SUCCESSFULLY);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Delete('/admin/exports/:key')
	@ApiOperation({ title: 'Delete exports file' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async productExportsDelete(@GetUser() user: UsersDTO, @Param('key') key: string): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			await this.uploadService.deleteImage(key);
			let obj = { productExportedFile: { url: null, status: "Processing", publicId: null } }
			const response = await this.userService.updateMyInfo(user._id, obj);
			return this.utilService.successResponseMsg({ status: true });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/pos-category/:categoryId')
	@ApiOperation({ title: 'Get all product by category for pos' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of product by category', type: ResponseCategoryAndProductDTOPagenation })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAdminAllProductByCategoryPos(@GetUser() user: UsersDTO, @Param('categoryId') categoryId: string, @Query() query: ProductFilterQuery): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const page = Number(query.page) || AdminSettings.DEFAULT_PAGE_NUMBER;
			const limit = Number(query.limit) || AdminSettings.DEFAULT_PAGE_LIMIT;
			const products = await Promise.all([
				this.productService.getAllProductByCategoryForPos(categoryId, page - 1, limit),
				this.productService.countAllProductByCategory(categoryId)
			])
			return this.utilService.successResponseData(products[0], { total: products[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/search')
	@ApiOperation({ title: 'Seatch product by product title' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of product', type: ProductResponseUserDTO })
	@ApiResponse({ status: 200, description: 'Return list of product' })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(OptionalJwtAuthGuard)
	@ApiBearerAuth()
	public async searchAdminProduct(@GetUser() user: UsersDTO, @Query('q') q: string, @Query() userQuery: UserQuery) {
		try {
			this.utilService.validateAdminRole(user);
			q = q || '*';
			let pagination = this.utilService.getUserPagination(userQuery);
			let products = await this.productService.searchProduct(q, pagination.page, pagination.limit);
			return this.utilService.successResponseData(products);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

}
