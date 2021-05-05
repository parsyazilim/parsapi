import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SettingDTO, UpdateCurrencyDTO, SettingCurrencyAndLanguageListDTO, SettingWorkingHoursDTO, SettingCurrencyAndLanguageCodeDTO, SettingCurrencyAndLanguageDTO, WorkingHoursDTO, DeliveryTaxSaveDTO } from './settings.model';
import { UtilService } from '../utils/util.service';


@Injectable()
export class SettingService {
	constructor(
		@InjectModel('Setting') private readonly settingModel: Model<any>,
		private utilService: UtilService
	) { }

	/************************* USER ********************************/
	public async getSettingsForUser(): Promise<DeliveryTaxSaveDTO> {
		const deliveryTax = await this.settingModel.findOne({}, '-_id minimumOrderAmountToPlaceOrder location paymentMethod currencySymbol currencyCode shippingMethod');
		return deliveryTax;
	}

	public async getDeliveryTimeSlots(): Promise<any> {
		let WorkingHourUpdateRes = await this.settingModel.findOne({}, 'deliveryTimeSlots');
		return WorkingHourUpdateRes;
	}
	/************************* ADMIN ********************************/
	public async getDeliveryTaxSettings(): Promise<any> {
		const deliveryTax = await this.settingModel.findOne({});
		return deliveryTax;
	}

	public async getCurrencyDetail(): Promise<UpdateCurrencyDTO> {
		let WorkingHourUpdateRes = await this.settingModel.findOne({}, 'currencySymbol currencyCode');
		return WorkingHourUpdateRes;
	}

	public async updateCurrency(updateCurrencyData: UpdateCurrencyDTO): Promise<UpdateCurrencyDTO> {
		let WorkingHourUpdateRes = await this.settingModel.update({}, updateCurrencyData);
		return WorkingHourUpdateRes;
	}

	public async updatDeliverySlot(deliverySlotData): Promise<SettingDTO> {
		let settingWorkingHourRes = await this.settingModel.update({}, { deliveryTimeSlots: deliverySlotData });
		return settingWorkingHourRes;
	}

	public async updateDeliveryTaxSettings(deliveryTaxData): Promise<any> {
		const deliveryTax = await this.settingModel.updateOne({}, deliveryTaxData, { new: true });
		return deliveryTax;
	}

	public dateFormat(i) {
		var date = new Date();
		date.setDate(date.getDate() + i);
		if (process.env.TIME_SLOT_FORMAT_24HR === 'false') {
			var arrayOfWeekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
			const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
			return arrayOfWeekdays[date.getDay()] + ' ' + date.getDate() + "-" + monthNames[date.getMonth()];
		}
		else {
			return date.getDate() + '/' + (date.getMonth() + 1) + "/" + date.getFullYear()
		}
	}

	public async getAvailableTimeSlot(deliveryTimeSlots): Promise<any> {
		var currentDate = new Date();
		const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes() + 30;

		let isNextDay = 0;
		if (currentMinutes > 1230) {
			currentDate.setDate(currentDate.getDate() + 1);
			isNextDay = 1;
		}

		let temp = deliveryTimeSlots;
		let slots = deliveryTimeSlots.slice(currentDate.getDay(), 7);
		slots = slots.concat(temp.slice(0, currentDate.getDay()))
		slots = JSON.parse(JSON.stringify(slots));
		if (isNextDay == 0) slots[0].timings = slots[0].timings.filter(s => s.closeTime > currentMinutes);

		slots = slots.map((s, i) => {
			s.timings = s.timings.filter(c => {
				delete c.openTime;
				delete c.closeTime;
				delete c.deliveryCount;
				return c.isOpen == true;
			});
			s.date = this.dateFormat(i + isNextDay);
			return s;
		});
		slots = slots.filter(s => {
			delete s.dayCode;
			return s.isOpen == true && s.timings.length > 0;
		});
		return slots;
	}

	// ************** WORKING HOURS ************** 

	//Get Working Hours
	public async getWorkingHour(): Promise<SettingWorkingHoursDTO> {
		let WorkingHourUpdateRes = await this.settingModel.findOne({}, 'workingHours startDeliveryFrom');
		return WorkingHourUpdateRes;
	}

	//Create Working Hours
	public async createWorkingHour(workingHours: Array<WorkingHoursDTO>): Promise<SettingWorkingHoursDTO> {
		const workingHourCreateRes = await this.settingModel.create({ workingHours: workingHours });
		return workingHourCreateRes;
	}

	//Update Working Hour
	public async updateWorkingHour(settingWorkingHours: SettingWorkingHoursDTO): Promise<SettingDTO> {
		let settingWorkingHourRes = await this.settingModel.findByIdAndUpdate(settingWorkingHours._id, settingWorkingHours)
		return settingWorkingHourRes;
	}

	//Get Currency and Language
	public async getCurrencyAndLanguage(): Promise<SettingCurrencyAndLanguageDTO> {
		const currencyLanguageRes = await this.settingModel.findOne({}, 'languageCode currencySymbol currencyCode');
		return currencyLanguageRes;
	}

	//Get Currency List and Language List
	public async getCurrencyAndLanguageList(): Promise<SettingCurrencyAndLanguageListDTO> {
		const currencyLanguageListRes = await this.settingModel.findOne({}, 'currencyList languageList');
		return currencyLanguageListRes;
	}

	//Get Currency Code and Language Code
	public async getCurrencyLanguageCode(): Promise<SettingCurrencyAndLanguageCodeDTO> {
		const currencyLanguageCodeRes = await this.settingModel.findOne({}, 'languageCode currencySymbol');
		return currencyLanguageCodeRes;
	}

	//Get Currency Code and Language Code
	public async getMaxWalletAmountUsed(): Promise<any> {
		const setting = await this.settingModel.findOne({}, 'maxWalletAmountUsed');
		return setting.maxWalletAmountUsed;
	}

	
}
