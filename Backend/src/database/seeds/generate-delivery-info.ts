import { faker } from '@faker-js/faker/locale/en';
import AppDataSource from '../../config/data-source.config';
import { DeliveryInfo } from '../../modules/delivery-info/entities/delivery-info.entity';
import { Order } from '../../modules/order/entities/order.entity';

export default async function seedDeliveryInfo() {
  const deliveryInfoRepo = AppDataSource.getRepository(DeliveryInfo);
  const orderRepo = AppDataSource.getRepository(Order);

  const orders = await orderRepo.find();

  if (orders.length === 0) {
    console.log('No orders found. Please seed orders first.');
    return;
  }

  const provinces = [
    'thanh_pho_ha_noi',
    'thanh_pho_ho_chi_minh',
    'tinh_hai_phong',
    'tinh_da_nang',
    'tinh_can_tho',
    'tinh_binh_duong',
    'tinh_dong_nai',
    'tinh_quang_ninh',
  ];

  for (const order of orders) {
    // Check if order already has delivery info
    const existingDeliveryInfo = await deliveryInfoRepo.findOne({
      where: { order_id: order.order_id }
    });

    if (!existingDeliveryInfo) {
      const deliveryInfo = deliveryInfoRepo.create({
        order_id: order.order_id,
        recipient_name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        province: faker.helpers.arrayElement(provinces),
        address: faker.location.streetAddress({ useFullAddress: true }),

      });
      await deliveryInfoRepo.save(deliveryInfo);
    }
  }

  console.log('Seeded DeliveryInfo');
}
