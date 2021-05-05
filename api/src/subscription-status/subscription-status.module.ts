import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SubscriptionStatusController } from './subscription-status.controller';
import { SubscriptionStatusService } from './subscription-status.service';
import { SubscriptionStatusSchema } from './subscription-status.model';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'SubscriptionStatus', schema: SubscriptionStatusSchema }])
	],
	controllers: [SubscriptionStatusController],
	providers: [SubscriptionStatusService],
	exports: [SubscriptionStatusService, MongooseModule]
})

export class SubscriptionStatusModule {
}

