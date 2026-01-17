import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentException extends HttpException {
    constructor(message: string, public readonly gateway: string, public readonly details?: any) {
        super(
            {
                message,
                gateway,
                details,
                timestamp: new Date().toISOString(),
            },
            HttpStatus.BAD_GATEWAY,
        );
    }
}
