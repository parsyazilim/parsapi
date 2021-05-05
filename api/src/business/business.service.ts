import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BusinessDTO, BusinessAdminDTO, BusinessSaveDTO } from './business.model';

@Injectable()
export class BusinessService {
	constructor(
		@InjectModel('Business') private readonly businessModel: Model<any>
	) {
	}

	// #################################################### USER ##########################################
	// Get Buisness detail for user
	public async getBussinessDetailForUser(): Promise<BusinessDTO> {
		return await this.businessModel.findOne({});
	}

	// #################################################### ADMIN ##########################################
	// Get Business detail admin
	public async getBusinessDetail(): Promise<BusinessAdminDTO> {
		return await this.businessModel.findOne({});
	}

	// Update business detail admin
	public async updateBusiness(businessData: BusinessSaveDTO): Promise<BusinessAdminDTO> {
		return await this.businessModel.updateOne({}, businessData, { new: true });
	}
}
