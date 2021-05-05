import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { PageController } from './pages.controller';
import { PageSchema } from './pages.model';
import { PageService } from './pages.service';
import { UtilService } from '../utils/util.service';

@Module({
	imports: [
		PassportModule.register({ defaultStrategy: 'jwt' }),
		MongooseModule.forFeature([{ name: 'Page', schema: PageSchema }]),
	],
	controllers: [PageController],
	providers: [PageService, UtilService],
})

export class PageModule {
}
