import * as mongoose from 'mongoose';
const readline = require('readline');

import { AddressSchema } from './src/address/address.model';
import { BannerSchema } from './src/banner/banner.model';
import { BusinessSchema } from './src/business/business.model';
import { CartSchema } from './src/cart/cart.model';
import { CategorySchema } from './src/categories/categories.model';
import { ChatSchema } from './src/chat/chat.model';
import { CouponSchema } from './src/coupons/coupons.model';
import { DealSchema } from './src/deals/deals.model';
import { DeliveryBoyRatingSchema } from './src/delivery-boy-ratings/delivery-boy-ratings.model'
import { FavouriteSchema } from './src/favourites/favourites.model';
import { LanguageSchema } from './src/language/language.model';
import { NotificationSchema } from './src/notifications/notifications.model';
import { OrderSchema } from './src/order/order.model';
import { ProductOrderUserSchema } from './src/cart/cart.model';
import { PageSchema } from './src/pages/pages.model';
import { ProductOutOfStockSchema } from './src/product-out-of-stock/product-out-of-stock.model';
import { ProductSchema } from './src/products/products.model';
import { RatingSchema } from './src/rating/rating.model';
import { SequenceSchema } from './src/sequence/sequence.model';
import { SettingSchema } from './src/settings/settings.model';
import { SubCategorySchema } from './src/sub-categories/sub-categories.model';
import { SubscriptionSchema } from './src/subscription/subscription.model';
import { SubscriptionStatusSchema } from './src/subscription-status/subscription-status.model';
import { UserSchema } from './src/users/users.model';
import { WalletSchema } from './src/wallet/wallet.model';
import { UserRoles } from './src/utils/app.model';



const addressCollections = require('./seedings/addresses');
const bannerCollections = require('./seedings/banners');
const businessCollections = require('./seedings/business');
const cartCollections = require('./seedings/carts');
const categoryCollections = require('./seedings/categories');
const chatCollections = require('./seedings/chats');
const couponCollections = require('./seedings/coupons');
const dealCollections = require('./seedings/deals');
const deliveryBoyRatingCollections = require('./seedings/deliveryboyratings')
const favouriteCollections = require('./seedings/favourites');
const languageCollections = require('./seedings/languages');
const notificationCollections = require('./seedings/notifications');
const orderCollections = require('./seedings/orders');
const orderProductCollections = require('./seedings/orderproducts')
const pageCollections = require('./seedings/pages');
const ProductOutOfStockCollections = require('./seedings/productoutofstocks.js')
const productCollections = require('./seedings/products');
const ratingCollections = require('./seedings/ratings');
const sequenceCollections = require('./seedings/sequences');
const settingsCollections = require('./seedings/settings');
const subCategoryCollections = require('./seedings/sub-categories');
const userCollections = require('./seedings/users');
const walletCollections = require('./seedings/wallet');
const subscriptionCollections = require('./seedings/subscriptions')
const subscriptionStatusCollections = require('./seedings/subscriptionstatuses')

export class SeedDatabse {
	private addresses = mongoose.model<any>('Address', AddressSchema);
	private banners = mongoose.model<any>('Banner', BannerSchema);
	private business = mongoose.model<any>('Business', BusinessSchema);
	private carts = mongoose.model<any>('Cart', CartSchema);
	private categories = mongoose.model<any>('Category', CategorySchema);
	private chats = mongoose.model<any>('Chat', ChatSchema);
	private coupons = mongoose.model<any>('Coupon', CouponSchema);
	private deals = mongoose.model<any>('Deal', DealSchema);
	private deliveryBoyRatings = mongoose.model<any>('DeliveryBoyRating', DeliveryBoyRatingSchema);
	private favourites = mongoose.model<any>('Favourite', FavouriteSchema);
	private languages = mongoose.model<any>('Language', LanguageSchema);
	private notifications = mongoose.model<any>('Notification', NotificationSchema);
	private orders = mongoose.model<any>('Order', OrderSchema);
	private orderProducts = mongoose.model<any>('OrderProducts', ProductOrderUserSchema);
	private pages = mongoose.model<any>('Page', PageSchema);
	private productOutOfStocks = mongoose.model<any>('ProductOutOfStock', ProductOutOfStockSchema)
	private products = mongoose.model<any>('Product', ProductSchema);
	private ratings = mongoose.model<any>('Rating', RatingSchema);
	private sequences = mongoose.model<any>('Sequence', SequenceSchema);
	private settings = mongoose.model<any>('Setting', SettingSchema);
	private subCategories = mongoose.model<any>('SubCategory', SubCategorySchema);
	private users = mongoose.model<any>('User', UserSchema);
	private wallets = mongoose.model<any>('Wallet', WalletSchema);
	private subscriptions = mongoose.model<any>('Subscription', SubscriptionSchema);
	private subscriptionStatuses = mongoose.model<any>('SubscriptionStatus', SubscriptionStatusSchema);

	private production = false;
	private connectionUrl = "";

	constructor() {
		console.log("Do you want to reset database.?")
		console.log("It will delete all data from your database. Be careful while running this.");

		if (process.env.MONGO_DB_URL) {
			this.connectionUrl = process.env.MONGO_DB_URL;
			if (process.env.SEEDING_TYPE && process.env.SEEDING_TYPE == 'production') this.production = true;
			else this.production = false;
			this.connect();
		} else {
			const consoleInterface = readline.createInterface({
				input: process.stdin,
				output: process.stdout
			});
			consoleInterface.question("\x1b[36m%s\x1b[0mEnter the Mongo DB connection uri string: ", (url) => {
				this.connectionUrl = url;

				consoleInterface.question("\x1b[36m%s\x1b[0mIs it for production? (production/staging):", (input) => {
					if (input == "production") this.production = true;
					console.log("\nPRDOCUTION: ", this.production);
					consoleInterface.close();
				});
			});
			consoleInterface.on('close', () => {
				this.connect();
			});
		}
	}

	connect() {
		if (this.connectionUrl) {
			mongoose.connect(this.connectionUrl, { useUnifiedTopology: true, useNewUrlParser: true }, (err) => {
				if (err) {
					console.log("\x1b[31mCOULT NOT RESET DATABASE");
					console.log(err.message);
					process.exit(0);
				} else {
					this.reset();
				}
			});
		} else {
			console.log("\x1b[31m NO CONNECTION URL FOUND");
		}
	}

	async reset() {
		console.log("-------------------START-------------------");
		await this.deleteCollections();
		await this.setLanguage();
		await this.setSettings();
		await this.setForProduction();

		if (!this.production) await this.setOthers();
		console.log("-------------------FINISHED-------------------");
		console.log("\nNow you can exit.");
		process.exit(0);
	}

	async deleteCollections() {
		await this.addresses.deleteMany({});
		console.log("Deleted Collection: Addresses");

		await this.banners.deleteMany({});
		console.log("Deleted Collection: Banners");

		await this.business.deleteMany({});
		console.log("Deleted Collection: Businesses");

		await this.carts.deleteMany({});
		console.log("Deleted Collection: Carts");

		await this.categories.deleteMany({});
		console.log("Deleted Collection: Categories");

		await this.chats.deleteMany({});
		console.log("Deleted Collection: Chats");

		await this.coupons.deleteMany({});
		console.log("Deleted Collection: Coupons");

		await this.deals.deleteMany({});
		console.log("Deleted Collection: Deals");

		await this.deliveryBoyRatings.deleteMany({});
		console.log("Deleted Collection: DeliveryBoyRatings");

		await this.favourites.deleteMany({});
		console.log("Deleted Collection: Favourites");

		await this.languages.deleteMany({});
		console.log("Deleted Collection: Languages");

		await this.notifications.deleteMany({});
		console.log("Deleted Collection: Notifications");

		await this.orders.deleteMany({});
		console.log("Deleted Collection: Order");

		await this.orderProducts.deleteMany({});
		console.log("Deleted Collection: OrderProducts");

		await this.pages.deleteMany({});
		console.log("Deleted Collection: Pages");

		await this.productOutOfStocks.deleteMany({});
		console.log("Deleted Collection: ProductOutOfStocks");

		await this.products.deleteMany({});
		console.log("Deleted Collection: Products");

		await this.ratings.deleteMany({});
		console.log("Deleted Collection: Rating");

		await this.sequences.deleteMany({});
		console.log("Deleted Collection: Sequences");

		await this.settings.deleteMany({});
		console.log("Deleted Collection: Settings");

		await this.subCategories.deleteMany({});
		console.log("Deleted Collection: SubCategories");

		await this.subscriptions.deleteMany({});
		console.log("Deleted Collection: SubScription");

		await this.subscriptionStatuses.deleteMany({});
		console.log("Deleted Collection: SubScriptionStatus");

		await this.users.deleteMany({});
		console.log("Deleted Collection: Users");

		await this.wallets.deleteMany({});
		console.log("Deleted Collection: Wallets");
	}

	async setForProduction() {
		await this.business.insertMany(businessCollections);
		console.log("Added Collection: Business");

		if (this.production) await this.users.insertMany(userCollections.find(x => x.role === UserRoles.ADMIN));
		else await this.users.insertMany(userCollections);
		console.log("Added Collection: Users");

		await this.pages.insertMany(pageCollections);
		console.log("Added Collection: Pages");
	}

	async setOthers() {
		await this.addresses.insertMany(addressCollections);
		console.log("Added Collection: Addresses");

		await this.banners.insertMany(bannerCollections);
		console.log("Added Collection: Banners");

		await this.carts.insertMany(cartCollections);
		console.log("Added Collection: Carts");

		await this.categories.insertMany(categoryCollections);
		console.log("Added Collection: Categories");

		await this.chats.insertMany(chatCollections);
		console.log("Added Collection: Chat");

		await this.coupons.insertMany(couponCollections);
		console.log("Added Collection: Coupons");

		await this.deals.insertMany(dealCollections);
		console.log("Added Collection: Deals");

		await this.deliveryBoyRatings.insertMany(deliveryBoyRatingCollections);
		console.log("Added Collection: DeliveryBoyRatings");

		await this.favourites.insertMany(favouriteCollections);
		console.log("Added Collection: Favourites");

		await this.notifications.insertMany(notificationCollections);
		console.log("Added Collection: Notifications");

		await this.orders.insertMany(orderCollections);
		console.log("Added Collection: Orders");

		await this.orderProducts.insertMany(orderProductCollections);
		console.log("Added Collection: OrdersProducts");

		await this.products.insertMany(productCollections);
		console.log("Added Collection: Products");

		await this.productOutOfStocks.insertMany(ProductOutOfStockCollections);
		console.log("Added Collection: ProductOutOfStocks");

		await this.ratings.insertMany(ratingCollections);
		console.log("Added Collection: Rating");

		await this.subCategories.insertMany(subCategoryCollections);
		console.log("Added Collection: SubCategories");

		await this.subscriptions.insertMany(subscriptionCollections);
		console.log("Added Collection: SubScription");

		await this.subscriptionStatuses.insertMany(subscriptionStatusCollections);
		console.log("Added Collection: SubScriptionStatus");

		await this.sequences.insertMany(sequenceCollections);
		console.log("Added Collection: Sequences");

		await this.wallets.insertMany(walletCollections);
		console.log("Added Collection: Wallets");

	}

	async setLanguage() {
		await this.languages.insertMany(languageCollections);
		console.log("Added Collection: Languages");
	}

	async setSettings() {
		await this.settings.insertMany(settingsCollections);
		console.log("Added Collection: Settings");
	}
}

const reptile = new SeedDatabse();