import { Injectable } from '@nestjs/common';
import { UploadImageResponseDTO } from '../utils/app.model';
const ImageKit = require("imagekit");
let imagekit;

@Injectable()
export class UploadService {
	constructor() {
		if (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL) {
			imagekit = new ImageKit({
				publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
				privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
				urlEndpoint: process.env.IMAGEKIT_URL
			});
		} else {
			console.log("IMAGEKIT_PUBLIC_KEY or  IMAGEKIT_PRIVATE_KEY or IMAGEKIT_URL not set.");
		}
	}

	public async uploadImage(file, type: string): Promise<UploadImageResponseDTO> {
		try {
			let buff = new Buffer(file.buffer);
			let base64Data = buff.toString('base64');
			let fileName = Date.now() + '_original_' + file.originalname;

			let imageUrl = await imagekit.upload({
				file: base64Data,
				fileName: fileName,
			})
			const resData = {
				url: `${process.env.IMAGEKIT_URL}tr:dpr-auto,tr:w-auto${imageUrl.filePath}`,
				key: imageUrl.fileId,
				filePath: imageUrl.filePath
			};
			return resData;
		} catch (e) {

		}
	}

	public async uploadImages(files, type: string): Promise<Array<UploadImageResponseDTO>> {
		try {
			let resData = [];
			for (var i = 0; i < files.length; i++) {

				let buff = new Buffer(files[i].buffer);
				let base64Data = buff.toString('base64');
				let fileName = Date.now() + '_original_' + files[i].originalname;

				let imageUrl = await imagekit.upload({
					file: base64Data,
					fileName: fileName,
				});

				resData.push({
					url: `${process.env.IMAGEKIT_URL}tr:dpr-auto,tr:w-auto${imageUrl.filePath}`,
					key: imageUrl.fileId,
					filePath: imageUrl.filePath
				})

			}
			return resData;
		} catch (e) {

		}
	}
	public async uploadBase64(base64Data, fileName: string): Promise<UploadImageResponseDTO> {
		let imageRes = await imagekit.upload({
			file: base64Data,
			fileName: fileName,
		})
		return {
			url: imageRes.url,
			key: imageRes.fileId,
			filePath: imageRes.filePath
		}
	}

	public async deleteImage(imageId: string): Promise<any> {
		try {
			await imagekit.deleteFile(imageId)
			return true;
		} catch (e) {
			return false;
		}
	}
}
