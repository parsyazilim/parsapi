import { Controller, Get, UseGuards, Query, Post, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiUseTags, ApiResponse } from '@nestjs/swagger';
import { UsersDTO } from '../users/users.model';
import { NotificationService } from './notifications.service';
import { UtilService } from '../utils/util.service';
import { CommonResponseModel, ResponseErrorMessage, ResponseSuccessMessage, ResponseBadRequestMessage, ResponseMessage, AdminSettings, AdminQuery } from '../utils/app.model';
import { GetUser } from '../utils/jwt.strategy';
import { ResponseNotificationListDTO, SendNotificationDTO, readNotificationDTO } from './notifications.model';
import { PushService } from '../utils/push.service';

@Controller('notifications')
@ApiUseTags('Notifications')
export class NotificationController {
	constructor(
		private notificationService: NotificationService,
		private utilService: UtilService,
		private pushService: PushService
	) {
	}

	@Get('/admin/list')
	@ApiOperation({ title: 'Get all notification' })
	@ApiResponse({ status: 200, description: 'Return list of notification', type: ResponseNotificationListDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAllNotification(@GetUser() user: UsersDTO, @Query() adminQuery: AdminQuery): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let pagination = this.utilService.getAdminPagination(adminQuery);
			const notifications = await Promise.all([
				this.notificationService.getAllNotification(pagination.page - 1, pagination.limit),
				this.notificationService.countAllnotification()
			])
			return this.utilService.successResponseData(notifications[0], { total: notifications[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/latest')
	@ApiOperation({ title: 'Get last 5 notifications' })
	@ApiResponse({ status: 200, description: 'Return list of unread notification', type: ResponseNotificationListDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getLastNotifications(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const notifications = await Promise.all([
				this.notificationService.getAllNotification(0, 5),
				this.notificationService.countUnread()
			])
			return this.utilService.successResponseData(notifications[0], { unread: notifications[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/admin/send')
	@ApiOperation({ title: 'Send notification to all' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async sendToAll(@GetUser() user: UsersDTO, @Body() notificationData: SendNotificationDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const response = await this.pushService.sendNotificationToUser(null, notificationData.title, notificationData.body, true);
			if (response) return this.utilService.successResponseMsg(ResponseMessage.PUSH_NOTIFICATION_SENT);
			else this.utilService.badRequest(ResponseMessage.PUSH_NOTIFICATION_NOT_SENT);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/admin/read')
	@ApiOperation({ title: 'Read notification' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async readNotification(@GetUser() user: UsersDTO, @Body() notificationData: readNotificationDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let response = await this.notificationService.readNotification(notificationData.notificationId);
			if (response) return this.utilService.successResponseData({ status: true });
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
}
