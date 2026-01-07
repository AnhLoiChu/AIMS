import { faker } from '@faker-js/faker';
import AppDataSource from '../../config/data-source.config';
import { Cart } from '../../modules/cart/entities/cart.entity';
import { Product } from '../../modules/product/entities/product.entity';
import { ProductInCart } from '../../modules/product-in-cart/entities/product-in-cart.entity'; // Adjust if needed

export default async function seedProductsInCart() {
  const cartRepo = AppDataSource.getRepository(Cart);
  const productRepo = AppDataSource.getRepository(Product);
  const productInCartRepo = AppDataSource.getRepository(ProductInCart);

  const carts = await cartRepo.find();
  const products = await productRepo.find();

  if (carts.length === 0) {
    throw new Error('No carts found. Please seed carts first.');
  }
  if (products.length === 0) {
    throw new Error('No products found. Please seed products first.');
  }

  for (const cart of carts) {
    const numberOfProducts = faker.number.int({ min: 1, max: 5 });
    const selectedProducts = faker.helpers.arrayElements(
      products,
      numberOfProducts,
    );

    for (const product of selectedProducts) {
      const productInCart = productInCartRepo.create({
        cart_id: cart.cart_id,
        product_id: product.product_id,
        quantity: faker.number.int({ min: 1, max: 10 }),
      });
      await productInCartRepo.save(productInCart);
    }
  }

  console.log('Seeded ProductInCarts');
}
