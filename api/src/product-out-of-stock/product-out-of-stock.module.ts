import { Module } from '@nestjs/common';
import { ProductOutOfStockService } from './product-out-of-stock.service';
import { ProductOutOfStockController } from './product-out-of-stock.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductOutOfStockSchema } from './product-out-of-stock.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'ProductOutOfStock', schema: ProductOutOfStockSchema }])
	],
	providers: [ProductOutOfStockService],
	controllers: [ProductOutOfStockController],
	exports: [ProductOutOfStockService, MongooseModule]
})
export class ProductOutOfStockModule { }
