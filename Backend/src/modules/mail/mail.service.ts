import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { PaymentTransaction } from 'src/modules/payment-transaction/entities/payment-transaction.entity';
import { DeliveryInfo } from 'src/modules/delivery-info/entities/delivery-info.entity';
import { Order } from 'src/modules/order/entities/order.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(private readonly mailerService: MailerService) {}

  async sendOrderConfirmation(
    order: Order,
    transaction: PaymentTransaction,
    deliveryInfo: DeliveryInfo,
  ) {
    const subject = `Order Confirmation - #${order.order_id}`;
    const totalAmount = order.subtotal * 1.1 + order.delivery_fee;

    try {
      await this.mailerService.sendMail({
        to: deliveryInfo.email,
        subject,
        html: `
          <h1>Order Confirmation</h1>
          <p>Dear ${deliveryInfo.recipient_name},</p>
          <p>Thank you for your order. Here are the details:</p>
          <h2>Order Information</h2>
          <ul>
            <li><strong>Customer Name:</strong> ${deliveryInfo.recipient_name}</li>
            <li><strong>Phone Number:</strong> ${deliveryInfo.phone}</li>
            <li><strong>Shipping Address:</ strong> ${deliveryInfo.address}</li>
            <li><strong>Province:</strong> ${deliveryInfo.province}</li>
            <li><strong>Total Amount:</strong> ${totalAmount} VND</li>
          </ul>
          <h2>Transaction Information</h2>
          <ul>
            <li><strong>Transaction ID:</strong> ${transaction.payment_transaction_id}</li>
            <li><strong>Transaction Content:</strong> ${transaction.content}</li>
            <li><strong>Transaction Datetime:</strong> ${transaction.time}</li>
          </ul>
          <p>Your order is now waiting for approval processing.</p>
        `,
      });
      this.logger.log(`Order confirmation email sent to ${deliveryInfo.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send order confirmation email to ${deliveryInfo.email}`,
        error.stack,
      );
      throw error;
    }
  }
}
