import * as mongoose from 'mongoose';
import { IsEmpty, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { ApiModelProperty } from '@nestjs/swagger';
import { FavourutesResponseDTO } from '../products/products.model'

export const FavouriteSchema = new mongoose.Schema({
	productId: { type: Array },
	userId: { type: String }
}, {
	timestamps: true
});

export class FavouritesDTO {
	@IsMongoId()
	_id: string

	@IsNotEmpty()
	@IsMongoId()
	@ApiModelProperty()
	productId: string;

	@IsMongoId()
	userId: string;
}

export class FavouritesProductsDTO extends FavourutesResponseDTO {
	@ApiModelProperty()
	productId: string;
}

export class ResponseFavouritesDTO {
	@IsString()
	@ApiModelProperty()
	response_code: string;

	@ApiModelProperty({ isArray: true })
	response_data: FavourutesResponseDTO;

}
