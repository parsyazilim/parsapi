import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingModule } from '../settings/settings.module';
import { AddressController } from './address.controller';
import { AddressSchema } from './address.model';
import { AddressService } from './address.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Address', schema: AddressSchema }]),
		SettingModule
	],
	controllers: [AddressController],
	providers: [AddressService],
	exports: [AddressService, MongooseModule]
})

export class AddressModule {
}
