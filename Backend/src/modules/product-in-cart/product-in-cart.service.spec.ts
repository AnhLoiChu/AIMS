import { Test, TestingModule } from '@nestjs/testing';
import { ProductInCartService } from './product-in-cart.service';

describe('ProductInCartService', () => {
  let service: ProductInCartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductInCartService],
    }).compile();

    service = module.get<ProductInCartService>(ProductInCartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
