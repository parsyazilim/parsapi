import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AddressDTO, AddressSaveDTO, AddressType } from './address.model';

@Injectable()
export class AddressService {
	constructor(
		@InjectModel('Address') private readonly addressModel: Model<any>
	) {
	}

	// Get user address list
	public async getAllAddress(userId: string): Promise<Array<AddressDTO>> {
		const address = await this.addressModel.find({ userId: userId }, 'address addressType flatNo apartmentName landmark postalCode mobileNumber location');
		return address;
	}

	// Get user address by addressId
	public async getAddressDetail(userId: string, addressId: string): Promise<AddressDTO> {
		const address = await this.addressModel.findOne({ _id: addressId, userId: userId }, 'address addressType flatNo apartmentName landmark postalCode mobileNumber location');
		return address;
	}

	// Creates a new Address
	public async createAddress(addressData: AddressSaveDTO): Promise<AddressDTO> {
		const address = await this.addressModel.create(addressData);
		return address;
	}

	// Update address by addressId
	public async updateAddress(addressId: string, addressData: AddressSaveDTO): Promise<AddressDTO> {
		const address = await this.addressModel.findOneAndUpdate({ _id: addressId }, addressData);
		return address;
	}

	// Update address by addressId
	public async deleteAddress(userId: string, addressId: string): Promise<AddressDTO> {
		const address = await this.addressModel.findOneAndRemove({ _id: addressId, userId: userId });
		return address;
	}

	// Get user address list
	public async getAddressTypeList() {
		const list = {};
		for (var key in AddressType) {
			const val = AddressType[key];
			list[val] = val;
		}
		return list;
	}
}
