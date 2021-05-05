import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WalletDTO, WalletSaveDTO, WalletTransactionType } from './wallet.model';

@Injectable()
export class WalletService {
	constructor(
		@InjectModel('Wallet') private readonly walletModel: Model<any>
	) { }

	public async walletHistory(userId: string, page: number, limit: number): Promise<Array<WalletDTO>> {
		const skip = page * limit;
		let wallets = await this.walletModel.find({ userId: userId }).sort({ createdAt: -1 }).limit(limit).skip(skip);;
		return wallets;
	}

	public async countWalletHistory(userId: string): Promise<number> {
		return await this.walletModel.countDocuments({ userId: userId });
	}

	public async cancelOrder(walletData: WalletSaveDTO): Promise<WalletDTO> {
		walletData.isCredited = true;
		walletData.transactionType = WalletTransactionType.ORDER_CANCELLED;
		let wallet = await this.walletModel.create(walletData);
		return wallet;
	}

	public async orderModified(walletData: WalletSaveDTO): Promise<WalletDTO> {
		walletData.isCredited = true;
		walletData.transactionType = WalletTransactionType.ORDER_MODIFIED;
		let wallet = await this.walletModel.create(walletData);
		return wallet;
	}

	public async madeOrder(walletData: WalletSaveDTO): Promise<WalletDTO> {
		walletData.isCredited = false;
		walletData.transactionType = WalletTransactionType.ORDER_PAYMENT;
		let wallet = await this.walletModel.create(walletData);
		return wallet;
	}

	public async topUpWallet(walletData: WalletSaveDTO): Promise<WalletDTO> {
		walletData.isCredited = true;
		walletData.transactionType = WalletTransactionType.WALLET_TOPUP;
		let wallet = await this.walletModel.create(walletData);
		return wallet;
	}
}