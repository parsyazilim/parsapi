import { Controller, UseGuards, Get, Query, Body, Post, Param, Put, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiImplicitQuery, ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { UsersDTO } from '../users/users.model';
import { CommonResponseModel, ResponseBadRequestMessage, ResponseErrorMessage, ResponseMessage, ResponseSuccessMessage, UserQuery } from '../utils/app.model';
import { SubscriptionStatusService } from './subscription-status.service';
import { ResponseSubscriptionHistory} from './subscription-status.model';
import { UtilService } from '../utils/util.service';
import { GetUser } from '../utils/jwt.strategy';


@Controller('subscription-status')
@ApiUseTags('Subscription-status')
export class SubscriptionStatusController {
	constructor(
		private subscriptionStatusService: SubscriptionStatusService,
	) {
	}
}