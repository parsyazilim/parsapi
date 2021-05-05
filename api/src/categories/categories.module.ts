import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubCategoryModule } from '../sub-categories/sub-categories.module';
import { ProductModule } from '../products/products.module';
import { BannerModule } from '../banner/banner.module';
import { DealModule } from '../deals/deals.module';
import { CategoryController } from './categories.controller';
import { CategorySchema } from './categories.model';
import { CategoryService } from './categories.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Category', schema: CategorySchema }]),
		forwardRef(() => BannerModule),
		DealModule,
		forwardRef(() => SubCategoryModule),
		forwardRef(() => ProductModule)
	],
	controllers: [CategoryController],
	providers: [CategoryService],
	exports: [CategoryService, MongooseModule]
})

export class CategoryModule {
}