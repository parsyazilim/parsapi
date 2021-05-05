import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LanguageController } from './language.controller';
import { LanguageSchema } from './language.model';
import { LanguageService } from './language.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Language', schema: LanguageSchema }]),
	],
	providers: [LanguageService],
	controllers: [LanguageController],
	exports: [LanguageService, MongooseModule]
})

export class LanguageModule {
}