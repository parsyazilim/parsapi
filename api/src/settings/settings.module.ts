import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingController } from './settings.controller';
import { SettingSchema } from './settings.model';
import { SettingService } from './settings.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Setting', schema: SettingSchema }])
	],
	providers: [SettingService],
	controllers: [SettingController],
	exports: [SettingService, MongooseModule]
})

export class SettingModule {
}
