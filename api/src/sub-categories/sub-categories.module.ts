import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryModule } from '../categories/categories.module';
import { ProductModule } from '../products/products.module';
import { SubCategoryController } from './sub-categories.controller';
import { SubCategorySchema } from './sub-categories.model';
import { SubCategoryService } from './sub-categories.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'SubCategory', schema: SubCategorySchema }]),
		forwardRef(() => CategoryModule),
		forwardRef(() => ProductModule)
	],
	providers: [SubCategoryService],
	controllers: [SubCategoryController],
	exports: [SubCategoryService, MongooseModule]
})

export class SubCategoryModule {
}
