import { Injectable } from '@nestjs/common';
import { TwilioResponseDTO, ResponseMessage } from './app.model';
const request = require('request');
var client;
@Injectable()
export class OtpService {
	constructor() {
		if (process.env.USE_SENDINBLUE_OTP == 'false') {
			if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
			else console.log("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN is not set");
		} else {
			if (process.env.SENDINBLUE_API_KEY_FOR_OTP === '')
				console.log(`SENDINBLUE_API_KEY_FOR_OTP is not set`);
		}
	}

	public async sendOTP(mobileNumber: string, otp?: string): Promise<TwilioResponseDTO> {
		try {
			otp = `${otp} is secret otp for verification. Please don't share it with anyone.`

			if (process.env.USE_SENDINBLUE_OTP === 'true') {
				const options = {
					method: 'POST',
					url: process.env.SENDINBLUE_URL_FOR_OTP,
					headers: {
						accept: 'application/json',
						'content-type': 'application/json',
						'api-key': process.env.SENDINBLUE_API_KEY_FOR_OTP
					},
					body: {
						type: 'transactional',
						sender: 'Ionic',
						recipient: mobileNumber,
						content: otp
					},
					json: true
				};
				const otpData = await request(options);
				let body = JSON.parse(otpData.body)
				if (otpData && body.recipient) {
					return {
						isError: false,
						data: body.recipient
					}
				} else {
					return {
						isError: true,
						data: otpData.message
					}
				}
			} else {
				let otpData = await client.verify.services(process.env.TWILIO_SID).verifications.create({ to: mobileNumber, channel: 'sms' });
				if (otpData && otpData.sid) {
					return {
						isError: false,
						data: otpData.sid
					}
				} else {
					return {
						isError: true,
						data: ResponseMessage.SOMETHING_WENT_WRONG
					}
				}
			}
		}
		catch (e) {
			console.log("Otp Catch Error", e)
			return {
				isError: true,
				data: e.message
			}
		}
	}

	public async verifyOTP(otp: string, verificationSid: string): Promise<TwilioResponseDTO> {
		try {
			let otpData = await client.verify.services(process.env.TWILIO_SID).verificationChecks.create({ verificationSid: verificationSid, code: otp });
			if (otpData && otpData.status == 'approved') {
				return {
					isError: false,
					data: otpData.sid
				}
			} else {
				return {
					isError: true,
					data: "Invalid otp"
				}
			}
		} catch (e) {
			console.log("Twilio Verify Otp Catch Error", e)
			return {
				isError: true,
				data: e.message
			}
		}
	}
}