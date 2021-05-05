import { Injectable, } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
	UserCreateDTO,
	UsersDTO,
	UsersUpdateDTO,
	UserStatusDTO,
	AdminUserDTO,
	AdminDTO,
	AdminDeliveryDTO,
	ExportedFileDTO,
} from './users.model';
import { UserRoles } from '../utils/app.model';
import { AuthService } from '../utils/auth.service';

import { UtilService } from '../utils/util.service';

@Injectable()
export class UserService {
	constructor(
		@InjectModel('User') private readonly userModel: Model<any>,
		private authService: AuthService,
		private utilService: UtilService,
	) {

	}

	public async createUser(userData: AdminDeliveryDTO): Promise<UsersDTO> {
		if (userData.email) userData.email = userData.email.toLowerCase();
		const { salt, hashedPassword } = await this.authService.hashPassword(userData.password);
		userData.salt = salt;
		userData.password = hashedPassword;

		userData.emailVerificationId = await this.utilService.getUUID();
		userData.emailVerificationExpiry = await this.utilService.getXminutesAheadTime(120);

		const user = await this.userModel.create(userData);
		return user;
	}

	public async regenerateVerificationCode(userId: string): Promise<UsersDTO> {
		const emailVerificationId = await this.utilService.getUUID();
		const emailVerificationExpiry = await this.utilService.getXminutesAheadTime(120);

		const user = await this.userModel.findOneAndUpdate({ _id: userId }, { emailVerificationId: emailVerificationId, emailVerificationExpiry: emailVerificationExpiry }, { new: true });
		return user;
	}

	public async getUserByEmail(email: String): Promise<UsersDTO> {
		const user = await this.userModel.findOne({ email: email });
		return user;
	}

	public async updatePlayerId(userId: string, playerId: String): Promise<UsersDTO> {
		const user = await this.userModel.updateOne({ _id: userId }, { playerId: playerId });
		return user;
	}

	public async getUserInfo(userId: string): Promise<UsersDTO> {
		const user = await this.userModel.findById(userId, 'firstName lastName email imageUrl imageId filePath mobileNumber countryCode countryName language walletAmount orderDelivered');
		return user;
	}

	public async getExportedFileInfo(userId: string): Promise<ExportedFileDTO> {
		const user = await this.userModel.findById(userId, 'productExportedFile');
		return user;
	}

	public async updateMyInfo(userId: string, userData: UsersUpdateDTO): Promise<UsersDTO> {
		const user = await this.userModel.findByIdAndUpdate(userId, userData);
		return user;
	}

	public async updateOTP(userId: string, otp: number): Promise<UsersDTO> {
		const otpVerificationExpiry = await this.utilService.getXminutesAheadTime(10);
		const user = await this.userModel.findByIdAndUpdate(userId, { otp: otp, otpVerificationExpiry: otpVerificationExpiry });
		return user;
	}

	public async setOTPVerification(userId: string, otpVerificationId: string): Promise<UsersDTO> {
		const user = await this.userModel.findByIdAndUpdate(userId, { otpVerificationId: otpVerificationId });
		return user;
	}

	public async getAllUser(page: number, limit: number, search: string): Promise<Array<AdminUserDTO>> {
		const skip = page * limit;
		let filter = { role: UserRoles.USER };
		if (search) filter['firstName'] = { $regex: search, $options: 'i' }
		return await this.userModel.find(filter, 'firstName lastName email mobileNumber countryCode countryName emailVerified language status createdAt').limit(limit).skip(skip).lean() as any;
	}

	public async countAllUser(search: string): Promise<number> {
		let filter = { role: UserRoles.USER };
		if (search) filter['firstName'] = { $regex: search, $options: 'i' }
		return await this.userModel.countDocuments(filter);
	}

	public async getUserById(userId: String): Promise<UsersDTO> {
		const user = await this.userModel.findById(userId);
		return user;
	}

	public async updateUserStatus(userId: string, userStatusData: UserStatusDTO): Promise<UsersDTO> {
		const user = await this.userModel.findByIdAndUpdate(userId, userStatusData, { new: true });
		return user;
	}

	public async updatePassword(userId: string, salt: string, password: string): Promise<UsersDTO> {
		const user = await this.userModel.findByIdAndUpdate(userId, { salt: salt, password: password });
		return user;
	}

	public async setEmailVerified(userId: string): Promise<UsersDTO> {
		const user = await this.userModel.findByIdAndUpdate(userId, { emailVerified: true });
		return user;
	}

	public async setMobileVerified(mobileNumber: string): Promise<UsersDTO> {
		const user = await this.userModel.findOneAndUpdate({ mobileNumber: mobileNumber }, { mobileNumberVerified: true });
		return user;
	}

	public async setMobileOTP(mobileNumber: string, otp: string, newMobileNumber?: string): Promise<UsersDTO> {
		let updateData = { otp: otp };
		if (newMobileNumber) updateData['newMobileNumber'] = newMobileNumber;
		const user = await this.userModel.findOneAndUpdate({ mobileNumber: mobileNumber }, updateData);
		return user;
	}

	public async updateMobileNumber(userId: string, mobileNumber): Promise<any> {
		const user = await this.userModel.findByIdAndUpdate(userId, { mobileNumber: mobileNumber });
		return user;
	}
	public async findUserByEmailOrMobile(email: string, mobileNumber: string): Promise<UsersDTO> {
		if (email) email = email.toLowerCase();
		const user = await this.userModel.findOne({ $or: [{ email: email }, { mobileNumber: mobileNumber }] });
		return user;
	}

	public async findUserByMobile(mobileNumber: string): Promise<UsersDTO> {
		return await this.userModel.findOne({ mobileNumber: mobileNumber });
	}

	public async getAllDeliveryBoy(page: number, limit: number, search: string): Promise<Array<AdminUserDTO>> {
		const skip = page * limit;
		let filter = { role: UserRoles.DELIVERY_BOY };
		if (search) filter['firstName'] = { $regex: search, $options: 'i' }
		return await this.userModel.find(filter, 'firstName lastName email mobileNumber countryCode countryName emailVerified language status orderDelivered createdAt').limit(limit).skip(skip);
	}

	public async countAllDeliveryBoy(search: string): Promise<number> {
		let filter = { role: UserRoles.DELIVERY_BOY };
		if (search) filter['firstName'] = { $regex: search, $options: 'i' }
		const count = await this.userModel.countDocuments(filter);
		return count;
	}

	public async updateMyLanguage(userId: string, language: string): Promise<UsersDTO> {
		const user = await this.userModel.findByIdAndUpdate(userId, { language: language }, { new: true });
		return user;
	}

	public async updateWallet(userId: string, walletAmount: number): Promise<UsersDTO> {
		const user = await this.userModel.updateOne({ _id: userId }, { $inc: { walletAmount: walletAmount } });
		return user;
	}

	public async increaseOrderDelivered(userId: string): Promise<any> {
		return await this.userModel.updateOne({ _id: userId }, { $inc: { orderDelivered: 1 } });
	}

	public async increaseOrderPurchased(userId: string): Promise<any> {
		return await this.userModel.updateOne({ _id: userId }, { $inc: { orderPurchased: 1 } });
	}

	public async descreaseOrderPurchased(userId: string): Promise<any> {
		return await this.userModel.updateOne({ _id: userId }, { $inc: { orderPurchased: -1 } });
	}

	public async countUserByFilter(startDate, endDate): Promise<number> {
		startDate = startDate.setHours(0, 0, 0, 0);
		console.log("startDate", startDate);
		let filter = { role: UserRoles.USER, createdAt: { $gt: new Date(startDate), $lt: new Date(endDate) } };
		return await this.userModel.countDocuments(filter);
	}

	public async userGraph(startDate, endDate, type): Promise<any> {
		let query = { createdAt: { $gt: new Date(startDate), $lt: new Date(endDate) } }
		console.log("user Mode Graph query", query);
		let result;
		if (type === "DAILY") {
			result = await this.userModel.aggregate([
				{ $match: query },
				{
					$group: {
						_id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, date: { $dayOfMonth: '$createdAt' } },
						count: { $sum: 1 }
					}
				}
			]);
		} else {
			result = await this.userModel.aggregate([
				{ $match: query },
				{
					$group: {
						_id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
						count: { $sum: 1 }
					}
				}
			]);
		}

		return result;
	}

	public async deleteUserById(userId: String): Promise<UsersDTO> {
		const user = await this.userModel.findByIdAndRemove(userId);
		return user;
	}

	public async getAllAdmin(page: number, limit: number, search: string): Promise<Array<AdminUserDTO>> {
		const skip = page * limit;
		let filter = { role: UserRoles.ADMIN, isSuperAdmin: false };
		if (search) filter['firstName'] = { $regex: search, $options: 'i' }
		const users = await this.userModel.find(filter, 'firstName lastName email mobileNumber emailVerified language status isSuperAdmin').limit(limit).skip(skip).lean() as any;
		return users;
	}

	public async countAllAdmin(search: string): Promise<number> {
		let filter = { role: UserRoles.ADMIN, isSuperAdmin: false };
		if (search) filter['firstName'] = { $regex: search, $options: 'i' }
		const count = await this.userModel.countDocuments(filter);
		return count;
	}

}
