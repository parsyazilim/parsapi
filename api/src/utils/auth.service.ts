import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { genSalt, compare, hash } from 'bcrypt';

@Injectable()
export class AuthService {
	constructor(
		private jwtService: JwtService
	) {

	}

	// Generate salt for hashing password
	private async generateSalt(): Promise<string> {
		return await genSalt();
	}

	// Hashes the user's plain text password into a cipher
	public async hashPassword(password: string) {
		const salt = await this.generateSalt();
		const hashedPassword = await hash(password, salt);
		return { salt, hashedPassword };
	}

	// Verify password
	public async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
		return await compare(password, hashedPassword);
	}

	// Generate Token
	public async generateAccessToken(_id: string, role: string): Promise<string> {
		const payload = { _id };
		return this.jwtService.sign(payload, { expiresIn: '30d' });
	}
}
