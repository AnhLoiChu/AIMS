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
        'VIETQR',
        'PayPal',
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
