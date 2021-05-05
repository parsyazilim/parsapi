
import * as mongoose from 'mongoose';
import { ApiModelProperty } from '@nestjs/swagger';

export const ProductOutOfStockSchema = new mongoose.Schema({
	productId: { type: String },
	title: { type: String },
	unit: { type: String },
}, {
	timestamps: true
});
export class StockVariantDTO {
	@ApiModelProperty()
	productId: string;

	@ApiModelProperty()
	title: string

	@ApiModelProperty()
	unit: string;
}