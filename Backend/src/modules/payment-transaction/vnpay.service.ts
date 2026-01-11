import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as querystring from 'qs';
import dateFormat from 'dateformat';
import { CreatePaymentTransactionDto } from './dto/create-payment-transaction.dto';
import { Order } from '../order/entities/order.entity';
import * as moment from 'moment-timezone';
import { PaymentGateway } from './payment-gateway.interface';

@Injectable()
export class VNPayService implements PaymentGateway {
  private readonly logger = new Logger(VNPayService.name);

  constructor(private configService: ConfigService) {}

  private sortObject(obj: any): any {
    const sorted: any = {};
    const str: string[] = [];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (let key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }

  createPaymentUrl(
    ipAddr: string,
    order: Order,
    paymentData: CreatePaymentTransactionDto,
  ): string {
    const tmnCode = this.configService.get<string>('VNPAY_TMN_CODE');
    const secretKey = this.configService.get<string>('VNPAY_HASH_SECRET');
    const vnpUrl = this.configService.get<string>('VNPAY_URL');
    const returnUrl = this.configService.get<string>('VNPAY_RETURN_URL');

    // Use Vietnam time (UTC+7) for createDate
    const createDate = moment().tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss');
    const orderId = order.order_id;
    const amount = order.subtotal * 1.1 + order.delivery_fee;

    const vnp_Params: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: paymentData.orderType,
      vnp_Amount: Math.round(amount * 100),
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    if (paymentData.bankCode && paymentData.bankCode !== '') {
      vnp_Params.vnp_BankCode = paymentData.bankCode;
    }

    const sortedParams = this.sortObject(vnp_Params);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey || '');
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    sortedParams.vnp_SecureHash = signed;

    return (
      vnpUrl + '?' + querystring.stringify(sortedParams, { encode: false })
    );
  }
}
