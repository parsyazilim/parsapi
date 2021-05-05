import { Catch, ArgumentsHost, Inject, HttpServer, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {

	catch(exception: any, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse();
		// const request = ctx.getRequest();
		// const status = exception.getStatus();


		let status = HttpStatus.INTERNAL_SERVER_ERROR;

		const message = (exception instanceof Error) ? exception.message : exception.message.error;

		let errors = [];
		console.log(exception);
		if (exception.status === HttpStatus.NOT_FOUND) {
			if (message.message) errors.push(message.message)
			status = HttpStatus.NOT_FOUND;
		}

		if (exception.status === HttpStatus.SERVICE_UNAVAILABLE) {
			status = HttpStatus.SERVICE_UNAVAILABLE;
		}

		if (exception.status === HttpStatus.NOT_ACCEPTABLE) {
			status = HttpStatus.NOT_ACCEPTABLE;
		}

		if (exception.status === HttpStatus.EXPECTATION_FAILED) {
			status = HttpStatus.EXPECTATION_FAILED;
		}

		if (exception.status === HttpStatus.BAD_REQUEST) {
			if (message && message.message) {
				const msg = message.message;
				if (Array.isArray(msg)) {
					for (var i = 0, l = msg.length; i < l; i++) {
						if (msg[i] && msg[i].constraints) {
							errors = errors.concat(Object.values(msg[i].constraints));
						} else {
							errors = errors.concat(msg[i]);
						}
					}
				} else errors.push(msg);
			}
			status = HttpStatus.BAD_REQUEST;
		}

		if (exception.status === HttpStatus.UNAUTHORIZED) {
			status = HttpStatus.UNAUTHORIZED;
		}

		response
			.status(status)
			.json({
				status,
				success: false,
				errors: errors,
				message: (status === HttpStatus.INTERNAL_SERVER_ERROR) ? 'Sorry we are experiencing technical problems.' : '',
			});
	}
}