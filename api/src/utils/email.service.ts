import { Injectable } from '@nestjs/common';
const ejs = require('ejs');
const appRoot = require('app-root-path');
var pdf = require('html-pdf')
const fs = require('fs');
const sgMail = require('@sendgrid/mail');
import { UtilService } from './util.service';
import { ResponseMessage } from './app.model';
var SibApiV3Sdk = require('sib-api-v3-sdk');
var defaultClient = SibApiV3Sdk.ApiClient.instance;
const request = require('request');
import { createTransport } from "nodemailer";

@Injectable()
export class EmailService {
	constructor(private utilService: UtilService) {
		if (process.env.USE_SENDINBLUE_EMAIL == 'false') {
			if (process.env.SENDGRID_KEY && process.env.SENDGRID_FROM) sgMail.setApiKey(process.env.SENDGRID_KEY);
			else console.log("SENDGRID_KEY or SENDGRID_FROM is not set.");
		} else {
			if (process.env.SENDINBLUE_USER && process.env.SENDINBLUE_PASSWORD && process.env.SENDINBLUE_HOST_NAME) {
			}
			else console.log(`SENDINBLUE_USER, SENDINBLUE_PASSWORD or SENDINBLUE_HOST_NAME is not set.`);
		}
	}

	public async sendEmail(email: string, subject: string, text?: string, html?: string, attachment?): Promise<any> {
		if (email) {
			let response;
			if (process.env.USE_SENDINBLUE_EMAIL === 'true') {
				let msg = {
					to: email,
					from: process.env.SENDINBLUE_USER,
					subject: subject
				};
				if (text) msg['text'] = text;
				if (html) msg['html'] = html;
				if (attachment) {
					msg['attachments'] = [{
						content: attachment,
						filename: "invoice.pdf",
						type: "application/pdf",
						disposition: "attachment"
					}];
				}
				const transporter = createTransport({
					host: process.env.SENDINBLUE_HOST_NAME,
					port: 587,
					secure: false,
					auth: {
						user: process.env.SENDINBLUE_USER,
						pass: process.env.SENDINBLUE_PASSWORD,
					},
				});
				response = await transporter.sendMail(msg)
				console.log("email response from sendinblue", response)
			}
			else {
				let msg = {
					to: email,
					from: process.env.SENDGRID_FROM,
					subject: subject
				};
				if (text) msg['text'] = text;
				if (html) msg['html'] = html;
				if (attachment) {
					msg['attachments'] = [{
						content: attachment,
						filename: "invoice.pdf",
						type: "application/pdf",
						disposition: "attachment"
					}];
				}
				response = await sgMail.send(msg);
				console.log("email response from sendgrid", response)
			}
			return response;
		}
	}

	public async emailVerifyTemplate(html, verifyButton, emailverificationId: string, email: string) {
		let url: string = process.env.NODE_ENV === 'production' ? process.env.API_URL_PRODUCTION : process.env.API_URL_STAGING;
		url += `/users/verify-email?verificationId=${emailverificationId}&email=${email}`;
		const htmlData: string = `<p>${html}</p><br><a href="${url}" target="_blank">${verifyButton}</a>`;
		return htmlData;
	}

	public async sendEmailForForgotPassword(firstName: string, email: string, otp: number): Promise<any> {
		const subject = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_FORGOT_PASSWORD_EMAIL_SUBJECT);
		let html = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_FORGOT_PASSWORD_EMAIL_BODY);
		html = html.replace('${firstName}', firstName);
		html = html.replace('${OTP}', `${otp}`);
		return await this.sendEmail(email, subject, null, html);
	}

	public async sendEmailForVerification(firstName: string, email: string, emailVerificationId: string): Promise<any> {
		const subject = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_EMAIL_VERIFY_SUBJECT);
		const verifyButton = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_EMAIL_VERIFY_BUTTON);
		let html = await this.utilService.getTranslatedMessageByKey(ResponseMessage.USER_EMAIL_VERIFY_BODY);
		html = html.replace('${firstName}', firstName);
		const mailBody = await this.emailVerifyTemplate(html, verifyButton, emailVerificationId, email);
		const emailRes = await this.sendEmail(email, subject, null, mailBody);
		return emailRes;
	}

	public async invoiceTemplate(order, business) {
		try {
			var newDate = new Date(order.createdAt);
			var formattedDate = newDate.getDate() + '-' + (newDate.getMonth() + 1) + '-' + newDate.getFullYear();

			const text = {
				invoice: await this.utilService.getTranslatedMessageByKey(ResponseMessage.INVOICE_INVOICE),
				date: await this.utilService.getTranslatedMessageByKey(ResponseMessage.INVOICE_DATE),
				payment: await this.utilService.getTranslatedMessageByKey(ResponseMessage.INVOICE_PAYMENT),
				billTo: await this.utilService.getTranslatedMessageByKey(ResponseMessage.INVOICE_BILL_TO),
				sl: await this.utilService.getTranslatedMessageByKey(ResponseMessage.INVOICE_SL),
				item: await this.utilService.getTranslatedMessageByKey(ResponseMessage.INVOICE_ITEM),
				qty: await this.utilService.getTranslatedMessageByKey(ResponseMessage.INVOICE_QTY),
				unit: await this.utilService.getTranslatedMessageByKey(ResponseMessage.INVOICE_UNIT),
				price: await this.utilService.getTranslatedMessageByKey(ResponseMessage.INVOICE_PRICE),
				discount: await this.utilService.getTranslatedMessageByKey(ResponseMessage.INVOICE_DISCOUNT),
				total: await this.utilService.getTranslatedMessageByKey(ResponseMessage.INVOICE_TOTAL),
				subTotal: await this.utilService.getTranslatedMessageByKey(ResponseMessage.INVOICE_SUB_TOTAL),
				deliveryCharge: await this.utilService.getTranslatedMessageByKey(ResponseMessage.INVOICE_DELIVERY_CHARGES),
				tax: await this.utilService.getTranslatedMessageByKey(ResponseMessage.INVOICE_TAX),
				couponDiscount: await this.utilService.getTranslatedMessageByKey(ResponseMessage.INVOICE_COUPON_DISCOUNT),
				wallet: await this.utilService.getTranslatedMessageByKey(ResponseMessage.INVOICE_WALLET),
				grandTotal: await this.utilService.getTranslatedMessageByKey(ResponseMessage.INVOICE_GRAND_TOTAL),
			}
			const info = {
				storeName: business.storeName,
				storeAddress: business.address,
				storePhone: business.phoneNumber,
				storeEmail: business.email,
				invoiceTitle: await this.utilService.getTranslatedMessageByKey(ResponseMessage.INVOICE_INVOICE),
				orderId: order.orderID,
				deliveryDate: formattedDate,
				paymentType: order.paymentType,
				userName: `${order.user.firstName} ${order.user.lastName}`,
				userAddress: order.address?.address,
				userMobile: order.user.mobileNumber,
				userEmail: order.user.email,
				products: order.cart,
				subTotal: this.utilService.convertToDecimal(order.subTotal),
				deliveryCharges: this.utilService.convertToDecimal(order.deliveryCharges),
				tax: this.utilService.convertToDecimal(order.tax),
				couponDiscount: this.utilService.convertToDecimal(order.couponAmount ? order.couponAmount : 0),
				walletAmount: this.utilService.convertToDecimal(order.usedWalletAmount),
				isWalletUsed: order.isWalletUsed,
				grandTotal: this.utilService.convertToDecimal(order.grandTotal),
				currency: order.currencySymbol,
				text: text
			};
			const templatePath = `${appRoot.path}/components/order_invoice.ejs`;
			const templateHtml = await fs.readFileSync(templatePath, 'utf-8');
			const htmlBody = await ejs.render(templateHtml, info);
			return htmlBody;
		} catch (e) {
			console.log(e);
		}
	}

	public async createInvoice(order, business) {
		const htmlBodyPDF = await this.invoiceTemplate(order, business);
		const prom = new Promise(function (resolve, reject) {
			var options = { "format": "Letter", "base": `file://${appRoot.path}/` };
			pdf.create(htmlBodyPDF, options).toFile("invoice.pdf", function (err, pdfRes) {
				if (err) {
					console.log("invoicePdfGenerate: " + err);
					reject(err);
				} else resolve(pdfRes.filename);
			});
		})
		return prom;
	}

	async sendEmailOrder(order, business?, isCompleted = false) {
		var newDate = new Date(order.createdAt);
		var formattedDate = newDate.getDate() + '-' + (newDate.getMonth() + 1) + '-' + newDate.getFullYear();
		var url = process.env.API_URL_PRODUCTION;
		var baseUrl = url.replace(/^[^.]+\./g, "");
		var webName = baseUrl;
		var webUrl = "https://" + baseUrl;
		var logo = "https://" + baseUrl + "/assets/images/webapp.png";
		let subject = await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_SUBJECT);
		if (baseUrl == "ionicfirebaseapp.com") logo = "https://grocery-web.ionicfirebaseapp.com/assets/images/webapp.png";
		let text = {
			thankYouMessage: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_THANKYOU_MESSAGE),
			message: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_MESSAGE),
			orderDetail: await (await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_ORDER_DETAIL)).replace('${orderID}', order.orderID),
			orderNumber: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_ORDER_NUMBER),
			orderDate: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_ORDER_DATE),
			paymentStatus: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_PAYMENT_STATUS),
			billTo: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_BILL_TO),
			product: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_PRODUCT),
			qty: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_QUANTITY),
			modifiedQty: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_MODIFIED_QUANTITY),
			price: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_PRICE),
			discount: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_DISCOUNT),
			subTotal: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_SUB_TOTAL),
			deliveryCharge: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_DELIVERY_CHARGES),
			tax: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_TAX),
			couponDiscount: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_COUPON_DISCOUNT),
			wallet: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_WALLET),
			grandTotal: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_GRAND_TOTAL),
			orderModified: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_ORDER_MODIFIED),
			thankforusing: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_THANK_FOR_USING)
		}
		let attachment = null;
		if (isCompleted) {
			text.thankYouMessage = await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_COMPLETE_THANKYOU_MESSAGE);
			text.message = await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_COMPLETE_MESSAGE);
			subject = await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_COMPLETE_SUBJECT);
			let pathToAttachment = await this.createInvoice(order, business);
			attachment = await fs.readFileSync(pathToAttachment).toString("base64");
		}
		let info = {
			orderId: order.orderID,
			orderDate: formattedDate,
			paymentType: order.paymentType,
			userName: `${order.user.firstName} ${order.user.lastName}`,
			userAddress: order.address ? order.address.address : '',
			userMobile: order.user.mobileNumber,
			userEmail: order.user.email,
			products: order.cart,
			subTotal: this.utilService.convertToDecimal(order.subTotal),
			deliveryCharges: this.utilService.convertToDecimal(order.deliveryCharges),
			tax: this.utilService.convertToDecimal(order.tax),
			walletAmount: this.utilService.convertToDecimal(order.usedWalletAmount),
			couponDiscount: this.utilService.convertToDecimal(order.couponAmount ? order.couponAmount : 0),
			isWalletUsed: order.isWalletUsed,
			grandTotal: this.utilService.convertToDecimal(order.grandTotal),
			currency: order.currencySymbol,
			webName: webName,
			webUrl: webUrl,
			logo: logo,
			text: text,
			isOrderModified: order.isOrderModified,
			amountRefundedOrderModified: await this.utilService.getTranslatedMessageByKey(ResponseMessage.EMAIL_ORDER_ITEM_UPDATED) + order.currencySymbol + order.amountRefundedOrderModified
		};
		console.log(info)
		try {
			const templatePath = `${appRoot.path}/components/order.ejs`;
			const templateHtml = await fs.readFileSync(templatePath, 'utf-8');
			const htmlBody = await ejs.render(templateHtml, info);
			console.log(htmlBody)
			return await this.sendEmail(order.user.email, subject, null, htmlBody, attachment);
		} catch (e) {
			console.log(e);
		}
	}
	public async sendEmailForPlacedOrder(order) {
		this.sendEmailOrder(order, null);
	}
	public async sendEmailOrderDelivered(order, business) {
		this.sendEmailOrder(order, business, true);
	}
}