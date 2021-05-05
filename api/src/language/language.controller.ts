import { Controller, Query, Body, Post, Put, Param, Get, UseGuards, Delete } from '@nestjs/common';
import { LanguageService } from './language.service';
import { LanguageDTO, LanguageStatusUpdateDTO, ResponseFavouritesDTO, ResponseLanguageDetails, ResponseLanguageCMSDetailsDTO } from './language.model';
import { UsersDTO } from '../users/users.model';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiUseTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UtilService } from '../utils/util.service';
import { ResponseMessage, LanguageJsonType, CommonResponseModel, ResponseErrorMessage, ResponseSuccessMessage, ResponseBadRequestMessage } from '../utils/app.model';
import { GetUser } from '../utils/jwt.strategy';

@Controller('languages')
@ApiUseTags('Languages')
export class LanguageController {
	constructor(
		private languageService: LanguageService,
		private utilService: UtilService
	) {
	}

	// #################################################### USER ##########################################
	@Get('/list')
	@ApiOperation({ title: 'Get all enabled languages for user' })
	@ApiResponse({ status: 200, description: 'Return list of enabled languges', type: ResponseFavouritesDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async getLanguageListForUser(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		try {
			const languages = await this.languageService.getAllLanguageForUser();
			return this.utilService.successResponseData(languages);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	// #################################################### ADMIN ##########################################
	@Get('/admin/list')
	@ApiOperation({ title: 'Get all languages for user' })
	@ApiResponse({ status: 200, description: 'Return list of languges', type: ResponseFavouritesDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getLanguageList(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const languages = await this.languageService.getAllLanguage();
			return this.utilService.successResponseData(languages);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Post('/admin/create')
	@ApiOperation({ title: 'Create new language' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async createLanguage(@GetUser() user: UsersDTO, @Body() languageData: LanguageDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let validatedRes;
			languageData = await this.languageService.parseJson(languageData);
			let languageExist = await this.languageService.checkExistLanguage(languageData.languageCode);
			if (languageExist) this.utilService.badRequest(ResponseMessage.LANGUAGE_ALREADY_EXIST);

			let validateKeys = await this.languageService.getLanguageByCode("en");
			if (validateKeys) {
				let resMsg = await this.utilService.getTranslatedMessageByKey(ResponseMessage.LANGUAGE_VALIDATED);

				validatedRes = await this.languageService.validateJson(validateKeys, languageData, "backendJson");
				if (!validatedRes.isValid) this.utilService.badRequest(`${validatedRes.message} ${resMsg}`);

				validatedRes = await this.languageService.validateJson(validateKeys, languageData, "deliveyAppJson");
				if (!validatedRes.isValid) this.utilService.badRequest(`${validatedRes.message} ${resMsg}`);

				validatedRes = await this.languageService.validateJson(validateKeys, languageData, "webJson");
				if (!validatedRes.isValid) this.utilService.badRequest(`${validatedRes.message} ${resMsg}`);

				validatedRes = await this.languageService.validateJson(validateKeys, languageData, "mobAppJson");
				if (!validatedRes.isValid) this.utilService.badRequest(`${validatedRes.message} ${resMsg}`);

				validatedRes = await this.languageService.validateJson(validateKeys, languageData, "cmsJson");
				if (!validatedRes.isValid) this.utilService.badRequest(`${validatedRes.message} ${resMsg}`);

				const language = await this.languageService.createLanguage(languageData);
				if (language) {
					this.languageService.getLanguageForBackend().then(data => this.utilService.setLanguageList(data));
					return this.utilService.successResponseMsg(ResponseMessage.LANGUAGE_SAVED);
				}
				else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
			}
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}


	@Put('/admin/update/:languageId')
	@ApiOperation({ title: 'Update language by languaeId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updateLanguage(@GetUser() user: UsersDTO, @Param('languageId') languageId: string, @Body() languageData: LanguageDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			let validatedRes;
			languageData = await this.languageService.parseJson(languageData);
			if (languageData.languageCode == "en") {
				const language = await this.languageService.updateLanguage(languageId, languageData);
				if (language) {
					this.languageService.addKeyToOtherLanguage(language);
					this.languageService.getLanguageForBackend().then(data => this.utilService.setLanguageList(data));
					return this.utilService.successResponseMsg(ResponseMessage.LANGUAGE_UPDATED);
				}
				else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
			} else {
				let validateKeys = await this.languageService.getLanguageByCode("en");
				if (validateKeys) {
					let resMsg = await this.utilService.getTranslatedMessageByKey(ResponseMessage.LANGUAGE_VALIDATED);

					validatedRes = await this.languageService.validateJson(validateKeys, languageData, "backendJson");
					if (!validatedRes.isValid) this.utilService.badRequest(`${validatedRes.message} ${resMsg}`);

					validatedRes = await this.languageService.validateJson(validateKeys, languageData, "deliveyAppJson");
					if (!validatedRes.isValid) this.utilService.badRequest(`${validatedRes.message} ${resMsg}`);

					validatedRes = await this.languageService.validateJson(validateKeys, languageData, "webJson");
					if (!validatedRes.isValid) this.utilService.badRequest(`${validatedRes.message} ${resMsg}`);

					validatedRes = await this.languageService.validateJson(validateKeys, languageData, "mobAppJson");
					if (!validatedRes.isValid) this.utilService.badRequest(`${validatedRes.message} ${resMsg}`);

					validatedRes = await this.languageService.validateJson(validateKeys, languageData, "cmsJson");
					if (!validatedRes.isValid) this.utilService.badRequest(`${validatedRes.message} ${resMsg}`);

					const language = await this.languageService.updateLanguage(languageId, languageData);
					if (language) {
						this.languageService.getLanguageForBackend().then(data => this.utilService.setLanguageList(data));
						return this.utilService.successResponseMsg(ResponseMessage.LANGUAGE_UPDATED);
					}
					else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
				}
				else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
			}
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Delete('/admin/delete/:languageId')
	@ApiOperation({ title: 'Delete language by languaeId' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async DeleteLanguage(@GetUser() user: UsersDTO, @Param('languageId') languageId: string): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const languageExist = await this.languageService.getLanguageById(languageId);
			if (!languageExist) this.utilService.badRequest(ResponseMessage.LANGUAGE_NOT_FOUND);

			if(languageExist && languageExist.isDefault) this.utilService.badRequest(ResponseMessage.DEFAULT_LANGUAGE_NOT_DELETED);

			const language = await this.languageService.deleteLanguage(languageId);
			if (language) return this.utilService.successResponseMsg(ResponseMessage.LANGUAGE_DELETED);
			else this.utilService.badRequest(ResponseMessage.SOMETHING_WENT_WRONG);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/detail/:languageId')
	@ApiOperation({ title: 'Get language detail by languageId' })
	@ApiResponse({ status: 200, description: 'Return language detail by languageId', type: ResponseLanguageDetails })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getLanguageDetail(@GetUser() user: UsersDTO, @Param('languageId') languageId: string): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const language = await this.languageService.getLanguageById(languageId);
			if (language) return this.utilService.successResponseData(language);
			else this.utilService.badRequest(ResponseMessage.LANGUAGE_NOT_FOUND);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/default/:languageId')
	@ApiOperation({ title: 'Set default language' })
	@ApiResponse({ status: 200, description: 'Return language detail by languageId' })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async setDefaultLanguage(@GetUser() user: UsersDTO, @Param('languageId') languageId: string): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const language = await this.languageService.setDefaultLanguage(languageId);
			if (language) return this.utilService.successResponseMsg(ResponseMessage.LANGUAGE_DEFAULT_UPDATED);
			else this.utilService.badRequest(ResponseMessage.LANGUAGE_NOT_FOUND);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/status-update/:languageId')
	@ApiOperation({ title: 'Update status of language' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async statusUpdate(@GetUser() user: UsersDTO, @Param('languageId') languageId: string, @Body() languageStatusUpdateDTO: LanguageStatusUpdateDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const language = await this.languageService.languageStatusUpdate(languageId, languageStatusUpdateDTO);
			if (language) return this.utilService.successResponseMsg(ResponseMessage.LANGUAGE_STATUS_UPDATED);
			else this.utilService.badRequest(ResponseMessage.LANGUAGE_NOT_FOUND);
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/cms')
	@ApiOperation({ title: 'Get language for cms' })
	@ApiResponse({ status: 200, description: 'Return list', type: ResponseLanguageCMSDetailsDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async getLanguageCms(@Query() query): Promise<CommonResponseModel> {
		try {
			let language, code = query.code, languageData = {};
			if (code) language = await this.languageService.getLanguageByCode(code);
			else language = await this.languageService.getDefaultLanguage();

			if (language) {
				languageData[language['languageCode']] = language[LanguageJsonType.CMS];
				return this.utilService.successResponseData(languageData);
			} else {
				language = await this.languageService.getDefaultLanguage();
				languageData[language['languageCode']] = language[LanguageJsonType.CMS];
				return this.utilService.successResponseData(languageData);
			}
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/web')
	@ApiOperation({ title: 'Get language for web' })
	@ApiResponse({ status: 200, description: 'Return list', type: ResponseLanguageCMSDetailsDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async getLanguageWeb(@Query() query): Promise<CommonResponseModel> {
		try {
			let language, code = query.code, languageData = {};
			if (code) language = await this.languageService.getLanguageByCode(code);
			else language = await this.languageService.getDefaultLanguage();

			if (language) {
				languageData[language['languageCode']] = language[LanguageJsonType.WEB];
				return this.utilService.successResponseData(languageData);
			} else {
				language = await this.languageService.getDefaultLanguage();
				languageData[language['languageCode']] = language[LanguageJsonType.WEB];
				return this.utilService.successResponseData(languageData);
			}
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/user')
	@ApiOperation({ title: 'Get language for user app' })
	@ApiResponse({ status: 200, description: 'Return list', type: ResponseLanguageCMSDetailsDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async getLanguageUser(@Query() query): Promise<CommonResponseModel> {
		try {
			let language, code = query.code, languageData = {};
			if (code) language = await this.languageService.getLanguageByCode(code);
			else language = await this.languageService.getDefaultLanguage();

			if (language) {
				languageData[language['languageCode']] = language[LanguageJsonType.USER];
				return this.utilService.successResponseData({ json: languageData, languageCode: language.languageCode });
			} else {
				language = await this.languageService.getDefaultLanguage();
				languageData[language['languageCode']] = language[LanguageJsonType.USER];
				return this.utilService.successResponseData({ json: languageData, languageCode: language.languageCode });
			}
		} catch (e) {

			this.utilService.errorResponse(e);
		}
	}

	@Get('/delivery')
	@ApiOperation({ title: 'Get language for delivery app' })
	@ApiResponse({ status: 200, description: 'Return list', type: ResponseLanguageCMSDetailsDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async getLanguageDelivey(@Query() query): Promise<CommonResponseModel> {
		try {
			let language, code = query.code, languageData = {};
			if (code) language = await this.languageService.getLanguageByCode(code);
			else language = await this.languageService.getDefaultLanguage();

			if (language) {
				languageData[language['languageCode']] = language[LanguageJsonType.DELIVERY];
				return this.utilService.successResponseData({ json: languageData, languageCode: language.languageCode });
			} else {
				language = await this.languageService.getDefaultLanguage();
				languageData[language['languageCode']] = language[LanguageJsonType.DELIVERY];
				return this.utilService.successResponseData({ json: languageData, languageCode: language.languageCode });
			}
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
}
