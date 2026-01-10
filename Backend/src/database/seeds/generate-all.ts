import { join, resolve } from 'path';
import AppDataSource from '../../config/data-source.config';

const orderedFiles = [
  'generate-users.ts',
  'generate-products.ts',
  'generate-order.ts',
  'generate-products-in-cart.ts',
  'generate-delivery-info.ts',
  'generate-order-description.ts',
  'generate-payment-transaction.ts',
  // Add more in the desired order
];

async function runGeneratorsInOrder() {
  await AppDataSource.initialize();
  const folderPath = resolve(__dirname, '../../database/seeds');

  for (const file of orderedFiles) {
    const filePath = join(folderPath, file);
    console.log(`Running ${file}...`);
    try {
      const module = (await import(filePath)) as unknown as {
        default?: () => Promise<void> | void;
      };
      if (typeof module.default === 'function') {
        await module.default();
      } else {
        console.warn(`No default export function found in ${file}`);
      }
    } catch (err) {
      console.error(`Failed to run ${file}:`, err);
      process.exit(1);
    }
  }

  console.log('All generator scripts executed in order.');
  await AppDataSource.destroy(); // Close the database connection
}

void runGeneratorsInOrder();
