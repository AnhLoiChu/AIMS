import { faker } from '@faker-js/faker';
import AppDataSource from '../../config/data-source.config';
import { Order } from '../../modules/order/entities/order.entity';
import { Cart } from '../../modules/cart/entities/cart.entity';
import { OrderStatus } from '../../modules/order/dto/order-status.enum';
export default async function seedOrders() {
  const orderRepo = AppDataSource.getRepository(Order);
  const cartRepo = AppDataSource.getRepository(Cart);

  const carts = await cartRepo.find();

  if (carts.length === 0) {
    throw new Error('No carts found. Please seed carts first.');
  }

  for (let i = 0; i < 20; i++) {
    const cart = faker.helpers.arrayElement(carts);

    const order = orderRepo.create({
      cart: cart,
      status: faker.helpers.arrayElement([
        OrderStatus.PLACING,
        OrderStatus.PENDING,
        OrderStatus.ACCEPTED,
        OrderStatus.REJECTED,
        OrderStatus.COMPLETED,
      ]),
      accept_date: faker.date.past(),
      subtotal: parseFloat(faker.commerce.price({ min: 20, max: 500 })),
      delivery_fee: parseFloat(faker.commerce.price({ min: 2, max: 20 })),
    });

    await orderRepo.save(order);
  }

  console.log('Seeded Orders');
}
