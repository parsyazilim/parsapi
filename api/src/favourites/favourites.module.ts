import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductModule } from '../products/products.module';
import { CartModule } from '../cart/cart.module';
import { FavouriteController } from './favourites.controller';
import { FavouriteSchema } from './favourites.model';
import { FavouriteService } from './favourites.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Favourite', schema: FavouriteSchema }]),
		forwardRef(() => ProductModule),
		CartModule
	],
	controllers: [FavouriteController],
	providers: [FavouriteService],
	exports: [FavouriteService, MongooseModule]
})

export class FavouritesModule {
}