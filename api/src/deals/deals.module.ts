import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryModule } from '../categories/categories.module';
import { ProductModule } from '../products/products.module';
import { DealController } from './deals.controller';
import { DealSchema } from './deals.model';
import { DealService } from './deals.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Deal', schema: DealSchema }]),
		forwardRef(() => CategoryModule),
		forwardRef(() => ProductModule)
	],
	controllers: [DealController],
	providers: [DealService],
	exports: [DealService, MongooseModule]
})

export class DealModule {
}
