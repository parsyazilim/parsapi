import * as mongoose from 'mongoose';
import { IsNotEmpty, IsNumber, IsOptional, Max, Min, IsString } from 'class-validator';
import { ApiModelProperty, ApiModelPropertyOptional } from '@nestjs/swagger';

export const RatingSchema = new mongoose.Schema({
	rate: { type: Number },
	description: { type: String },
	productId: { type: String },
	userId: { type: String },
}, {
	timestamps: true
});

export class RatingSaveDTO {
	@IsNotEmpty()
	@IsNumber()
	@Min(1)
	@Max(5)
	@ApiModelProperty()
	rate: number;

	@IsOptional()
	@IsString()
	@ApiModelPropertyOptional()
	description?: string;

	@ApiModelProperty()
	productId: string;

	userId: string;
}

export class RatingDTO extends RatingSaveDTO {

}