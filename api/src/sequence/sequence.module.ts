import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SequenceSchema } from './sequence.model';
import { SequenceService } from './sequence.service';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Sequence', schema: SequenceSchema }])
	],
	providers: [SequenceService],
	exports: [SequenceService]
})

export class SequenceModule {
}
