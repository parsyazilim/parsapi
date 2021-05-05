import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PageSaveDTO, PageDTO, PageType } from './pages.model';

@Injectable()
export class PageService {
	constructor(
		@InjectModel('Page') private readonly pageModel: Model<any>
	) {
	}

	public async getPage(pageType: string): Promise<PageDTO> {
		const filter = { status: true, pageType: pageType };
		const page = await this.pageModel.findOne(filter, '-_id title description');
		return page;
	}

	public async getPageForAdmin(pageType: string): Promise<PageDTO> {
		const filter = { pageType: pageType };
		const page = await this.pageModel.findOne(filter, '-_id title description status');
		return page;
	}

	public async updatePage(pageType: string, pageData: PageSaveDTO): Promise<PageDTO> {
		const page = await this.pageModel.updateOne({ pageType: pageData.pageType }, { title: pageData.title, description: pageData.description });
		return page;
	}
}
