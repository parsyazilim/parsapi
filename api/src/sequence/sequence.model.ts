import * as mongoose from 'mongoose';

export const SequenceSchema = new mongoose.Schema({
	sequenceType: { type: String },
	sequenceNo: { type: Number },
}, {
	timestamps: true
});
