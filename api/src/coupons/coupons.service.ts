import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CouponsDTO, CouponStatusDTO } from './coupons.model';

@Injectable()
export class CouponService {
	constructor(
		@InjectModel('Coupon') private readonly couponsModel: Model<any>,
	) { }

	public async getAllCoupon(page: number, limit: number, search: string): Promise<Array<CouponsDTO>> {
		const skip = page * limit;
		let filter = {};
		if (search) filter = { couponCode: { $regex: search, $options: 'i' } }
		const coupons = await this.couponsModel.find(filter, 'couponType offerValue description startDate expiryDate couponCode status').limit(limit).skip(skip);
		return coupons;
	}

	// Count all coupon
	public async countAllCoupon(search: string): Promise<number> {
		let filter = {};
		if (search) filter = { couponCode: { $regex: search, $options: 'i' } }
		return await this.couponsModel.countDocuments(filter);
	}

	// Get coupon admin
	public async getCouponDetail(couponId: string): Promise<CouponsDTO> {
		const coupon = await this.couponsModel.findById(couponId, 'title couponType offerValue description startDate expiryDate couponCode');
		return coupon;
	}

	public async findCouponByCode(code: String) {
		const coupon = await this.couponsModel.findOne({ couponCode: code }, 'couponCode offerValue couponType');
		return coupon;
	}

	public async getCouponDetailByCode(code: String): Promise<CouponsDTO> {
		const coupon = await this.couponsModel.findOne({ couponCode: code, status: true });
		return coupon;
	}


	// Creates a new coupon admin
	public async createCoupon(couponData: CouponsDTO): Promise<CouponsDTO> {
		const coupon = await this.couponsModel.create(couponData) as CouponsDTO;
		return coupon;
	}

	// Updates coupon admin
	public async updateCoupon(couponId: string, couponData: CouponsDTO): Promise<CouponsDTO> {
		const coupon = await this.couponsModel.findByIdAndUpdate(couponId, couponData, { new: true }) as CouponsDTO;
		return coupon;
	}
	// Deletes coupon admin
	public async deleteCoupon(couponId: string): Promise<CouponsDTO> {
		const coupon = await this.couponsModel.findByIdAndDelete(couponId);
		return coupon;
	}

	// Update coupon admin
	public async couponStatusUpdate(id: string, couponStatusData: CouponStatusDTO): Promise<CouponsDTO> {
		const coupon = await this.couponsModel.findByIdAndUpdate(id, couponStatusData, { new: true });
		return coupon;
	}
}

