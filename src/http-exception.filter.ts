import { ExceptionFilter, Catch, ArgumentsHost, HttpException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(UnauthorizedException, InternalServerErrorException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
         
        const status = exception?.getStatus();

        const exceptionRes: any = exception?.getResponse();
        const exceptionCode = `error` + exceptionRes.statusCode;
        let exceptionMessage = process.env[exceptionCode];

        const exceptionArgs = exceptionRes.args;
        const argsLength = exceptionArgs? exceptionArgs.length : 0;
        for (var i = 0; i < argsLength; i++) {
            exceptionMessage = exceptionMessage?.replace('args' + i, exceptionArgs[i]);
        }

        response.status(status)
            .json({
                timestamp: new Date().toISOString(),
                path: request.url,
                statusCode: exceptionRes.statusCode,
                message: exceptionMessage,
                data: exceptionRes.data
            });

    }
}