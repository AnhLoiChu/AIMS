import { faker } from '@faker-js/faker/locale/en';
import AppDataSource from '../../config/data-source.config';
import { Product } from '../../modules/product/entities/product.entity';
import { Book } from '../../modules/book/entities/book.entity';
import { CD } from '../../modules/cd/entities/cd.entity';
import { DVD } from '../../modules/dvd/entities/dvd.entity';
import { News } from '../../modules/news/entities/news.entity';
import { User } from '../../modules/user/entities/user.entity';

export default async function seedProducts() {
  const productRepo = AppDataSource.getRepository(Product);
  const bookRepo = AppDataSource.getRepository(Book);
  const cdRepo = AppDataSource.getRepository(CD);
  const dvdRepo = AppDataSource.getRepository(DVD);
  const newsRepo = AppDataSource.getRepository(News);
  const managerRepo = AppDataSource.getRepository(User);

  const managers = await managerRepo.find({ where: { is_active: true } });

  if (managers.length === 0) {
    console.log('No active managers found. Please seed managers first.');
    return;
  }

  const categories = [
    'Fiction',
    'Music',
    'Movies',
    'Newspaper',
    'Educational',
    'Entertainment',
  ];

  // Helper function to ensure current_price is within 30%-150% of value
  const generateValidPrice = (value: number) => {
    const minPrice = value * 0.3; // 30% of value
    const maxPrice = value * 1.5; // 150% of value
    return Math.round(faker.number.float({ min: minPrice, max: maxPrice }));
  };

  // BOOKS - 25 items (50,000 - 300,000 VND)
  console.log('Creating books...');
  for (let i = 0; i < 25; i++) {
    const value = faker.number.int({ min: 50000, max: 300000 });

    const baseProduct = productRepo.create({
      title: `${faker.lorem.words(2)} ${faker.lorem.word()}`,
      value: value,
      quantity: faker.number.int({ min: 0, max: 500 }),
      current_price: generateValidPrice(value),
      category: faker.helpers.arrayElement(categories),
      manager_id: faker.helpers.arrayElement(managers).user_id,
      creation_date: faker.date.past({ years: 2 }),
      barcode: faker.string.numeric(13),
      description: faker.lorem.paragraph(2),
      type: 'book',
      weight: parseFloat(
        faker.number.float({ min: 0.1, max: 2.0, fractionDigits: 2 }).toString(),
      ),
      dimensions: `${faker.number.int({ min: 10, max: 30 })}x${faker.number.int({ min: 15, max: 25 })}x${faker.number.int({ min: 1, max: 5 })} cm`,
      warehouse_entrydate: faker.date.past({ years: 1 }),
    });
    const product = await productRepo.save(baseProduct);

    const book = bookRepo.create({
      book_id: product.product_id,
      author: faker.person.fullName(),
      cover_type: faker.helpers.arrayElement(['Hardcover', 'Paperback', 'Ebook']),
      publisher: faker.company.name(),
      publication_date: faker.date.past({ years: 5 }),
      number_of_pages: faker.number.int({ min: 100, max: 500 }),
      language: faker.helpers.arrayElement(['English', 'Vietnamese', 'French', 'Spanish']),
      genre: faker.helpers.arrayElement(['Fiction', 'Mystery', 'Romance', 'Science Fiction', 'Biography', 'History']),
    });
    await bookRepo.save(book);
  }

  // CDS - 20 items (80,000 - 200,000 VND)
  console.log('Creating CDs...');
  for (let i = 0; i < 20; i++) {
    const value = faker.number.int({ min: 80000, max: 200000 });

    const baseProduct = productRepo.create({
      title: `${faker.music.songName()} Album`,
      value: value,
      quantity: faker.number.int({ min: 0, max: 200 }),
      current_price: generateValidPrice(value),
      category: faker.helpers.arrayElement(categories),
      manager_id: faker.helpers.arrayElement(managers).user_id,
      creation_date: faker.date.past({ years: 2 }),
      barcode: faker.string.numeric(13),
      description: faker.lorem.paragraph(2),
      type: 'cd',
      weight: parseFloat(
        faker.number.float({ min: 0.1, max: 0.3, fractionDigits: 2 }).toString(),
      ),
      dimensions: `14.2x12.5x1.0 cm`,
      warehouse_entrydate: faker.date.past({ years: 1 }),
    });
    const product = await productRepo.save(baseProduct);

    const trackList = Array.from(
      { length: faker.number.int({ min: 8, max: 16 }) },
      (_, index) => `${index + 1}. ${faker.music.songName()}`,
    ).join(', ');

    const cd = cdRepo.create({
      cd_id: product.product_id,
      artist: faker.person.fullName(),
      genre: faker.helpers.arrayElement(['Rock', 'Pop', 'Jazz', 'Classical', 'Electronic', 'Hip Hop']),
      record_label: faker.company.name(),
      tracklist: trackList,
      release_date: faker.date.past({ years: 10 }),
    });
    await cdRepo.save(cd);
  }

  // DVDS - 30 items (100,000 - 330,000 VND)
  console.log('Creating DVDs...');
  for (let i = 0; i < 30; i++) {
    const value = faker.number.int({ min: 100000, max: 330000 });

    const baseProduct = productRepo.create({
      title: `${faker.lorem.words(2)} Movie`,
      value: value,
      quantity: faker.number.int({ min: 0, max: 100 }),
      current_price: generateValidPrice(value),
      category: faker.helpers.arrayElement(categories),
      manager_id: faker.helpers.arrayElement(managers).user_id,
      creation_date: faker.date.past({ years: 2 }),
      barcode: faker.string.numeric(13),
      description: faker.lorem.paragraph(2),
      type: 'dvd',
      weight: parseFloat(
        faker.number.float({ min: 0.1, max: 0.2, fractionDigits: 2 }).toString(),
      ),
      dimensions: `19.0x13.5x1.5 cm`,
      warehouse_entrydate: faker.date.past({ years: 1 }),
    });
    const product = await productRepo.save(baseProduct);

    const dvd = dvdRepo.create({
      dvd_id: product.product_id,
      language: faker.helpers.arrayElement(['English', 'Vietnamese', 'French', 'Japanese', 'Korean']),
      subtitles: faker.helpers.arrayElement(['English', 'Vietnamese', 'French', 'Spanish', 'None']),
      runtime: `${faker.number.int({ min: 90, max: 180 })} minutes`,
      disc_type: faker.helpers.arrayElement(['DVD', 'Blu-ray', 'HD-DVD']),
      release_date: faker.date.past({ years: 15 }),
      studio: faker.company.name(),
      director: faker.person.fullName(),
      genre: faker.helpers.arrayElement(['Action', 'Comedy', 'Drama', 'Horror', 'Thriller', 'Documentary']),
    });
    await dvdRepo.save(dvd);
  }

  // NEWS (Newspaper) - 15 items (15,000 - 80,000 VND)
  console.log('Creating News (Newspapers)...');
  for (let i = 0; i < 15; i++) {
    const value = faker.number.int({ min: 15000, max: 80000 });

    const baseProduct = productRepo.create({
      title: `${faker.company.name()} ${faker.helpers.arrayElement(['Daily', 'Weekly', 'Monthly', 'Times', 'Tribune', 'Post'])}`,
      value: value,
      quantity: faker.number.int({ min: 0, max: 1000 }),
      current_price: generateValidPrice(value),
      category: 'Newspaper',
      manager_id: faker.helpers.arrayElement(managers).user_id,
      creation_date: faker.date.past({ years: 2 }),
      barcode: faker.string.numeric(13),
      description: faker.lorem.paragraph(2),
      type: 'news',
      weight: parseFloat(
        faker.number.float({ min: 0.05, max: 0.3, fractionDigits: 2 }).toString(),
      ),
      dimensions: `40x30x0.5 cm`,
      warehouse_entrydate: faker.date.past({ years: 1 }),
    });
    const product = await productRepo.save(baseProduct);

    const sections = faker.helpers.arrayElements(
      ['Politics', 'Economy', 'Sports', 'Culture', 'Entertainment', 'Technology', 'Health', 'Education'],
      faker.number.int({ min: 3, max: 6 }),
    ).join(', ');

    const news = newsRepo.create({
      news_id: product.product_id,
      editor_in_chief: faker.person.fullName(),
      publisher: faker.company.name(),
      publication_date: faker.date.recent({ days: 30 }),
      issue_number: `Issue ${faker.number.int({ min: 1, max: 500 })}`,
      publication_frequency: faker.helpers.arrayElement(['daily', 'weekly', 'monthly', 'quarterly']),
      issn: faker.string.numeric(8),
      language: faker.helpers.arrayElement(['Vietnamese', 'English', 'French']),
      sections: sections,
    });
    await newsRepo.save(news);
  }

  console.log('Seeded Products, Books, CDs, DVDs, News (prices in VND)');
}
