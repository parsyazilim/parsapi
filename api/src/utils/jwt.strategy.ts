import { Injectable } from '@nestjs/common';
import { PassportStrategy, AuthGuard } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { createParamDecorator } from '@nestjs/common';
import { UserService } from '../users/users.service';
import { UtilService } from './util.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private userService: UserService,
		private utilService: UtilService
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: process.env.SECRET,
		});
		if (!process.env.SECRET) console.log("SECRET not set.");
	}

	// validates user token and returns user's information
	async validate(payload) {
		console.log("---payload---", payload)
		const { _id } = payload;
		const userInfo = await this.userService.getUserById(_id);
		if (userInfo && !userInfo.status) this.utilService.unauthorized();
		return userInfo;
	}
}

export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
	// Override handleRequest so it never throws an error
	handleRequest(err, user, info, context) {
		return user;
	}

}

export const GetUser = createParamDecorator((data, req) => {
	return req.user;
});

