import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AddressModule } from '../address/address.module';
import { CouponsModule } from '../coupons/coupons.module';
import { ProductModule } from '../products/products.module';
import { SettingModule } from '../settings/settings.module';
import { CartController } from './cart.controller';
import { CartSchema, ProductOrderUserSchema } from './cart.model';
import { CartService } from './cart.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'Cart', schema: CartSchema },
			{ name: 'OrderProducts', schema: ProductOrderUserSchema }
		]),
		AddressModule,
		CouponsModule,
		forwardRef(() => ProductModule),
		SettingModule
	],
	controllers: [CartController],
	providers: [CartService],
	exports: [CartService, MongooseModule]
})

export class CartModule {
}