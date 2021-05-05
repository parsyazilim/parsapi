import { forwardRef, Module } from '@nestjs/common';
import { DeliveryBoyRatingsService } from './delivery-boy-ratings.service';
import { DeliveryBoyRatingsController } from './delivery-boy-ratings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DeliveryBoyRatingSchema } from './delivery-boy-ratings.model';
import { OrderModule } from '../order/order.module'

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'DeliveryBoyRating', schema: DeliveryBoyRatingSchema }]),
		forwardRef(() => OrderModule)


	],
	providers: [DeliveryBoyRatingsService],
	controllers: [DeliveryBoyRatingsController],
	exports: [DeliveryBoyRatingsService, MongooseModule]
})

export class DeliveryBoyRatingsModule { }
