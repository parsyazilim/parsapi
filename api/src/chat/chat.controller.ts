import { Controller, Get, UseGuards, Query, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiUseTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ResponseErrorMessage, CommonResponseModel, AdminQuery, UserQuery } from '../utils/app.model';
import { UtilService } from '../utils/util.service';
import { GetUser } from '../utils/jwt.strategy';
import { ChatService } from './chat.service';
import { UsersDTO } from '../users/users.model';

@Controller('chats')
@ApiUseTags('Chats')
export class ChatController {
	constructor(
		private chatService: ChatService,
		private utilService: UtilService
	) {
	}

	@Get('/list')
	@ApiOperation({ title: 'Get my chats' })
	@ApiResponse({ status: 200, description: 'Return list of chats' })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAllChatForUser(@GetUser() user: UsersDTO, @Query() userQuery: UserQuery): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			let pagination = this.utilService.getUserPagination(userQuery);
			const chats = await this.chatService.getAllUserChat(user._id, pagination.page, pagination.limit);
			return this.utilService.successResponseData(chats);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/group')
	@ApiOperation({ title: 'Get users list of chats' })
	@ApiResponse({ status: 200, description: 'Return users list of chats' })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAllChatGroup(@GetUser() user: UsersDTO, @Query() adminQuery: AdminQuery): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let pagination = this.utilService.getAdminPagination(adminQuery);
			const chatGroups = await this.chatService.getAllChatGroup(pagination.page, pagination.limit)
			return this.utilService.successResponseData(chatGroups);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/:userId')
	@ApiOperation({ title: 'Get all chat by user' })
	@ApiResponse({ status: 200, description: 'Return list of chat by user' })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAllChatByUserId(@GetUser() user: UsersDTO, @Param('userId') userId: string, @Query('page') page: number, @Query() adminQuery: AdminQuery): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let pagination = this.utilService.getAdminPagination(adminQuery);
			const chats = await this.chatService.getAllUserChat(userId, pagination.page, pagination.limit)
			return this.utilService.successResponseData(chats);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
}
