import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGateway, PaymentResponse } from './payment-gateway.interface';
import { CreatePaymentTransactionDto } from './dto/create-payment-transaction.dto';
import { Order } from '../order/entities/order.entity';
import axios from 'axios';
import { PaymentException } from './exceptions/payment.exception';

@Injectable()
export class PayPalService implements PaymentGateway {
    private readonly logger = new Logger(PayPalService.name);

    constructor(private configService: ConfigService) { }

    getPaymentMethodName(): string {
        return 'PAYPAL';
    }

    async processPayment(
        ipAddr: string,
        order: Order,
        paymentData: CreatePaymentTransactionDto,
    ): Promise<PaymentResponse> {
        try {
            this.logger.log(`Processing PayPal payment for order ${order.order_id}`);

            // Calculate total amount (Subtotal + VAT + Delivery Fee)
            const totalVND = Math.round(order.subtotal * 1.1 + order.delivery_fee);

            // Convert VND to USD (approximate rate: 1 USD = 25,000 VND)
            const exchangeRate = 25000;
            const amountUSD = (totalVND / exchangeRate).toFixed(2);

            // Get PayPal credentials from environment
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

            // Create PayPal order
            const returnUrl = this.configService.get<string>('PAYPAL_RETURN_URL') || 'http://localhost:8080/payment/success';
            const cancelUrl = this.configService.get<string>('PAYPAL_CANCEL_URL') || 'http://localhost:8080/payment/cancel';

            const createOrderResponse = await axios.post(
                `${baseUrl}/v2/checkout/orders`,
                {
                    intent: 'CAPTURE',
                    purchase_units: [
                        {
                            reference_id: `ORDER${order.order_id}`,
                            amount: {
                                currency_code: 'USD',
                                value: amountUSD,
                            },
                            description: `Payment for Order #${order.order_id}`,
                        },
                    ],
                    application_context: {
                        return_url: `${returnUrl}?orderId=${order.order_id}`,
                        cancel_url: `${cancelUrl}?orderId=${order.order_id}`,
                        brand_name: 'AIMS Store',
                        user_action: 'PAY_NOW',
                    },
                },
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const approveLink = createOrderResponse.data.links.find(
                (link: any) => link.rel === 'approve'
            );

            this.logger.log(`PayPal order created: ${createOrderResponse.data.id}`);

            return {
                url: approveLink.href,
                type: 'REDIRECT',
            };
        } catch (error) {
            this.logger.error('Error processing PayPal payment', error.response?.data || error.message);
            throw new PaymentException(
                'Failed to process PayPal payment',
                'PAYPAL',
                error.response?.data || error.message
            );
        }
    }

    verifyCallback(data: any): boolean {
        // Implement PayPal webhook signature verification if needed
        return true;
    }
}
