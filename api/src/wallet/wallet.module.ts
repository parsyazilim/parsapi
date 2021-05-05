import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletController } from './wallet.controller';
import { WalletSchema } from './wallet.model';
import { WalletService } from './wallet.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Wallet', schema: WalletSchema }])
	],
	controllers: [WalletController],
	providers: [WalletService],
	exports: [WalletService, MongooseModule]
})

export class WalletModule {
}

