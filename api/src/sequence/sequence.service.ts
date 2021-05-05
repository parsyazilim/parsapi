import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class SequenceService {
	constructor(
		@InjectModel('Sequence') private readonly sequenceModel: Model<any>
	) { }

	public async getSequence(): Promise<any> {
		let response = await this.sequenceModel.findOneAndUpdate({ "sequenceType": "ORDER" }, { $inc: { sequenceNo: 1 } }, { new: true });
		return response
	}
}
