import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { PaymentException } from '../exceptions/payment.exception';

@Catch(PaymentException)
export class PaymentExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(PaymentExceptionFilter.name);

    catch(exception: PaymentException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();
        const exceptionResponse: any = exception.getResponse();

        this.logger.error(
            `Payment Error [${exception.gateway}]: ${exception.message}`,
            JSON.stringify(exception.details),
        );

        response.status(status).json({
            success: false,
            statusCode: status,
            message: exceptionResponse.message,
            gateway: exceptionResponse.gateway,
            timestamp: exceptionResponse.timestamp,
            error: 'Payment Gateway Error',
        });
    }
}
