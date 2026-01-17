import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { PaymentTransactionService } from './payment-transaction.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Controller('paypal')
export class PayPalController {
    private readonly logger = new Logger(PayPalController.name);

    constructor(
        private readonly paymentTransactionService: PaymentTransactionService,
        private readonly configService: ConfigService,
    ) { }

    @Get('success')
    async handleSuccess(
        @Query('token') token: string,
        @Query('PayerID') payerId: string,
        @Query('orderId') orderId: string,
        @Res() res: Response,
    ) {
        try {
            this.logger.log(`PayPal success callback: token=${token}, payerId=${payerId}, orderId=${orderId}`);

            // Get PayPal credentials
            const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
            const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');
            const mode = this.configService.get<string>('PAYPAL_MODE') || 'sandbox';

            // Use PAYPAL_BASE_URL if provided, otherwise auto-detect based on mode
            const baseUrl = this.configService.get<string>('PAYPAL_BASE_URL') ||
                (mode === 'live'
                    ? 'https://api-m.paypal.com'
                    : 'https://api-m.sandbox.paypal.com');

            // Get access token
            const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
            const tokenResponse = await axios.post(
                `${baseUrl}/v1/oauth2/token`,
                'grant_type=client_credentials',
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            const accessToken = tokenResponse.data.access_token;

            // Capture the payment
            const captureResponse = await axios.post(
                `${baseUrl}/v2/checkout/orders/${token}/capture`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            this.logger.log(`PayPal capture response: ${JSON.stringify(captureResponse.data)}`);

            // Update transaction status
            const orderIdNum = parseInt(orderId, 10);
            await this.paymentTransactionService.updateTransactionStatus(
                orderIdNum,
                'SUCCESS',
                captureResponse.data,
            );

            // Redirect to frontend success page
            return res.redirect(`http://localhost:8080/?payment=success&orderId=${orderId}`);
        } catch (error) {
            this.logger.error('PayPal success handler error', error.response?.data || error.message);
            return res.redirect(`http://localhost:8080/?payment=error&orderId=${orderId}`);
        }
    }

    @Get('cancel')
    async handleCancel(
        @Query('token') token: string,
        @Query('orderId') orderId: string,
        @Res() res: Response,
    ) {
        this.logger.log(`PayPal cancel callback: token=${token}, orderId=${orderId}`);

        // Update transaction status to FAILED
        try {
            const orderIdNum = parseInt(orderId, 10);
            await this.paymentTransactionService.updateTransactionStatus(
                orderIdNum,
                'FAILED',
                { reason: 'User cancelled payment' },
            );
        } catch (error) {
            this.logger.error('Error updating cancelled transaction', error);
        }

        // Redirect to frontend
        return res.redirect(`http://localhost:8080/?payment=cancelled&orderId=${orderId}`);
    }
}
