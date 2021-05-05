import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductModule } from '../products/products.module';
import { CartModule } from '../cart/cart.module';
import { RatingController } from './rating.controller';
import { RatingSchema } from './rating.model';
import { RatingService } from './rating.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Rating', schema: RatingSchema }]),
		CartModule,
		forwardRef(() => ProductModule)
	],
	controllers: [RatingController],
	providers: [RatingService],
	exports: [RatingService, MongooseModule]
})

export class RatingModule {
}
