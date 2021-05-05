import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UtilService } from './utils/util.service';

@Injectable()
export class RequestInterceptor implements NestInterceptor {
	constructor(private utilService: UtilService) { }

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest<Request>();
		this.utilService.setLanguage(request.headers['language']);
		return next.handle().pipe();
	};
};