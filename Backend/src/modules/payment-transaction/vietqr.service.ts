import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGateway, PaymentResponse } from './payment-gateway.interface';
import { CreatePaymentTransactionDto } from './dto/create-payment-transaction.dto';
import { Order } from '../order/entities/order.entity';
import axios from 'axios';
import { PaymentException } from './exceptions/payment.exception';

@Injectable()
export class VietQRService implements PaymentGateway {
    private readonly logger = new Logger(VietQRService.name);

    constructor(private configService: ConfigService) { }

    getPaymentMethodName(): string {
        return 'VIETQR';
    }

    async processPayment(
        ipAddr: string,
        order: Order,
        paymentData: CreatePaymentTransactionDto,
    ): Promise<PaymentResponse> {
        try {
            this.logger.log(`Processing VietQR payment for order ${order.order_id} via API`);

            // 1. Get Access Token from VietQR
            const token = await this.getAccessToken();

            // 2. Generate QR Code
            const qrData = await this.generateQRCode(token, order);

            this.logger.log(`Generated VietQR Data: ${JSON.stringify(qrData)}`);

            // Prefer using the official VietQR link (Redirect)
            // This link opens a payment landing page.
            if (qrData.qrLink) {
                return {
                    url: qrData.qrLink,
                    type: 'REDIRECT',
                };
            }

            // Fallback: If for some reason qrLink is missing but we have QR info, 
            // we try to return a constructed image (though user prefers REDIRECT/Dynamic)ok

            const bankCode = this.configService.get('VIETQR_BANK_CODE');
            const bankAccount = this.configService.get('VIETQR_BANK_ACCOUNT');
            const accountName = qrData.userBankName || this.configService.get('VIETQR_USER_BANK_NAME');
            const content = qrData.content;
            const amount = qrData.amount;
            const qrImageUrl = `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(accountName)}`;

            return {
                url: qrImageUrl,
                type: 'QR_IMAGE',
            };
        } catch (error) {
            this.logger.error('Error processing VietQR payment', error);
            throw new PaymentException(
                'Failed to process VietQR payment',
                'VIETQR',
                error.response?.data || error.message
            );
        }
    }

    private async getAccessToken(): Promise<string> {
        try {
            const baseUrl = this.configService.get<string>('VIETQR_BASE_URL') || 'https://dev.vietqr.org';
            const username = this.configService.get<string>('VIETQR_USERNAME');
            const password = this.configService.get<string>('VIETQR_PASSWORD'); // Ensure this is the correct pass for API access

            // Basic Auth Header
            const auth = Buffer.from(`${username}:${password}`).toString('base64');

            const response = await axios.post(
                `${baseUrl}/vqr/api/token_generate`,
                {}, // Empty body
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Basic ${auth}`,
                    },
                },
            );

            if (response.data && response.data.access_token) {
                return response.data.access_token;
            }

            throw new Error('Failed to retrieve access token from VietQR');
        } catch (error) {
            this.logger.error('Error getting VietQR Token', error.response?.data || error.message);
            throw new Error('VietQR Token Generation Failed');
        }
    }

    private async generateQRCode(token: string, order: Order): Promise<any> {
        try {
            const baseUrl = this.configService.get<string>('VIETQR_BASE_URL') || 'https://dev.vietqr.org';
            const bankCode = this.configService.get<string>('VIETQR_BANK_CODE');
            const bankAccount = this.configService.get<string>('VIETQR_BANK_ACCOUNT');
            const userBankName = this.configService.get<string>('VIETQR_USER_BANK_NAME');

            const amount = Math.round(order.subtotal * 1.1 + order.delivery_fee);

            // Format: PAY <OrderId>
            // Make sure content is under 23 chars and no special chars if possible?
            // Spec says: "Tối đa 23 ký tự, tiếng Việt không dấu, không ký tự đặc biệt."
            // "PAY 123456" is safe.
            const content = `PAY ${order.order_id}`;

            const payload = {
                bankCode,
                bankAccount,
                userBankName,
                content,
                qrType: 0, // Dynamic QR
                amount,
                orderId: `ORDER${order.order_id}`, // Max 13 chars
                transType: 'C', // Credit
            };

            const response = await axios.post(
                `${baseUrl}/vqr/api/qr/generate-customer`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            return response.data;
        } catch (error) {
            this.logger.error('Error generating VietQR', error.response?.data || error.message);
            throw new Error('VietQR Generation Failed');
        }
    }

    // Helper to verify callback signature if needed
    verifyCallback(data: any): boolean {
        // Implement verification logic based on spec
        return true;
    }
}
