import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartModule } from '../cart/cart.module';
import { CategoryModule } from '../categories/categories.module';
import { BannerModule } from '../banner/banner.module';
import { DealModule } from '../deals/deals.module';
import { FavouritesModule } from '../favourites/favourites.module';
import { RatingModule } from '../rating/rating.module';
import { SubCategoryModule } from '../sub-categories/sub-categories.module';
import { ProductController } from './products.controller';
import { ProductSchema } from './products.model';
import { ProductService } from './products.service';
import { ExcelService } from '../utils/excel.service';
import { ProductOutOfStockModule } from '../product-out-of-stock/product-out-of-stock.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Product', schema: ProductSchema }]),
		forwardRef(() => BannerModule),
		forwardRef(() => CartModule),
		forwardRef(() => CategoryModule),
		forwardRef(() => DealModule),
		FavouritesModule,
		forwardRef(() => RatingModule),
		forwardRef(() => SubCategoryModule),
		forwardRef(() => ProductOutOfStockModule)
	],
	controllers: [ProductController],
	providers: [ProductService, ExcelService],
	exports: [ProductService, MongooseModule]
})

export class ProductModule {
}
