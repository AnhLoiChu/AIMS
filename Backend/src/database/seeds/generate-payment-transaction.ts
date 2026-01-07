import { faker } from '@faker-js/faker';
import AppDataSource from '../../config/data-source.config';
import { Order } from '../../modules/order/entities/order.entity';
import { PaymentTransaction } from '../../modules/payment-transaction/entities/payment-transaction.entity';

export default async function seedPaymentTransactions() {
  const orderRepo = AppDataSource.getRepository(Order);
  const paymentRepo = AppDataSource.getRepository(PaymentTransaction);

  const orders = await orderRepo.find();

  if (orders.length === 0) {
    throw new Error('No orders found. Please seed orders first.');
  }

  const selectedOrders = faker.helpers.shuffle(orders).slice(0, 15);

  for (const order of selectedOrders) {
    const payment = paymentRepo.create({
      method: faker.helpers.arrayElement([
        'Credit Card',
        'Bank Transfer',
        'PayPal',
        'VNPAY',
      ]),
      bank_name: faker.company.name(),
      time: faker.date.recent(),
      content: faker.lorem.sentence(),
      status: faker.helpers.arrayElement([
        'PENDING',
        'SUCCESS',
        'FAILED',
        'CANCELLED',
      ]),
      order_id: order.order_id,
      vnp_txn_ref: faker.string.alphanumeric(10),
      vnp_transaction_no: faker.string.alphanumeric(10),
      vnp_response_code: faker.helpers.arrayElement([
        '00',
        '01',
        '02',
        '03',
        '04',
      ]),
      raw_response: JSON.stringify({
        transaction_id: faker.string.alphanumeric(10),
        amount: faker.number.int({ min: 10000, max: 1000000 }),
        status: faker.helpers.arrayElement(['SUCCESS', 'FAILED']),
      }),
    });

    await paymentRepo.save(payment);
  }

  console.log('Seeded PaymentTransactions');
}
