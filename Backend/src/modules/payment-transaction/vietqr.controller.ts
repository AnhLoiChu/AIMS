import { Controller, Post, Body, Headers, UnauthorizedException, Logger, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { PaymentTransactionService } from './payment-transaction.service';

@Controller('vietqr')
export class VietQRController {
    private readonly logger = new Logger(VietQRController.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly paymentTransactionService: PaymentTransactionService,
    ) { }

    @Post('api/token_generate')
    generateToken(@Headers('authorization') authHeader: string) {
        this.logger.log('Received VietQR Token Generation Request');

        if (!authHeader || !authHeader.startsWith('Basic ')) {
            throw new UnauthorizedException('Missing Basic Auth');
        }

        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');

        // Verify against our stored credentials for VietQR inbound
        const expectedUser = this.configService.get<string>('VQR_CUSTOMER_USER');
        const expectedPass = this.configService.get<string>('VQR_CUSTOMER_PASS');

        if (username !== expectedUser || password !== expectedPass) {
            this.logger.warn(`Invalid VietQR Inbound Auth: ${username}`);
            throw new UnauthorizedException('Invalid credentials');
        }

        // Return a dummy or signed token string. 
        // Since VietQR just sends this back to us in the Sync API, we can use a simple string or a signed JWT.
        // For simplicity/demo: Base64 of timestamp + secret
        const token = Buffer.from(`VIETQR_INBOUND_${Date.now()}_SECRET`).toString('base64');

        return {
            access_token: token,
            token_type: 'Bearer',
            expires_in: 300,
        };
    }

    @Post('bank/api/transaction-sync')
    async syncTransaction(
        @Body() body: any,
        @Headers('authorization') authHeader: string,
        @Res() res: Response
    ) {
        try {
            this.logger.log('Received VietQR Transaction Sync:', JSON.stringify(body));

            // 1. Validate Bearer Token
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: true, errorReason: 'UNAUTHORIZED', toastMessage: 'Missing Token', object: null });
            }

            // In a real app, verify the token signature/claims.
            // Here we just check presence for now as per demo.

            // 2. Process Transaction
            // Body: { bankaccount, amount, transType, content, transactionid, transactiontime, referencenumber, orderId, ... }

            // Logic to update order
            // The spec says 'orderId' is passed back if we sent it.
            // We sent `ORDER${id}` or just `${id}`. In service refactor I used `ORDER${id}` in payload.

            let orderId: number = 0;
            if (body.orderId) {
                const match = body.orderId.match(/ORDER(\d+)/);
                if (match) orderId = parseInt(match[1], 10);
                else orderId = parseInt(body.orderId, 10); // Fallback
            } else if (body.content) {
                // Fallback to content parsing if orderId missing
                const match = body.content.match(/PAY\s*(\d+)/i);
                if (match) orderId = parseInt(match[1], 10);
            }

            if (orderId) {
                await this.paymentTransactionService.updateTransactionStatus(
                    orderId,
                    'SUCCESS',
                    body
                );
                this.logger.log(`VietQR Sync: Updated Order ${orderId} to SUCCESS`);

                return res.json({
                    error: false,
                    errorReason: null,
                    toastMessage: 'Success',
                    object: {
                        reftransactionid: body.transactionid
                    }
                });
            }

            this.logger.warn('VietQR Sync: Could not identify Order ID');
            return res.status(400).json({
                error: true,
                errorReason: 'INVALID_DATA',
                toastMessage: 'Order ID not found',
                object: null
            });

        } catch (error) {
            this.logger.error('VietQR Sync Error', error);
            return res.status(500).json({
                error: true,
                errorReason: 'INTERNAL_ERROR',
                toastMessage: error.message,
                object: null
            });
        }
    }
}
