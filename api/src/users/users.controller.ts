import { Controller, Post, Body, Get, Delete, UseGuards, Param, Put, Res, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import {
	UserCreateDTO,
	LoginDTO, LogInMobileDTO,
	UsersDTO,
	ChangePasswordDTO,
	ForgotPasswordDTO,
	ResetPasswordDTO, ResetNumberPasswordDTO,
	LanguageUpdateDTO,
	UsersUpdateDTO, UserStatusDTO, AdminDeliveryDTO, ResponseLogin, ResponseMe, ResponseAdminUserList, ResponseAdminDeliveryList,
	OTPVerifyDTO, OTPSendDTO, UserCreateMobileDTO
} from './users.model';
import { UserService } from './users.service';
import { ApiBearerAuth, ApiConsumes, ApiImplicitFile, ApiUseTags, ApiOperation, ApiResponse, ApiImplicitQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UtilService } from '../utils/util.service';
import { UserRoles, ResponseMessage, UploadImageDTO, UploadImageResponseDTO, AdminSettings, CommonResponseModel, ResponseErrorMessage, ResponseBadRequestMessage, ResponseSuccessMessage, AdminQuery } from '../utils/app.model';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { UploadService } from '../utils/upload.service';
import { AuthService } from '../utils/auth.service';
import { EmailService } from '../utils/email.service';
import { GetUser } from '../utils/jwt.strategy';
import { OtpService } from '../utils/otp.service';
import { OrderService } from '../order/order.service';

@Controller('users')
@ApiUseTags('Users')
export class UserController {
	constructor(
		private userService: UserService,
		private authService: AuthService,
		private utilService: UtilService,
		private emailService: EmailService,
		private uploadService: UploadService,
		private otpService: OtpService,
		private orderService: OrderService,
	) {
	}

	/* ################################################### NO AUTH ################################## */
	@Post('/register')
	@ApiOperation({ title: 'Register user' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async registerNewUser(@Body() userData: UserCreateDTO): Promise<CommonResponseModel> {
		try {
			const mobileNumber = this.utilService.convertToNumber(userData.mobileNumber);

			if (mobileNumber == 0) this.utilService.badRequest(ResponseMessage.REQUIRED_VALID_MOBILE_NUMBER);

			const checkUser = await this.userService.findUserByEmailOrMobile(userData.email, userData.mobileNumber);
			if (checkUser && checkUser.email == userData.email) this.utilService.badRequest(ResponseMessage.USER_EMAIL_ALREADY_EXIST);
			if (checkUser && checkUser.mobileNumber == userData.mobileNumber) this.utilService.badRequest(ResponseMessage.USER_MOBILE_ALREADY_EXIST);

			userData.role = UserRoles.USER;
			const user = await this.userService.createUser(userData);

			if (user) {
				const emailRes = await this.emailService.sendEmailForVerification(user.firstName, user.email, user.emailVerificationId);
				if (emailRes) return this.utilService.successResponseMsg(ResponseMessage.USER_EMAIL_VERIFY_SENT);
				else this.utilService.badRequest(ResponseMessage.USER_EMAIL_VERIFY_NOT_SENT);
			}
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}





	@Post('/login')
	@ApiOperation({ title: 'Log in user' })
	@ApiResponse({ status: 200, description: 'Return user info', type: ResponseLogin })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async validateUser(@Body() credential: LoginDTO): Promise<CommonResponseModel> {
		try {
			const user = await this.userService.getUserByEmail(credential.email);
			if (!user) this.utilService.badRequest(ResponseMessage.USER_EMAIL_NOT_FOUND);

			if (!user.status) this.utilService.badRequest(ResponseMessage.USER_ACCOUNT_BLOCKED);
			if (!user.emailVerified) return this.utilService.resetContentResponseMsg(ResponseMessage.USER_EMAIL_NOT_VERIFIED);

			const isValid = await this.authService.verifyPassword(credential.password, user.password);
			if (!isValid) this.utilService.badRequest(ResponseMessage.USER_EMAIL_OR_PASSWORD_INVALID);

			await this.userService.updatePlayerId(user._id, credential.playerId);
			const token = await this.authService.generateAccessToken(user._id, user.role);
			return this.utilService.successResponseData({ token: token, role: user.role, id: user._id, language: user.language, isSuperAdmin: user.isSuperAdmin });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/forgot-password')
	@ApiOperation({ title: 'Forgot password' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async forgotPassword(@Body() emailData: ForgotPasswordDTO): Promise<CommonResponseModel> {
		try {
			const checkEmail = await this.userService.getUserByEmail(emailData.email);
			if (!checkEmail) this.utilService.badRequest(ResponseMessage.USER_EMAIL_INVALID);

			const otp = Math.floor(9000 * Math.random()) + 1000;
			const user = await this.userService.updateOTP(checkEmail._id, otp);

			const emailRes = await this.emailService.sendEmailForForgotPassword(user.firstName, user.email, otp);
			if (emailRes) return this.utilService.successResponseMsg(ResponseMessage.USER_FORGOT_PASSWORD_OTP_SENT_EMAIL);
			else this.utilService.badRequest(ResponseMessage.USER_FORGOT_PASSWORD_OTP_NOT_SENT_EMAIL);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/resend-verify-email')
	@ApiOperation({ title: 'Resend email verification to email' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async resendVerifyUserEmail(@Query('email') email: string) {
		try {
			const user = await this.userService.getUserByEmail(email);
			if (!user) this.utilService.badRequest(ResponseMessage.USER_EMAIL_NOT_FOUND);

			const resend = await this.userService.regenerateVerificationCode(user._id);
			if (resend) {
				const emailRes = await this.emailService.sendEmailForVerification(user.firstName, user.email, resend.emailVerificationId);
				if (emailRes) return this.utilService.successResponseMsg(ResponseMessage.USER_EMAIL_VERIFY_SENT);
				else this.utilService.badRequest(ResponseMessage.USER_EMAIL_VERIFY_NOT_SENT);
			}
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/verify-email')
	@ApiOperation({ title: 'Verify email verification to email' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async verifyUserEmail(@Query('verificationId') verificationId: string, @Query('email') email: string, @Res() res) {
		try {
			const user = await this.userService.getUserByEmail(email);
			if (!user) {
				const message = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_EMAIL_NOT_FOUND);
				return res.send(message);
			}
			if (user.emailVerified) {
				const message = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_EMAIL_VERIFIED_ALREADY);
				return res.send(message);
			}
			if (user.emailVerificationId !== verificationId) {
				const message = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_EMAIL_VERIFICATION_CODE_INVALID);
				return res.send(message);
			}

			const currentTime = (new Date()).getTime()
			if (currentTime > user.emailVerificationExpiry) {
				const message = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_EMAIL_VERIFY_EXPIRED);
				return res.send(message);
			}
			const isVerified = await this.userService.setEmailVerified(user._id);
			if (isVerified) {
				const message = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_EMAIL_VERIFIED_SUCCESSFULLY);
				return res.send(message);
			}
			else {
				const message = await this.utilService.getTranslatedMessageByKey(ResponseMessage.SOMETHING_WENT_WRONG);
				return res.send(message);
			}
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/verify-otp')
	@ApiOperation({ title: 'Verify OTP for reset password' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async verifyOtpEmail(@Query('otp') otp: string, @Query('email') email: string) {
		try {
			const user = await this.userService.getUserByEmail(email);
			if (!user) this.utilService.badRequest(ResponseMessage.USER_EMAIL_NOT_FOUND);
			if (user.otp != otp) this.utilService.badRequest(ResponseMessage.USER_FORGOT_PASSWORD_OTP_INVALID);

			const currentTime = (new Date()).getTime();
			if (currentTime > user.otpVerificationExpiry) this.utilService.badRequest(ResponseMessage.USER_FORGOT_PASSWORD_OTP_EXPIRED);

			const otpVerificationId = await this.utilService.getUUID();
			const isVerified = await this.userService.setOTPVerification(user._id, otpVerificationId);
			const message = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_FORGOT_PASSWORD_OTP_VERIFIED);
			if (isVerified) return this.utilService.successResponseData({ verificationToken: otpVerificationId, message: message });
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/reset-password')
	@ApiOperation({ title: 'Reset password' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async resetPassword(@Body() passwordData: ResetPasswordDTO): Promise<CommonResponseModel> {
		try {
			const user = await this.userService.getUserByEmail(passwordData.email);
			if (!user) this.utilService.badRequest(ResponseMessage.USER_EMAIL_NOT_FOUND);

			if (user.otpVerificationId !== passwordData.verificationToken) this.utilService.badRequest(ResponseMessage.USER_RESET_PASSWORD_INVALID_TOKEN);
			const { salt, hashedPassword } = await this.authService.hashPassword(passwordData.newPassword);

			const newPaswword = await this.userService.updatePassword(user._id, salt, hashedPassword);
			if (newPaswword) return this.utilService.successResponseMsg(ResponseMessage.USER_PASSWORD_CHANGED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/change-password')
	@ApiOperation({ title: 'Change password' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async changePassword(@GetUser() user: UsersDTO, @Body() passwordData: ChangePasswordDTO): Promise<CommonResponseModel> {
		try {
			const userInfo = await this.userService.getUserById(user._id);
			const isPasswordMatch = await this.authService.verifyPassword(passwordData.currentPassword, userInfo.password);
			if (!isPasswordMatch) this.utilService.badRequest(ResponseMessage.USER_CURRENT_PASSWORD_INCORRECT);

			const { salt, hashedPassword } = await this.authService.hashPassword(passwordData.newPassword);
			const newPaswword = await this.userService.updatePassword(user._id, salt, hashedPassword);

			if (newPaswword) return this.utilService.successResponseMsg(ResponseMessage.USER_PASSWORD_CHANGED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	/* ################################################### USERS ################################## */
	@Get('/me')
	@ApiOperation({ title: 'Get logged-in user info' })
	@ApiResponse({ status: 200, description: 'Return user info', type: ResponseMe })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async GetUserInfo(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		try {
			const me = await this.userService.getUserInfo(user._id);
			if (me) {
				me['walletAmount'] = me['walletAmount'] || 0;
				return this.utilService.successResponseData(me);
			}
			else return this.utilService.successResponseMsg(ResponseMessage.USER_PROFILE_NOT_FOUND);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/update/profile')
	@ApiOperation({ title: 'Update profile' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateProfile(@GetUser() user: UsersDTO, @Body() userInfo: UsersUpdateDTO): Promise<CommonResponseModel> {
		try {
			// if (userInfo.mobileNumber) {
			// 	const mobileNumber = this.utilService.convertToNumber(userInfo.mobileNumber);
			// 	if (mobileNumber == 0) this.utilService.badRequest(ResponseMessage.REQUIRED_VALID_MOBILE_NUMBER);
			// 	if (user && user.mobileNumber != userInfo.mobileNumber) {
			// 		const checkUser = await this.userService.findUserByMobile(userInfo.mobileNumber);
			// 		if (checkUser) this.utilService.badRequest(ResponseMessage.USER_MOBILE_ALREADY_EXIST);
			// 	}
			// }
			if (userInfo.email && userInfo.email !== user.email) {
				let user = await this.userService.getUserByEmail(userInfo.email);
				if (user) this.utilService.badRequest(ResponseMessage.USER_EMAIL_ALREADY_EXIST);
			}
			if (userInfo.mobileNumber) {
				userInfo.mobileNumber = user.mobileNumber;
			}
			const response = await this.userService.updateMyInfo(user._id, userInfo);
			if (response) return this.utilService.successResponseMsg(ResponseMessage.USER_PROFILE_UPDATED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/logout')
	@ApiOperation({ title: 'Logout profile' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async logout(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		try {
			const response = await this.userService.updateMyInfo(user._id, { playerId: null });
			if (response) return this.utilService.successResponseMsg(ResponseMessage.USER_LOGOUT);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	/* ################################################### ADMIN ################################## */
	@Get('/admin/list')
	@ApiOperation({ title: 'Get all users' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of user', type: ResponseAdminUserList })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAllUserList(@GetUser() user: UsersDTO, @Query() adminQuery: AdminQuery): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let pagination = this.utilService.getAdminPagination(adminQuery);
			const users = await Promise.all([
				this.userService.getAllUser(pagination.page - 1, pagination.limit, pagination.q),
				this.userService.countAllUser(pagination.q)
			])
			return this.utilService.successResponseData(users[0], { total: users[1] });
		} catch (e) {
			this.utilService.errorResponse(e)
		}
	}

	@Put('/admin/status-update/:userId')
	@ApiOperation({ title: 'Update user status by userId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateUserStatus(@GetUser() user: UsersDTO, @Param('userId') userId: string, @Body() userStatusData: UserStatusDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const userExist = await this.userService.getUserById(userId);
			if (!userExist) this.utilService.badRequest(ResponseMessage.USER_NOT_FOUND);

			const userStatus = await this.userService.updateUserStatus(userId, userStatusData);
			if (userStatus) return this.utilService.successResponseMsg(ResponseMessage.USER_STATUS_UPDATED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/admin/delivery-boy/create')
	@ApiOperation({ title: 'Create Delivery boy' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async createDeliveryBoy(@GetUser() user: UsersDTO, @Body() userData: AdminDeliveryDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const mobileNumber = this.utilService.convertToNumber(userData.mobileNumber);

			if (mobileNumber == 0) this.utilService.badRequest(ResponseMessage.REQUIRED_VALID_MOBILE_NUMBER);

			const checkUser = await this.userService.findUserByEmailOrMobile(userData.email, userData.mobileNumber);
			if (checkUser && checkUser.email == userData.email) this.utilService.badRequest(ResponseMessage.USER_EMAIL_ALREADY_EXIST);
			if (checkUser && checkUser.mobileNumber == userData.mobileNumber) this.utilService.badRequest(ResponseMessage.USER_MOBILE_ALREADY_EXIST);

			userData.role = UserRoles.DELIVERY_BOY;
			userData.emailVerified = true;
			userData['mobileNumberVerified'] = true;
			const user = await this.userService.createUser(userData);
			if (user) {
				return this.utilService.successResponseMsg(ResponseMessage.DELIVERY_BOY_CREATED_SUCCESSFULLY);
			}
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/delivery-boy/list')
	@ApiOperation({ title: 'Get all delivery boys' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiResponse({ status: 200, description: 'Return list of delivery boys', type: ResponseAdminDeliveryList })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAllDeliveryBoy(@GetUser() user: UsersDTO, @Query() adminQuery: AdminQuery): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let pagination = this.utilService.getAdminPagination(adminQuery);
			const users = await Promise.all([
				this.userService.getAllDeliveryBoy(pagination.page - 1, pagination.limit, pagination.q),
				this.userService.countAllDeliveryBoy(pagination.q)
			])
			return this.utilService.successResponseData(users[0], { total: users[1] });
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/delivery-boy/status-update/:deliveryBoyId')
	@ApiOperation({ title: 'Update delivery boy status by deliveryBoyId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateDeliveryBoyStatus(@GetUser() user: UsersDTO, @Param('deliveryBoyId') deliveryBoyId: string, @Body() userStatusData: UserStatusDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const userExist = await this.userService.getUserById(deliveryBoyId);
			if (!userExist) this.utilService.badRequest(ResponseMessage.USER_NOT_FOUND);

			const userStatus = await this.userService.updateUserStatus(deliveryBoyId, userStatusData);
			if (userStatus) return this.utilService.successResponseMsg(ResponseMessage.DELIVERY_BOY_STATUS_UPDATED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/language/update')
	@ApiOperation({ title: 'Update user preferred language' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateLanguage(@GetUser() user: UsersDTO, @Body() updateData: LanguageUpdateDTO): Promise<CommonResponseModel> {
		this.utilService.validateUserRole(user);
		try {
			const resData = await this.userService.updateMyLanguage(user._id, updateData.language);
			if (resData) return this.utilService.successResponseMsg(ResponseMessage.USER_LANGUAGE_UPDATED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG)
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/upload/image')
	@ApiOperation({ title: 'User profile image upload' })
	@ApiResponse({ status: 200, description: 'Return image detail', type: UploadImageResponseDTO })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseInterceptors(FileInterceptor('file'))
	@ApiConsumes('multipart/form-data')
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	@ApiImplicitFile({ name: 'file', required: true, description: 'Profile image upload' })
	public async userImageUpload(@GetUser() user: UsersDTO, @UploadedFile() file, @Body() image: UploadImageDTO): Promise<CommonResponseModel> {
		try {
			const uploadedImage = await this.uploadService.uploadImage(file, image.type) as UploadImageResponseDTO;
			if (uploadedImage.url) return this.utilService.successResponseData(uploadedImage);
			this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}


	@Delete('/delete/image')
	@ApiOperation({ title: 'Delete user profile image' })
	@ApiResponse({ status: 200, description: 'Return image detail', type: UploadImageResponseDTO })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async deleteImage(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		try {
			const userInfo = await this.userService.getUserInfo(user._id);

			const deleteImage = await this.uploadService.deleteImage(userInfo.imageId)
			if (deleteImage) {
				let removeImageDetail = { imageUrl: null, imageId: null, filePath: null }

				const UpdatedUseer = await this.userService.updateMyInfo(user._id, removeImageDetail);
				if (UpdatedUseer) return this.utilService.successResponseMsg(ResponseMessage.USER_PROFILE_IMAGE_DELETED);
				else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
			}
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/register-phone')
	@ApiOperation({ title: 'Register user Phone' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async registerMobileNumber(@Body() userData: UserCreateMobileDTO): Promise<CommonResponseModel> {
		try {
			const mobileNum = this.utilService.convertToNumber(userData.mobileNumber);
			if (mobileNum == 0) this.utilService.badRequest(ResponseMessage.REQUIRED_VALID_MOBILE_NUMBER);

			if (userData.email) {
				const isEmail = await this.userService.getUserByEmail(userData.email);
				if (isEmail) this.utilService.badRequest(ResponseMessage.USER_EMAIL_ALREADY_EXIST);
			}

			const checkUser = await this.userService.findUserByMobile(userData.mobileNumber);
			if (checkUser && checkUser.mobileNumber == userData.mobileNumber) this.utilService.badRequest(ResponseMessage.USER_MOBILE_ALREADY_EXIST);

			userData.role = UserRoles.USER;
			const randomNumber = (Math.floor(900000 * Math.random()) + 100000).toString();
			userData.otp = randomNumber;
			const user = await this.userService.createUser(userData);
			let mobileNumber = user.countryCode ? user.countryCode + user.mobileNumber : process.env.COUNTRY_CODE + user.mobileNumber;
			if (user) {
				if (process.env.USE_SENDINBLUE_OTP === 'true') {
					let isSent = await this.otpService.sendOTP(mobileNumber, userData.otp.toString());
					console.log("-----isSent------", isSent);
					if (isSent.isError == true) this.utilService.badRequest(ResponseMessage.UNABLE_TO_SEND_OTP);
					else return this.utilService.successResponseMsg(ResponseMessage.VERIFICATION_SENT_TO_MOBILE_NUMBER);
				}
				else {
					let isSent = await this.otpService.sendOTP(mobileNumber);
					if (isSent.isError == true) this.utilService.badRequest(ResponseMessage.UNABLE_TO_SEND_OTP);
					else {
						let message = await this.utilService.getTranslatedMessageByKey(ResponseMessage.VERIFICATION_SENT_TO_MOBILE_NUMBER);
						return this.utilService.successResponseData(message, { sId: isSent.data });
					}
				}
			}
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/verify-otp/number')
	@ApiOperation({ title: 'Verify OTP sent to Phone' })
	@ApiResponse({ status: 200, description: 'Return verified detail', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	public async verifyOTPTwilio(@Body() otpData: OTPVerifyDTO): Promise<CommonResponseModel> {
		try {
			if (process.env.USE_SENDINBLUE_OTP === 'true') {
				var criteria = (otpData.mobileNumber.indexOf('@') === -1) ? { mobileNumber: otpData.mobileNumber } : { email: otpData.mobileNumber };
				if (Number(criteria.mobileNumber) == 0) this.utilService.badRequest(ResponseMessage.REQUIRED_VALID_MOBILE_NUMBER);
				let user;
				if (criteria.mobileNumber) user = await this.userService.findUserByMobile(criteria.mobileNumber);
				else user = await this.userService.getUserByEmail(criteria.email);
				if (!user) this.utilService.badRequest(ResponseMessage.USER_NOT_FOUND);
				if (user.otp.toString() == otpData.otp) {
					const otpVerified = await this.userService.setMobileVerified(user.mobileNumber);
					const otpVerificationId = await this.utilService.getUUID();
					const isVerified = await this.userService.setOTPVerification(otpVerified._id, otpVerificationId);
					if (otpVerified && isVerified) {
						let message = await this.utilService.getTranslatedMessageByKey(ResponseMessage.MOBILE_NUMBER_SUCCESSFULLY_VERIFIED);
						return this.utilService.successResponseData(message, { verificationToken: otpVerificationId });
					}
				}
				else this.utilService.badRequest(ResponseMessage.WRONG_OTP);
			} else {

				let verified = await this.otpService.verifyOTP(otpData.otp, otpData.sId);
				if (verified.isError == true) this.utilService.badRequest(ResponseMessage.WRONG_OTP);
				var criteria = (otpData.mobileNumber.indexOf('@') === -1) ? { mobileNumber: otpData.mobileNumber } : { email: otpData.mobileNumber };
				if (Number(criteria.mobileNumber) == 0) this.utilService.badRequest(ResponseMessage.REQUIRED_VALID_MOBILE_NUMBER);
				let user;
				if (criteria.mobileNumber) user = await this.userService.findUserByMobile(criteria.mobileNumber);
				else user = await this.userService.getUserByEmail(criteria.email);

				if (!user) this.utilService.badRequest(ResponseMessage.USER_NOT_FOUND);

				let userVerified = await this.userService.setMobileVerified(user.mobileNumber);
				const userForToken = await this.userService.findUserByMobile(user.mobileNumber);
				const otpVerificationId = await this.utilService.getUUID();
				const isVerified = await this.userService.setOTPVerification(userForToken._id, otpVerificationId);
				if (userVerified && isVerified) {
					let message = await this.utilService.getTranslatedMessageByKey(ResponseMessage.MOBILE_NUMBER_SUCCESSFULLY_VERIFIED);
					return this.utilService.successResponseData(message, { verificationToken: otpVerificationId });
				}
			}
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/send-otp-phone')
	@ApiOperation({ title: 'Send OTP to Phone' })
	@ApiResponse({ status: 200, description: 'Return verified detail', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	public async sendOTPTwilio(@Body() credentials: OTPSendDTO): Promise<CommonResponseModel> {
		try {

			var criteria = (credentials.mobileNumber.indexOf('@') === -1) ? { mobileNumber: credentials.mobileNumber } : { email: credentials.mobileNumber };
			if (Number(criteria.mobileNumber) == 0) this.utilService.badRequest(ResponseMessage.REQUIRED_VALID_MOBILE_NUMBER);
			let user;
			if (criteria.mobileNumber) user = await this.userService.findUserByMobile(criteria.mobileNumber);
			else user = await this.userService.getUserByEmail(criteria.email);

			if (!user) this.utilService.badRequest(ResponseMessage.USER_NOT_FOUND);

			let mobileNumber = user.countryCode ? user.countryCode + user.mobileNumber : process.env.COUNTRY_CODE + user.mobileNumber;
			if (process.env.USE_SENDINBLUE_OTP === 'true') {
				const randomNumber = (Math.floor(900000 * Math.random()) + 100000).toString();
				user.otp = randomNumber;
				const updateOtp = await this.userService.setMobileOTP(user.mobileNumber, user.otp.toString())
				let isSent = await this.otpService.sendOTP(mobileNumber, user.otp.toString());
				if (isSent.isError == true) this.utilService.badRequest(ResponseMessage.UNABLE_TO_SEND_OTP);
				else return this.utilService.successResponseMsg(ResponseMessage.OTP_SENT_TO_REGISTERED_MOBILE_NUMBER);
			}
			else {
				let isSent = await this.otpService.sendOTP(mobileNumber, user.otp.toString());
				if (isSent.isError == true) this.utilService.badRequest(ResponseMessage.UNABLE_TO_SEND_OTP);
				else {
					let message = await this.utilService.getTranslatedMessageByKey(ResponseMessage.OTP_SENT_TO_REGISTERED_MOBILE_NUMBER);
					return this.utilService.successResponseData(message, { sId: isSent.data });
				}
			}
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/login-phone')
	@ApiOperation({ title: 'Login with email or mobile number' })
	@ApiResponse({ status: 200, description: 'Return verified detail', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 205, description: 'Mobile Number is not Verified', type: ResponseBadRequestMessage })
	public async loginPhone(@Body() credentials: LogInMobileDTO): Promise<CommonResponseModel> {
		try {
			var criteria = (credentials.userName.indexOf('@') === -1) ? { mobileNumber: credentials.userName } : { email: credentials.userName };
			if (Number(criteria.mobileNumber) == 0) this.utilService.badRequest(ResponseMessage.REQUIRED_VALID_MOBILE_NUMBER);
			let user;
			if (criteria.mobileNumber) user = await this.userService.findUserByMobile(criteria.mobileNumber);
			else user = await this.userService.getUserByEmail(criteria.email)

			if (!user) this.utilService.badRequest(ResponseMessage.USER_NOT_FOUND);

			if (!user.mobileNumberVerified) return this.utilService.resetContentResponseMsg(ResponseMessage.MOBILE_NUMBER_NOT_VERIFIED);

			if (!user.status) this.utilService.badRequest(ResponseMessage.USER_ACCOUNT_BLOCKED);

			const isValid = await this.authService.verifyPassword(credentials.password, user.password);
			if (!isValid) this.utilService.badRequest(ResponseMessage.USER_PASSWORD_INVALID);

			await this.userService.updatePlayerId(user._id, credentials.playerId);
			const token = await this.authService.generateAccessToken(user._id, user.role);
			return this.utilService.successResponseData({ token: token, role: user.role, id: user._id, language: user.language, isSuperAdmin: user.isSuperAdmin });

		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/reset-password-number')
	@ApiOperation({ title: 'Reset password (Number)' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async resetPasswordNumber(@Body() passwordData: ResetNumberPasswordDTO): Promise<CommonResponseModel> {
		try {
			const number = this.utilService.convertToNumber(passwordData.mobileNumber);

			if (number == 0) this.utilService.badRequest(ResponseMessage.REQUIRED_VALID_MOBILE_NUMBER);

			const user = await this.userService.findUserByMobile(passwordData.mobileNumber);

			if (!user) this.utilService.badRequest(ResponseMessage.USER_NOT_FOUND);

			if (user.otpVerificationId !== passwordData.verificationToken) this.utilService.badRequest(ResponseMessage.USER_RESET_PASSWORD_INVALID_TOKEN);
			const { salt, hashedPassword } = await this.authService.hashPassword(passwordData.newPassword);

			const newPaswword = await this.userService.updatePassword(user._id, salt, hashedPassword);
			if (newPaswword) return this.utilService.successResponseMsg(ResponseMessage.USER_PASSWORD_CHANGED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/update/mobile-verify')
	@ApiOperation({ title: 'Send otp for mobile number updation' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateMobileVerify(@GetUser() user: UsersDTO, @Body() userInfo: OTPSendDTO): Promise<CommonResponseModel> {
		try {
			if (userInfo.mobileNumber) {
				const mobileNumber = this.utilService.convertToNumber(userInfo.mobileNumber);
				if (mobileNumber == 0) this.utilService.badRequest(ResponseMessage.REQUIRED_VALID_MOBILE_NUMBER);
				if (user.mobileNumber != userInfo.mobileNumber) {
					const checkUser = await this.userService.findUserByMobile(userInfo.mobileNumber);
					if (checkUser) this.utilService.badRequest(ResponseMessage.USER_MOBILE_ALREADY_EXIST);
				} else {
					this.utilService.badRequest(ResponseMessage.USER_MOBILE_SAME);
				}
			}
			const randomNumber = (Math.floor(900000 * Math.random()) + 100000).toString();
			user.otp = randomNumber;
			user.newMobileNumber = userInfo.mobileNumber;
			let mobileNumber = user.countryCode ? user.countryCode + user.newMobileNumber : process.env.COUNTRY_CODE + user.newMobileNumber;

			const updateOtp = await this.userService.setMobileOTP(user.mobileNumber, user.otp.toString(), user.newMobileNumber)
			if (process.env.USE_SENDINBLUE_OTP === 'true') {
				let isSent = await this.otpService.sendOTP(mobileNumber, user.otp.toString());
				if (isSent.isError == true) this.utilService.badRequest(ResponseMessage.UNABLE_TO_SEND_OTP);
				else return this.utilService.successResponseMsg(ResponseMessage.OTP_SENT_TO_NEW_MOBILE_NUMBER);
			}
			else {
				let isSent = await this.otpService.sendOTP(mobileNumber, user.otp.toString());
				if (isSent.isError == true) this.utilService.badRequest(ResponseMessage.UNABLE_TO_SEND_OTP);
				else {
					let message = await this.utilService.getTranslatedMessageByKey(ResponseMessage.OTP_SENT_TO_NEW_MOBILE_NUMBER);
					return this.utilService.successResponseData(message, { sId: isSent.data });
				}
			}
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/update/mobile')
	@ApiOperation({ title: 'Update mobile number' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateMobile(@GetUser() user: UsersDTO, @Body() otpData: OTPVerifyDTO): Promise<CommonResponseModel> {
		try {
			if (process.env.USE_SENDINBLUE_OTP === 'true') {
				if (user.otp.toString() !== otpData.otp) this.utilService.badRequest(ResponseMessage.WRONG_OTP);
			} else {
				let verified = await this.otpService.verifyOTP(otpData.otp, otpData.sId);
				if (verified.isError == true) this.utilService.badRequest(ResponseMessage.WRONG_OTP);
			}
			const updatedData = await this.userService.updateMobileNumber(user._id, user.newMobileNumber);
			if (updatedData) return this.utilService.successResponseMsg(ResponseMessage.MOBILE_NUMBER_UPDATED_SUCCESSFULLY);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
	/* ################################################### SUPER-ADMIN ################################## */
	@Post('super-admin/create/admin')
	@ApiOperation({ title: 'Register Admin' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async registerNewAdmin(@GetUser() user: UsersDTO, @Body() userData: UserCreateDTO): Promise<CommonResponseModel> {
		this.utilService.validateSuperAdminRole(user);
		try {
			const mobileNum = this.utilService.convertToNumber(userData.mobileNumber);
			if (mobileNum == 0) this.utilService.badRequest(ResponseMessage.REQUIRED_VALID_MOBILE_NUMBER);

			if (userData.email) {
				const isEmail = await this.userService.getUserByEmail(userData.email);
				if (isEmail) this.utilService.badRequest(ResponseMessage.USER_EMAIL_ALREADY_EXIST);
			}

			const checkUser = await this.userService.findUserByMobile(userData.mobileNumber);
			if (checkUser && checkUser.mobileNumber == userData.mobileNumber) this.utilService.badRequest(ResponseMessage.USER_MOBILE_ALREADY_EXIST);
			userData.role = UserRoles.ADMIN;
			userData.emailVerified = true;
			userData.mobileNumberVerified = true;
			const user = await this.userService.createUser(userData);
			if (user) return this.utilService.successResponseMsg(ResponseMessage.ADMIN_CREATED);
			// if (user) {
			// 	const emailRes = await this.emailService.sendEmailForVerification(user.firstName, user.email, user.emailVerificationId);
			// 	if (emailRes) return this.utilService.successResponseMsg(ResponseMessage.USER_EMAIL_VERIFY_SENT);
			// 	else this.utilService.badRequest(ResponseMessage.USER_EMAIL_VERIFY_NOT_SENT);
			// }
			// else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
	//admin delete
	@Delete('/super-admin/delete/:userId')
	@ApiOperation({ title: 'Delete admin by superAdmin by userid' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async deleteAdmin(@GetUser() user: UsersDTO, @Param('userId') userId: string): Promise<CommonResponseModel> {
		this.utilService.validateSuperAdminRole(user);
		try {
			const userExist = await this.userService.getUserById(userId);
			if (!userExist) this.utilService.badRequest(ResponseMessage.ADMIN_NOT_FOUND);

			if (userExist.role !== UserRoles.ADMIN) this.utilService.badRequest(ResponseMessage.ADMIN_ROLE_MUST);
			const user = await this.userService.deleteUserById(userId);
			if (user) return this.utilService.successResponseMsg(ResponseMessage.ADMIN_DELETED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/super-admin/status-update/:userId')
	@ApiOperation({ title: 'Update Admin status by userId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateAdminStatus(@GetUser() user: UsersDTO, @Param('userId') userId: string, @Body() userStatusData: UserStatusDTO): Promise<CommonResponseModel> {
		this.utilService.validateSuperAdminRole(user);
		try {
			const userExist = await this.userService.getUserById(userId);
			if (!userExist) this.utilService.badRequest(ResponseMessage.ADMIN_NOT_FOUND);

			if (userExist.role !== UserRoles.ADMIN) this.utilService.badRequest(ResponseMessage.ADMIN_ROLE_MUST)

			const userStatus = await this.userService.updateUserStatus(userId, userStatusData);
			if (userStatus) return this.utilService.successResponseMsg(ResponseMessage.ADMIN_STATUS_UPDATED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/super-admin/list-admin')
	@ApiOperation({ title: 'Get all admins' })
	@ApiImplicitQuery({ name: "page", description: "page", required: false, type: Number })
	@ApiImplicitQuery({ name: "limit", description: "limit", required: false, type: Number })
	@ApiImplicitQuery({ name: "q", description: "search according to first Name", required: false, type: String })
	@ApiResponse({ status: 200, description: 'Return list of admins', type: ResponseAdminUserList })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAllAdminList(@GetUser() user: UsersDTO, @Query() adminQuery: AdminQuery): Promise<CommonResponseModel> {
		this.utilService.validateSuperAdminRole(user);
		try {
			let pagination = this.utilService.getAdminPagination(adminQuery);
			const admins = await Promise.all([
				this.userService.getAllAdmin(pagination.page - 1, pagination.limit, pagination.q),
				this.userService.countAllAdmin(pagination.q)
			])
			return this.utilService.successResponseData(admins[0], { total: admins[1] });
		} catch (e) {
			this.utilService.errorResponse(e)
		}
	}

	//user delete
	@Delete('/admin/delete/:userId')
	@ApiOperation({ title: 'Delete admin by superAdmin by userid' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async deleteUser(@GetUser() user: UsersDTO, @Param('userId') userId: string): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const userExist = await this.userService.getUserById(userId);
			if (!userExist) this.utilService.badRequest(ResponseMessage.ADMIN_NOT_FOUND);
			const checkOrderToUser = await this.orderService.getAllOrderForUserSection(userExist._id, null, null);
			if (checkOrderToUser.length > 0) this.utilService.badRequest(ResponseMessage.CANT_DELETED_THIS_USER)

			const user = await this.userService.deleteUserById(userId);
			if (user) return this.utilService.successResponseMsg(ResponseMessage.USER_DELETED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}


}
