import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { UsersModule } from './users/users.module';
import { CategoryModule } from './categories/categories.module';
import { DealModule } from './deals/deals.module';
import { ProductModule } from './products/products.module';
import * as dotenv from 'dotenv';
import { AddressModule } from './address/address.module';
import { FavouritesModule } from './favourites/favourites.module';
import { OrderModule } from './order/order.module';
import { CouponsModule } from './coupons/coupons.module';
import { CartModule } from './cart/cart.module';
import { RatingModule } from './rating/rating.module';
import { NotificationsModule } from './notifications/notifications.module';
import * as sentry from '@sentry/node';
import { SettingModule } from './settings/settings.module';
import { BannerModule } from './banner/banner.module';
import { BusinessModule } from './business/business.module';
import { SubCategoryModule } from './sub-categories/sub-categories.module';
import { LanguageModule } from './language/language.module';
import { PageModule } from './pages/pages.module';
import { WalletModule } from './wallet/wallet.module';
import { ProductOutOfStockModule } from './product-out-of-stock/product-out-of-stock.module';
import { ChatModule } from './chat/chat.module';
import { DeliveryBoyRatingsModule } from './delivery-boy-ratings/delivery-boy-ratings.module'
const os = require('os');
import * as bodyParser from 'body-parser';
import { SubscriptionModule } from './subscription/subscription.module';
const { Appsignal } = require("@appsignal/nodejs");
const { expressMiddleware } = require("@appsignal/express");

async function bootstrap() {
	dotenv.config();
	// const app = await NestFactory.create(AppModule);

	const appsignal = new Appsignal({
		active: process.env.NODE_ENV == 'production',
		name: process.env.APP_SIGNAL_NAME ?? "Grocery",
		apiKey: process.env.APP_SIGNAL_API_KEY,
	});
	const app = await NestFactory.create(AppModule, {
		bodyParser: false
	});
	app.use(expressMiddleware(appsignal));
	const rawBodyBuffer = (req, res, buf, encoding) => {
		if (buf && buf.length) {
			req.rawBody = buf.toString(encoding || 'utf8');
		}
	};

	app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
	app.use(bodyParser.json({ verify: rawBodyBuffer }));
	app.useGlobalPipes(new ValidationPipe());
	app.enableCors();

	app.use((req, res, next) => {
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
		next();
	});

	if (process.env.NODE_ENV === 'production' && process.env.SENTRY_URL) sentry.init({ dsn: process.env.SENTRY_URL });

	if (process.env.PREDIFINED && process.env.PREDIFINED == "true") {
		let options = new DocumentBuilder().setTitle('Groceries App').setBasePath("/").setVersion('v1').addBearerAuth().setSchemes('https', 'http').build();

		const document = SwaggerModule.createDocument(app, options, {
			include: [AddressModule, BannerModule, BusinessModule, CategoryModule, CartModule, CouponsModule, ChatModule, DealModule, DeliveryBoyRatingsModule, FavouritesModule, LanguageModule, NotificationsModule, OrderModule,
				PageModule, ProductModule, ProductOutOfStockModule, RatingModule, SettingModule, SubCategoryModule, SubscriptionModule, UsersModule, WalletModule]
		});
		SwaggerModule.setup('/explorer', app, document);
	}

	const port = process.env.PORT || 3000;
	await app.listen(port);
	console.log(`http://localhost:${port}/explorer/#/`)
}

bootstrap();
