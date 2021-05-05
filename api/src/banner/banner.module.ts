import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryModule } from '../categories/categories.module';
import { ProductModule } from '../products/products.module';
import { BannerController } from './banner.controller';
import { BannerSchema } from './banner.model';
import { BannerService } from './banner.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Banner', schema: BannerSchema }]),
		forwardRef(() => CategoryModule),
		forwardRef(() => ProductModule)
	],
	controllers: [BannerController],
	providers: [BannerService],
	exports: [BannerService, MongooseModule]
})

export class BannerModule {

}
