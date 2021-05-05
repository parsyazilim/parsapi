import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CouponController } from './coupons.controller';
import { CouponSchema } from './coupons.model';
import { CouponService } from './coupons.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Coupon', schema: CouponSchema }])
	],
	controllers: [CouponController],
	providers: [CouponService],
	exports: [CouponService, MongooseModule]
})

export class CouponsModule {
}
