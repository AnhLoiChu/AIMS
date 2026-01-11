import { faker } from '@faker-js/faker';
import AppDataSource from '../../config/data-source.config';
import { Order } from '../../modules/order/entities/order.entity';
import { Product } from '../../modules/product/entities/product.entity';
import { OrderDescription } from '../../modules/order-description/entities/order-description.entity';
import { DeliveryInfo } from '../../modules/delivery-info/entities/delivery-info.entity';

export default async function seedOrderDescriptions() {
  const orderRepo = AppDataSource.getRepository(Order);
  const productRepo = AppDataSource.getRepository(Product);
  const orderDescRepo = AppDataSource.getRepository(OrderDescription);
  const deliveryRepo = AppDataSource.getRepository(DeliveryInfo);

  const orders = await orderRepo.find();
  const products = await productRepo.find();
  const deliveryInfos = await deliveryRepo.find();

  if (orders.length === 0) {
    throw new Error('No orders found. Please seed orders first.');
  }
  if (products.length === 0) {
    throw new Error('No products found. Please seed products first.');
  }
  if (deliveryInfos.length === 0) {
    throw new Error('No delivery info found. Please seed delivery info first.');
  }

  console.log('Seeded OrderDescriptions');
}
