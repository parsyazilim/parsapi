import { Controller, Get, UseGuards, Query, Put, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiUseTags, ApiResponse } from '@nestjs/swagger';


import { UsersDTO } from '../users/users.model';
import { PageService } from './pages.service';
import { PageDTO, PageSaveDTO, PageType, ResponsePageDTO, ResponseAdminPageDTO } from './pages.model';
import { UtilService } from '../utils/util.service';
import { UserRoles, ResponseMessage, CommonResponseModel, ResponseErrorMessage, ResponseSuccessMessage, ResponseBadRequestMessage } from '../utils/app.model';
import { GetUser } from '../utils/jwt.strategy';

@Controller('pages')
@ApiUseTags('Pages')
export class PageController {
	constructor(
		private pageService: PageService,
		private utilService: UtilService
	) {
	}

	// #################################################### USER ##########################################
	@Get('/about-us')
	@ApiOperation({ title: 'Get About us page for user' })
	@ApiResponse({ status: 200, description: 'Return about us page detail', type: ResponsePageDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async getAboutUs(): Promise<CommonResponseModel> {
		try {
			const page = await this.pageService.getPage(PageType.ABOUT_US);
			if (page) return this.utilService.successResponseData(page);
			else this.utilService.pageNotFound();
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/terms-and-conditions')
	@ApiOperation({ title: 'Get terms and conditions page for user' })
	@ApiResponse({ status: 200, description: 'Return terms and conditions page detail', type: ResponsePageDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async getTermsConditions(): Promise<CommonResponseModel> {
		try {
			const page = await this.pageService.getPage(PageType.TERMS_AND_CONDITIONS);
			if (page) return this.utilService.successResponseData(page);
			else this.utilService.pageNotFound();
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/privacy-policy')
	@ApiOperation({ title: 'Get privacy policy page for user' })
	@ApiResponse({ status: 200, description: 'Return privacy policy page detail', type: ResponsePageDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	public async getPrivacyPage(): Promise<CommonResponseModel> {
		try {
			const page = await this.pageService.getPage(PageType.PRIVACY_POLICY);
			if (page) return this.utilService.successResponseData(page);
			else this.utilService.pageNotFound();
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	// #################################################### ADMIN ##########################################
	@Get('/admin/about-us')
	@ApiOperation({ title: 'Get About us page' })
	@ApiResponse({ status: 200, description: 'Return about us page detail', type: ResponseAdminPageDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getAboutUsForAdmin(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		try {
			this.utilService.validateAdminRole(user);
			const page = await this.pageService.getPageForAdmin(PageType.ABOUT_US);
			if (page) return this.utilService.successResponseData(page);
			else this.utilService.pageNotFound();
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/terms-and-conditions')
	@ApiOperation({ title: 'Get terms and conditions page' })
	@ApiResponse({ status: 200, description: 'Return terms and conditions page detail', type: ResponseAdminPageDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getTermsConditionsForAdmin(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		try {
			this.utilService.validateAdminRole(user);
			const page = await this.pageService.getPageForAdmin(PageType.TERMS_AND_CONDITIONS);
			if (page) return this.utilService.successResponseData(page);
			else this.utilService.pageNotFound();
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Get('/admin/privacy-policy')
	@ApiOperation({ title: 'Get privacy policy page' })
	@ApiResponse({ status: 200, description: 'Return privacy policy page detail', type: ResponseAdminPageDTO })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async getPrivacyPageForAdmin(@GetUser() user: UsersDTO): Promise<CommonResponseModel> {
		try {
			this.utilService.validateAdminRole(user);
			const page = await this.pageService.getPageForAdmin(PageType.PRIVACY_POLICY);
			if (page) return this.utilService.successResponseData(page);
			else this.utilService.pageNotFound();
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}

	@Put('/admin/update')
	@ApiOperation({ title: 'Update page' })
	@ApiResponse({ status: 200, description: 'Success message', type: ResponseSuccessMessage })
	@ApiResponse({ status: 400, description: 'Bad request message', type: ResponseBadRequestMessage })
	@ApiResponse({ status: 404, description: 'Unauthorized or Not found', type: ResponseErrorMessage })
	@UseGuards(AuthGuard('jwt'))
	@ApiBearerAuth()
	public async updatePage(@GetUser() user: UsersDTO, @Body() pageData: PageSaveDTO): Promise<CommonResponseModel> {
		this.utilService.validateAdminRole(user);
		try {
			const page = await this.pageService.updatePage(pageData.pageType, pageData);
			if (page) return this.utilService.successResponseMsg(ResponseMessage.PAGE_UPADTED);
			else this.utilService.pageNotFound();
		} catch (e) {
			this.utilService.errorResponse(e);
		}
	}
}
