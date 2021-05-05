import { Injectable } from '@nestjs/common';
const request = require('request');

@Injectable()
export class PushService {
	appId = null;
	secretKey = null;

	constructor() {
		if (!(process.env.ONE_SIGNAL_APP_ID_USER && process.env.ONE_SIGNAL_SECRET_KEY_USER))
			console.log("ONE_SIGNAL_APP_ID_USER or ONE_SIGNAL_SECRET_KEY_USER not set.");

		if (!(process.env.ONE_SIGNAL_APP_ID_DELIVERY && process.env.ONE_SIGNAL_SECRET_KEY_DELIVERY))
			console.log("ONE_SIGNAL_APP_ID_DELIVERY or ONE_SIGNAL_SECRET_KEY_DELIVERY not set.");
	}

	public async sendNotificationToUser(playerId, title, message, isAll = false) {
		this.appId = process.env.ONE_SIGNAL_APP_ID_USER;
		this.secretKey = process.env.ONE_SIGNAL_SECRET_KEY_USER;
		return await this.sendNotification(playerId, title, message, isAll);
	}

	public async sendNotificationToDeliveryBoy(playerId, title, message) {
		this.appId = process.env.ONE_SIGNAL_APP_ID_DELIVERY;
		this.secretKey = process.env.ONE_SIGNAL_SECRET_KEY_DELIVERY;
		return await this.sendNotification(playerId, title, message);
	}

	async sendNotification(playerId, title, message, isAll = false) {
		return new Promise((resolve, reject) => {
			let body = {
				'app_id': this.appId,
				'contents': { en: message },
				'headings': { en: title }
			}
			if (isAll) body['included_segments'] = ["Subscribed Users"];
			else body['include_player_ids'] = Array.isArray(playerId) ? playerId : [playerId];

			return request({
				method: 'POST',
				uri: 'https://onesignal.com/api/v1/notifications',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Basic ' + this.secretKey
				},
				json: true,
				body: body
			}, function (error, response, body) {
				if (body) {
					console.log(body);
					resolve(true);
				} else {
					console.error('Error:', error);
					reject(false);
				}
			});
		})
	}
}