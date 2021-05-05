import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationController } from './notifications.controller';
import { NotificationSchema } from './notifications.model';
import { NotificationService } from './notifications.service';
import { PushService } from '../utils/push.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Notification', schema: NotificationSchema }])
	],
	controllers: [NotificationController],
	providers: [NotificationService, PushService],
	exports: [NotificationService, MongooseModule]
})

export class NotificationsModule {
}
