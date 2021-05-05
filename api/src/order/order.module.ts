import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryModule } from '../categories/categories.module';
import { CartModule } from '../cart/cart.module';
import { AddressModule } from '../address/address.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingModule } from '../settings/settings.module';
import { ProductModule } from '../products/products.module';
import { SequenceModule } from '../sequence/sequence.module';
import { WalletModule } from '../wallet/wallet.module';
import { BusinessModule } from '../business/business.module';
import { OrderController } from './order.controller';
import { OrderSchema } from './order.model';
import { OrderService } from './order.service';
import { PushService } from '../utils/push.service';
import { StripeService } from '../utils/stripe.service';
import { EmailService } from '../utils/email.service';
import { ProductOutOfStockModule } from '../product-out-of-stock/product-out-of-stock.module';
import { DeliveryBoyRatingsModule } from '../delivery-boy-ratings/delivery-boy-ratings.module';
import { CouponsModule} from '../coupons/coupons.module'

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Order', schema: OrderSchema }]),
		AddressModule,
		BusinessModule,
		CategoryModule,
		CartModule,
		NotificationsModule,
		ProductModule,
		SequenceModule,
		SettingModule,
		WalletModule,
		ProductOutOfStockModule,
		DeliveryBoyRatingsModule,
		CouponsModule
	],
	controllers: [OrderController],
	providers: [OrderService, PushService, StripeService, EmailService],
	exports: [OrderService, MongooseModule]
})

export class OrderModule {
}
