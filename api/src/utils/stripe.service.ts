import { Injectable } from '@nestjs/common';
import * as Stripe from 'stripe';
let stripe: any;

@Injectable()
export class StripeService {
	constructor() {
		if (process.env.STRIPE_SECRET_KEY) stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
		else console.log("STRIPE_SECRET_KEY not set.");
	}

	public async createChargePayment(obj) {
		return stripe.charges.create(obj);
	}

	public async createPaymentIntents(obj) {
		return stripe.paymentIntents.create(obj);
	}

	public async capturePaymentIntents(id, obj) {
		return stripe.paymentIntents.capture(id, obj);
	}

	public async createCheckoutSession(obj) {
		return await stripe.checkout.sessions.create(obj);
	}

	public async webhookVerify(payload, sig) {
		return await stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_END_POINT_SECRET_WEBHOOK)
	}
}