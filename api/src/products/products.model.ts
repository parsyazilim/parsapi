import * as mongoose from 'mongoose';
import { ArrayMinSize, IsBoolean, IsEmpty, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsPositive, Max, Min, ValidateNested, IsString } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer/decorators';
import { UploadImageResponseDTO } from 'src/utils/app.model';

export const ProductSchema = new mongoose.Schema({
	title: { type: String },
	description: { type: String },
	userId: { type: String },
	categoryId: { type: String },
	categoryName: { type: String },
	sku: { type: String },
	isDealAvailable: { type: Boolean, default: false },
	dealPercent: { type: Number },
	dealId: { type: String },
	dealType: { type: String },
	subCategoryId: { type: String },
	subCategoryName: { type: String },
	type: { type: String },
	variant: [
		{
			productStock: { type: Number },
			unit: { type: String },
			price: { type: Number },
			enable: { type: Boolean, default: true },
			offerPrice: { type: Number },
			isOfferAvailable: { type: Boolean, default: false },
			offerPercent: { type: Number, default: 0 },
			isSubScriptionAllowed: { type: Boolean, default: false },
			subScriptionAmount: { type: Number }
		}
	],
	imageUrl: { type: String },
	imageId: { type: String },
	filePath: { type: String },
	productImages: [{
		imageUrl: { type: String },
		imageId: { type: String },
		filePath: { type: String },
	}
	],
	status: { type: Boolean, default: true },
	averageRating: { type: Number, default: 0 },
	totalRating: { type: Number, default: 0 },
	noOfUsersRated: { type: Number, default: 0 },
	keyWords: { type: String }
}, {
	timestamps: true
});

export class ProductFilterQuery {
	page?: number;
	limit?: number;
	categoryId?: string;
	subCategoryId?: string
}

export class ProductImagesDTO {
	@IsString()
	@ApiModelProperty()
	imageUrl: string;

	@IsString()
	@ApiModelProperty()
	imageId: string;

	@IsString()
	@ApiModelProperty()
	filePath: string;
}

export class VariantDTO {
	@IsNotEmpty()
	@ApiModelProperty()
	productStock: number;

	@IsNotEmpty()
	@ApiModelProperty()
	unit: string;

	@IsNotEmpty()
	@ApiModelProperty()
	price: number;

	@IsNotEmpty()
	@ApiModelProperty()
	enable: boolean;


	@ApiModelProperty()
	offerPrice?: number;

	@ApiModelProperty()
	offerPercent?: number;


	@ApiModelProperty()
	isOfferAvailable?: boolean;

	isSubScriptionAllowed?: boolean;

	subScriptionAmount?: number

}
export class ProductsSaveDTO {

	@IsString()
	@ApiModelProperty()
	title: string;

	@ApiModelProperty()
	@IsOptional()
	sku: string;

	@IsString()
	@IsNotEmpty()
	@ApiModelProperty()
	description: string;

	@IsMongoId()
	@IsNotEmpty()
	@ApiModelProperty()
	categoryId: string;

	@ApiModelProperty({ type: [VariantDTO] })
	@ValidateNested({ each: true })
	@ArrayMinSize(1)
	variant: Array<VariantDTO>;

	@IsOptional()
	@ApiModelProperty()
	imageUrl: string;


	@IsOptional()
	@ApiModelProperty()
	filePath: string;

	@ApiModelProperty()
	@IsOptional()
	imageId: string;

	@IsOptional()
	@ApiModelProperty()
	subCategoryId: string;

	@IsOptional()
	@ApiModelProperty({ type: [ProductImagesDTO] })
	productImages: Array<ProductImagesDTO>

	@ApiModelProperty()
	keyWords: string;
	categoryName: string;
	subCategoryName: string;
}

export class ProductsDTO {

	@IsOptional()
	_id: string;


	@IsOptional()
	sku: string;

	@IsString()
	@ApiModelProperty()
	title: string;

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	description: string;

	// @IsNotEmpty()
	@IsNumber()
	@IsOptional()
	@ApiModelProperty()
	price: number;

	@IsMongoId()
	userId: string;

	@IsString()
	@IsOptional()
	type: String;

	@IsMongoId()
	@IsNotEmpty()
	@ApiModelProperty()
	categoryId: string;

	@ApiModelProperty()
	@ValidateNested({ each: true })
	@ArrayMinSize(1)
	@Type(() => VariantDTO)
	variant: VariantDTO[];

	@IsOptional()
	@IsBoolean()
	isDealAvailable: boolean;

	@IsNumber()
	@IsOptional()
	dealPercent: number;

	@IsString()
	@IsOptional()
	dealId: string;

	@IsString()
	@ApiModelProperty()
	imageUrl: string;

	@IsString()
	@IsOptional()
	@ApiModelProperty()
	filePath: string;


	@IsString()
	@IsOptional()
	@ApiModelProperty()
	unit: String;

	@IsString()
	@ApiModelProperty()
	@IsOptional()
	imageId: string;

	@ApiModelProperty({ type: [ProductImagesDTO] })
	productImages: Array<ProductImagesDTO>

	@IsString()
	@ApiModelProperty()
	subCategoryId: string

	@IsBoolean()
	@IsOptional()
	@ApiModelProperty()
	status: boolean;

	@IsNumber()
	@IsOptional()
	averageRating: number;

	@IsNumber()
	@IsOptional()
	totalRating: number;

	@IsNumber()
	@IsOptional()
	noOfUsersRated: number;

	quantityToCart: number;
	isAddedToCart: boolean;

	categoryName: string;
	subCategoryName: string;
}



export class VariantData {
	// title:String;
	productStock: Number;
	unit: String;
	price: Number;
	enable: Boolean;
	offerAmount: number;
}


export class PuductStatusDTO {
	@IsBoolean()
	@IsNotEmpty()
	@ApiModelProperty()
	status: boolean;
}

export class DealProductDTO {
	@IsNumber()
	@IsOptional()
	dealPercent: number;

	@IsBoolean()
	@IsOptional()
	isDealAvailable: boolean;

	@IsOptional()
	@IsMongoId()
	dealId: string
}

export class ProductFilterDTO {
	@IsString()
	@IsOptional()
	category: string;

	@IsString()
	@IsOptional()
	subCategory: string;
}

export class ProductCategoryDTO {
	@IsString()
	@IsOptional()
	_id?: string;

	@IsString()
	@IsOptional()
	category?: string
}

export class ProductListAdminDTO {
	@ApiModelProperty()
	_id: string;

	@ApiModelProperty()
	title: String;

	@ApiModelProperty()
	imageUrl: String;

	@ApiModelProperty()
	filePath: string;

	@ApiModelProperty()
	status: Boolean;

	@ApiModelProperty()
	isDealAvailable: Boolean;

	@ApiModelProperty()
	dealPercent: Number;

	@ApiModelProperty()
	dealId: string;

	@ApiModelProperty()
	subcategory: string;

	@ApiModelProperty()
	category: string;
}

export class ProductTitleListAdminDTO {
	@ApiModelProperty()
	_id: string;

	@ApiModelProperty()
	title: String;

	@ApiModelProperty()
	status: string;
}
//This DTO only for Favourites ResponseData
export class FavourutesResponseDTO {
	@ApiModelProperty()
	_id: string;

	@ApiModelProperty()
	sku: string;

	@ApiModelProperty()
	title: string;

	@ApiModelProperty()
	description: string;

	@ApiModelProperty()
	price: number;

	@ApiModelProperty()
	@ValidateNested({ each: true })
	@ArrayMinSize(1)
	@Type(() => VariantDTO)
	variant: VariantDTO[];

	@ApiModelProperty()
	isDealAvailable: boolean;

	@ApiModelProperty()
	imageUrl: string;

	@ApiModelProperty()
	filePath: string;

	@ApiModelProperty()
	imageId: string;

	@ApiModelProperty()
	averageRating: number;
}


//product ResponseDTO for Admin
export class ProductListResponseDTO extends PuductStatusDTO {
	@ApiModelProperty()
	_id: string;

	@ApiModelProperty()
	title: String;

	@ApiModelProperty()
	imageUrl: String;

	@ApiModelProperty()
	filePath: string;

	@ApiModelProperty()
	isDealAvailable: Boolean;

	@ApiModelProperty()
	dealPercent: Number;

	@ApiModelProperty({ type: [VariantDTO] })
	@ValidateNested({ each: true })
	@Type(() => VariantDTO)
	variant: VariantDTO[];

	@ApiModelProperty()
	categoryName: string

	@ApiModelProperty()
	averageRating: number;

	@ApiModelProperty()
	unitInCart: number

	@ApiModelProperty()
	quantityToCart: boolean

	@ApiModelProperty()
	categories: []

	@ApiModelProperty()
	dealsOfDay: []
	@ApiModelProperty()
	topDeals: []

}

export class ProductResponseDTO {
	@ApiModelProperty()
	@IsString()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: ProductListResponseDTO;

}
export class ResponseListDTO {
	@ApiModelProperty()
	_id: string;

	@ApiModelProperty()
	title: String;

	@ApiModelProperty()
	imageUrl: String;

	@ApiModelProperty()
	filePath: string;

	@ApiModelProperty()
	isDealAvailable: Boolean;

	@ApiModelProperty()
	dealPercent: Number;

	@ApiModelProperty()
	@ValidateNested({ each: true })
	@Type(() => VariantDTO)
	variant: VariantDTO[];

	@ApiModelProperty()
	categoryName: string

	@ApiModelProperty()
	averageRating: number;

	@ApiModelProperty()
	unitInCart: number

	@ApiModelProperty()
	quantityToCart: boolean
}

//This is For User Products List 
export class ProductResponseUserDTO {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: ResponseListDTO;

}

export class ProductsResponsePaginationDTO extends ProductResponseUserDTO {
	@ApiModelProperty()
	total: number
}



//This For Get By ProductId Respose
export class ProductsResponseByIdDTO extends ProductsSaveDTO {
	@ApiModelProperty()
	averageRating: number;

	@ApiModelProperty()
	totalRating: number;

	@ApiModelProperty()
	noOfUsersRated: number;

	@ApiModelProperty()
	quantityToCart: number;

	@ApiModelProperty()
	isAddedToCart: boolean;

	categoryName: string;
	@ApiModelProperty()

	@ApiModelProperty()
	subCategoryName: string;

	@ApiModelProperty()
	isFavourite: boolean

}

export class ProductDetailsByIdDTO {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: ProductsResponseByIdDTO;

}


// This is for Get Produts Details By CategoryId
export class ProductsDetailsResponseDTO {
	@ApiModelProperty()
	isDealAvailable: boolean

	@ApiModelProperty()
	averageRating: number

	@ApiModelProperty()
	_id: string

	@ApiModelProperty()
	title: string

	@ApiModelProperty()
	@ValidateNested({ each: true })
	@Type(() => VariantDTO)
	variant: VariantDTO[];
	@ApiModelProperty()
	imageUrl: string

	@ApiModelProperty()
	filePath: string

	@ApiModelProperty({ isArray: true })
	subCategories: ProductTitleListAdminDTO
}

export class ProductResponseByCategoryIdDTO {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: ProductsDetailsResponseDTO;
}

// This Is for Get Response Details Based On SubCategory
export class ProductResponseBySubCategoryIdDTO {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: ResponseListDTO;
}
//This for Admin ResponseDTO

export class ProductAdminResponseDTO extends PuductStatusDTO {

	@ApiModelProperty()
	isDealAvailable: boolean

	@ApiModelProperty()
	_id: string

	@ApiModelProperty()
	title: string

	@ApiModelProperty()
	imageUrl: string

	@ApiModelProperty()
	subCategoryName: string

	@ApiModelProperty()
	dealPercent: number

	@ApiModelProperty({ type: [ProductImagesDTO] })
	productImages: Array<ProductImagesDTO>
}

export class AdminProdutsResponseDTO {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: ProductAdminResponseDTO;

}


export class ProductsAdminResponse extends AdminProdutsResponseDTO {
	@ApiModelProperty()
	tolal: number
}
//This is for only Drop-Dowl Response
export class ProductsDropDownResponse {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: ProductTitleListAdminDTO;
}

//This is for  products Detials
export class ProductsDetalsForAdmin extends ProductListAdminDTO {

	@ApiModelProperty()
	averageRating: string

	@ApiModelProperty()
	totalRating: number

	@ApiModelProperty()
	noOfUsersRated: number

	@ApiModelProperty()
	categoryId: string

	@ApiModelProperty()
	imageId: string

	@ApiModelProperty()
	subCategoryId: string

	@ApiModelProperty()
	categoryName: string

	@ApiModelProperty()
	subCategoryName: string

	@ApiModelProperty()
	dealId: string

	@ApiModelProperty()
	dealPercent: number

	@ApiModelProperty()
	dealType: string

	@ApiModelProperty()
	userId: string

}
export class ResponseProductsDetailsDTO {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty()
	response_data: ProductsDetalsForAdmin;

}
//This Products and Category Combinned Response
export class ResponseDataForCategoryAndProducts extends PuductStatusDTO {

	@ApiModelProperty()
	isDealAvailable: boolean

	@ApiModelProperty()
	_id: string

	@ApiModelProperty()
	title: string

	@ApiModelProperty()
	imageUrl: string

	@ApiModelProperty()
	categoryName: string

	@ApiModelProperty()
	subCategoryName: string

	@ApiModelProperty()
	dealPercent: number

	@IsOptional()
	@ApiModelProperty({ type: [ProductImagesDTO] })
	productImages: Array<ProductImagesDTO>
}

export class ResponseCategoryAndProductDTO {

	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: ResponseDataForCategoryAndProducts;

}
export class ResponseCategoryAndProductDTOPagenation extends ResponseCategoryAndProductDTO {
	@ApiModelProperty()
	total: number
}

export class ImportProductDTO {
	id?: string;
	title: string;
	description: string;
	categoryId: string;
	categoryName?: string;
	subCategoryId?: string;
	subCategoryName?: string;
	variant: VariantDTO[];
	productImages: ProductImagesDTO[];
}


export class ResponseCategoryByIdProductDTOPagenation extends ProductResponseByCategoryIdDTO {
	@ApiModelProperty()
	total: number
}

export class ProductsResponseBySubCategoryIdPagination extends ProductResponseBySubCategoryIdDTO {
	@ApiModelProperty()
	total: number
}