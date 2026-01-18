import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { OrderDescription } from '../order-description/entities/order-description.entity';
import { EditHistory } from '../edit-history/entities/edit-history.entity';
import { BookService } from '../book/book.service';
import { DvdService } from '../dvd/dvd.service';
import { CdService } from '../cd/cd.service';
import { EditHistoryService } from '../edit-history/edit-history.service';
import { UserService } from '../user/user.service';
import { BadRequestException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateFullProductDto } from './dto/update-full-product.dto';
import { ProductType } from './dto/base-product.dto';
import { EDIT_LIMITS } from '../../constants/edit-limits.constants';

describe('ProductService', () => {
  let service: ProductService;
  let productRepo: jest.Mocked<Repository<Product>>;
  let productInCartRepo: jest.Mocked<Repository<ProductInCart>>;
  let orderDescriptionRepo: jest.Mocked<Repository<OrderDescription>>;
  let editHistoryRepo: jest.Mocked<Repository<EditHistory>>;
  let bookService: jest.Mocked<BookService>;
  let dvdService: jest.Mocked<DvdService>;
  let cdService: jest.Mocked<CdService>;
  let lpService: jest.Mocked<LpService>;
  let editHistoryService: jest.Mocked<EditHistoryService>;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProductInCart),
          useValue: {
            find: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OrderDescription),
          useValue: {
            find: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EditHistory),
          useValue: {
            find: jest.fn(),
            delete: jest.fn(),
          },
        },
                 {
           provide: BookService,
           useValue: {
             create: jest.fn(),
             findOne: jest.fn().mockImplementation((options) => Promise.resolve({ 
               book_id: 1, 
               author: 'Original Author', 
               publisher: 'Original Publisher' 
             })),
             update: jest.fn().mockResolvedValue({}),
           },
         },
        {
          provide: DvdService,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: CdService,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: LpService,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
                 {
           provide: EditHistoryService,
           useValue: {
             create: jest.fn().mockResolvedValue({}),
             getProductEditCountToday: jest.fn(),
             getManagerEditCountToday: jest.fn(),
           },
         },
                 {
           provide: UserService,
           useValue: {
             findOne: jest.fn(),
             findOneBy: jest.fn().mockResolvedValue({ user_id: 1, edit_count: 0 }),
             update: jest.fn().mockResolvedValue({}),
           },
         },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    productRepo = module.get(getRepositoryToken(Product));
    productInCartRepo = module.get(getRepositoryToken(ProductInCart));
    orderDescriptionRepo = module.get(getRepositoryToken(OrderDescription));
    editHistoryRepo = module.get(getRepositoryToken(EditHistory));
    bookService = module.get(BookService);
    dvdService = module.get(DvdService);
    cdService = module.get(CdService);
    lpService = module.get(LpService);
    editHistoryService = module.get(EditHistoryService);
    userService = module.get(UserService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('TC_01: Add a product with all valid fields', () => {
      it('should successfully create a book product with all valid fields', async () => {
        // Test Case ID: TC_01
        // Test Case Name: Add a product with all valid fields - Book
        // Description: Create a book product with all required and valid fields
        // Unit Under Test: ProductService.create()
        
        const createProductDto: CreateProductDto = {
           title: 'Test Book',
           value: 100,
           quantity: 10,
           current_price: 95,
           category: 'Literature',
           creation_date: new Date(),

           barcode: '1234567890123',
           description: 'A test book',
           weight: 0.5,
           dimensions: '20x15x3 cm',
           warehouse_entrydate: new Date(),
           manager_id: 1,
           type: ProductType.BOOK,
           subtypeFields: {
             author: 'Test Author',
             cover_type: 'Hardcover',
             publisher: 'Test Publisher',
             publication_date: new Date(),
             number_of_pages: 300,
             language: 'English',
             genre: 'Fiction'
           } as any
         };

        const mockQueryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(null),
        };

        productRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
        productRepo.create.mockReturnValue({ product_id: 1, ...createProductDto } as any);
        productRepo.save.mockResolvedValue({ product_id: 1, ...createProductDto } as any);
        bookService.create.mockResolvedValue({} as any);

        const result = await service.create(createProductDto);

        expect(productRepo.createQueryBuilder).toHaveBeenCalled();
        expect(productRepo.create).toHaveBeenCalledWith({
          title: 'Test Book',
          value: 100,
          quantity: 10,
          current_price: 95,
          category: 'Literature',

          barcode: '1234567890123',
          description: 'A test book',
          weight: 0.5,
          dimensions: '20x15x3 cm',
          manager_id: 1,
          type: ProductType.BOOK,
          creation_date: expect.any(Date),
          warehouse_entrydate: expect.any(Date),
        });
        expect(bookService.create).toHaveBeenCalled();
        expect(result).toHaveProperty('product_id', 1);
        // Expected Output: Product created successfully with ID 1
        // Actual Output: Product created successfully
        // Pass/Fail: Pass
      });
    });

    describe('TC_02: Add a product with duplicate name and barcode', () => {
      it('should throw BadRequestException when creating product with duplicate title and barcode', async () => {
        // Test Case ID: TC_02
        // Test Case Name: Add a product with duplicate name and barcode
        // Description: Attempt to create a product with existing title and barcode combination
        // Unit Under Test: ProductService.create()
        
                 const createProductDto: CreateProductDto = {
           title: 'Duplicate Book',
           value: 100,
           quantity: 10,
           current_price: 95,
           category: 'Literature',
           creation_date: new Date(),

           barcode: '1234567890123',
           description: 'A duplicate book',
           weight: 0.5,
           dimensions: '20x15x3 cm',
           warehouse_entrydate: new Date(),
           manager_id: 1,
           type: ProductType.BOOK,
           subtypeFields: {
             author: 'Test Author',
             cover_type: 'Hardcover',
             publisher: 'Test Publisher',
             publication_date: new Date(),
             number_of_pages: 300,
             language: 'English',
             genre: 'Fiction'
           } as any
         };

        const existingProduct = { product_id: 1, title: 'Duplicate Book', barcode: '1234567890123', manager_id: 1 };

        const mockQueryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(existingProduct),
        };

        productRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

        await expect(service.create(createProductDto)).rejects.toThrow(BadRequestException);
        await expect(service.create(createProductDto)).rejects.toThrow(
          'Đã tồn tại sản phẩm có cùng tên "Duplicate Book" và barcode "1234567890123" trong cùng manager ID 1'
        );
        // Expected Output: BadRequestException with duplicate message
        // Actual Output: BadRequestException thrown
        // Pass/Fail: Pass
      });
    });
  });

  describe('update', () => {
    describe('TC_03: Edit a product successfully', () => {
      it('should successfully update a product with valid data', async () => {
        // Test Case ID: TC_03
        // Test Case Name: Edit a product successfully
        // Description: Update an existing product with valid data within all limits
        // Unit Under Test: ProductService.update()
        
        const productId = 1;
        const updateProductDto: UpdateFullProductDto = {
          title: 'Updated Book Title',
          current_price: 85,
          description: 'Updated description',
                     subtypeFields: {
             author: 'Updated Author'
           } as any
        };

        const existingProduct = {
          product_id: 1,
          title: 'Original Book',
          value: 100,
          current_price: 90,
          manager_id: 1,
          type: ProductType.BOOK
        };

                 const mockQueryBuilder = {
           where: jest.fn().mockReturnThis(),
           andWhere: jest.fn().mockReturnThis(),
           getOne: jest.fn().mockResolvedValue(null), // No duplicate found
         };

         productRepo.findOne.mockResolvedValue(existingProduct as any);
         productRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
         editHistoryService.getProductEditCountToday.mockResolvedValue(2); // Less than limit
         editHistoryService.getManagerEditCountToday.mockResolvedValue(3); // Less than limit
         productRepo.update.mockResolvedValue({} as any);
         bookService.update.mockResolvedValue({} as any);
         editHistoryService.create.mockResolvedValue({} as any);
         
         // Mock the final findOne call to return updated product
         jest.spyOn(service, 'findOne').mockResolvedValue({
           ...existingProduct,
           ...updateProductDto,
           author: 'Updated Author'
         } as any);

        await service.update(productId, updateProductDto);

        expect(productRepo.findOne).toHaveBeenCalledWith({ where: { product_id: productId } });
        expect(editHistoryService.getProductEditCountToday).toHaveBeenCalledWith(productId);
        expect(editHistoryService.getManagerEditCountToday).toHaveBeenCalledWith(1);
        expect(productRepo.update).toHaveBeenCalled();
        expect(editHistoryService.create).toHaveBeenCalled();
        // Expected Output: Product updated successfully with edit history created
        // Actual Output: Product updated successfully
        // Pass/Fail: Pass
      });
    });

    describe('TC_04: Edit a product while product edit limit exceeded', () => {
      it('should throw BadRequestException when product edit limit is exceeded', async () => {
        // Test Case ID: TC_04
        // Test Case Name: Edit a product while product edit limit exceeded
        // Description: Attempt to edit a product that has reached daily edit limit
        // Unit Under Test: ProductService.update()
        
        const productId = 1;
        const updateProductDto: UpdateFullProductDto = {
          title: 'Updated Book Title'
        };

        const existingProduct = {
          product_id: 1,
          manager_id: 1,
          value: 100
        };

        productRepo.findOne.mockResolvedValue(existingProduct as any);
        editHistoryService.getProductEditCountToday.mockResolvedValue(EDIT_LIMITS.MAX_PRODUCT_EDITS_PER_DAY); // At limit

        await expect(service.update(productId, updateProductDto)).rejects.toThrow(BadRequestException);
        await expect(service.update(productId, updateProductDto)).rejects.toThrow(
          `Sản phẩm chỉ được chỉnh sửa tối đa ${EDIT_LIMITS.MAX_PRODUCT_EDITS_PER_DAY} lần trong một ngày`
        );
        // Expected Output: BadRequestException with product edit limit message
        // Actual Output: BadRequestException thrown
        // Pass/Fail: Pass
      });
    });

    describe('TC_05: Edit a product while manager edit limit exceeded', () => {
      it('should throw BadRequestException when manager edit limit is exceeded', async () => {
        // Test Case ID: TC_05
        // Test Case Name: Edit a product while manager edit limit exceeded
        // Description: Attempt to edit a product when manager has reached daily edit limit
        // Unit Under Test: ProductService.update()
        
        const productId = 1;
        const updateProductDto: UpdateFullProductDto = {
          title: 'Updated Book Title'
        };

        const existingProduct = {
          product_id: 1,
          manager_id: 1,
          value: 100
        };

        productRepo.findOne.mockResolvedValue(existingProduct as any);
        editHistoryService.getProductEditCountToday.mockResolvedValue(2); // Under product limit
        editHistoryService.getManagerEditCountToday.mockResolvedValue(EDIT_LIMITS.MAX_MANAGER_EDITS_PER_DAY); // At manager limit

        await expect(service.update(productId, updateProductDto)).rejects.toThrow(BadRequestException);
        await expect(service.update(productId, updateProductDto)).rejects.toThrow(
          `Manager chỉ được chỉnh sửa tối đa ${EDIT_LIMITS.MAX_MANAGER_EDITS_PER_DAY} lần trong một ngày`
        );
        // Expected Output: BadRequestException with manager edit limit message
        // Actual Output: BadRequestException thrown
        // Pass/Fail: Pass
      });
    });

    describe('TC_06: Edit product with price above/below maximum/minimum allowed', () => {
      it('should throw BadRequestException when price is below minimum allowed', async () => {
        // Test Case ID: TC_06a
        // Test Case Name: Edit product with price below minimum allowed
        // Description: Attempt to set current_price below 30% of product value
        // Unit Under Test: ProductService.update()
        
        const productId = 1;
        const productValue = 100;
        const updateProductDto: UpdateFullProductDto = {
          current_price: 25 // Below 30% of value (30)
        };

        const existingProduct = {
          product_id: 1,
          manager_id: 1,
          value: productValue
        };

        productRepo.findOne.mockResolvedValue(existingProduct as any);
        editHistoryService.getProductEditCountToday.mockResolvedValue(2);
        editHistoryService.getManagerEditCountToday.mockResolvedValue(3);

        const minPrice = productValue * EDIT_LIMITS.MIN_PRICE_PERCENTAGE;
        const maxPrice = productValue * EDIT_LIMITS.MAX_PRICE_PERCENTAGE;

        await expect(service.update(productId, updateProductDto)).rejects.toThrow(BadRequestException);
        await expect(service.update(productId, updateProductDto)).rejects.toThrow(
          `Giá hiện tại phải nằm trong khoảng ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`
        );
        // Expected Output: BadRequestException with price range message
        // Actual Output: BadRequestException thrown
        // Pass/Fail: Pass
      });

      it('should throw BadRequestException when price is above maximum allowed', async () => {
        // Test Case ID: TC_06b
        // Test Case Name: Edit product with price above maximum allowed
        // Description: Attempt to set current_price above 150% of product value
        // Unit Under Test: ProductService.update()
        
        const productId = 1;
        const productValue = 100;
        const updateProductDto: UpdateFullProductDto = {
          current_price: 160 // Above 150% of value (150)
        };

        const existingProduct = {
          product_id: 1,
          manager_id: 1,
          value: productValue
        };

        productRepo.findOne.mockResolvedValue(existingProduct as any);
        editHistoryService.getProductEditCountToday.mockResolvedValue(2);
        editHistoryService.getManagerEditCountToday.mockResolvedValue(3);

        const minPrice = productValue * EDIT_LIMITS.MIN_PRICE_PERCENTAGE;
        const maxPrice = productValue * EDIT_LIMITS.MAX_PRICE_PERCENTAGE;

        await expect(service.update(productId, updateProductDto)).rejects.toThrow(BadRequestException);
        await expect(service.update(productId, updateProductDto)).rejects.toThrow(
          `Giá hiện tại phải nằm trong khoảng ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`
        );
        // Expected Output: BadRequestException with price range message
        // Actual Output: BadRequestException thrown
        // Pass/Fail: Pass
      });
    });

    describe('TC_07: Edit product must create edit_history', () => {
      it('should create edit history when product is successfully updated', async () => {
        // Test Case ID: TC_07
        // Test Case Name: Edit product must create edit_history
        // Description: Verify that edit history is created when product is updated
        // Unit Under Test: ProductService.update()
        // 
        // THUẬT TOÁN KIỂM TRA TC07:
        // 1. Thực hiện thay đổi product với dữ liệu cụ thể
        // 2. Kiểm tra editHistoryService.create được gọi với:
        //    - product_id: ID của sản phẩm được sửa
        //    - action: 'edit' (từ EditAction.EDIT enum)
        //    - change_description: Mô tả chi tiết những thay đổi
        // 3. Xác minh change_description chứa format: "field: oldValue ---> newValue"
        // 4. Đảm bảo tất cả thay đổi được ghi lại trong edit_history
        
        const productId = 1;
        const updateProductDto: UpdateFullProductDto = {
          title: 'Updated Title',
          current_price: 85
        };

        const existingProduct = {
          product_id: 1,
          title: 'Original Title',
          current_price: 90,
          manager_id: 1,
          value: 100,
          type: ProductType.BOOK
        };

        const mockQueryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(null), // No duplicate found
        };

        productRepo.findOne.mockResolvedValue(existingProduct as any);
        productRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
        editHistoryService.getProductEditCountToday.mockResolvedValue(2);
        editHistoryService.getManagerEditCountToday.mockResolvedValue(3);
        productRepo.update.mockResolvedValue({} as any);
        bookService.update.mockResolvedValue({} as any);
        editHistoryService.create.mockResolvedValue({} as any);
        
        // Mock the final findOne call to return updated product
        jest.spyOn(service, 'findOne').mockResolvedValue({
          ...existingProduct,
          ...updateProductDto
        } as any);

        await service.update(productId, updateProductDto);

        // KIỂM TRA THUẬT TOÁN EDIT_HISTORY:
        // 1. Xác minh editHistoryService.create được gọi
        expect(editHistoryService.create).toHaveBeenCalledTimes(1);
        
        // 2. Kiểm tra các tham số được truyền vào edit_history
        expect(editHistoryService.create).toHaveBeenCalledWith({
          product_id: productId,
          action: 'edit',
          change_description: expect.stringMatching(/title: Original Title ---> Updated Title.*current_price: 90 ---> 85/)
        });

        // 3. Xác minh change_description chứa đúng format thay đổi
        const createCall = editHistoryService.create.mock.calls[0][0];
        const changeDescription = createCall.change_description;
        
        // Kiểm tra format "field: oldValue ---> newValue"
        expect(changeDescription).toContain('title: Original Title ---> Updated Title');
        expect(changeDescription).toContain('current_price: 90 ---> 85');
        
        // Expected Output: Edit history created with change description
        // Actual Output: Edit history created successfully
        // Pass/Fail: Pass
        // 
        // NOTES: Thuật toán đảm bảo:
        // - Mọi thay đổi được ghi lại trong bảng edit_history
        // - Change description có format chuẩn: "field: old ---> new"
        // - Product_id được liên kết chính xác
        // - Action type là 'edit' cho các thao tác cập nhật
      });

      it('should create edit history with detailed change tracking for multiple fields', async () => {
        // Test Case ID: TC_07b
        // Test Case Name: Edit product with multiple fields - detailed change tracking
        // Description: Verify edit history captures all field changes accurately
        
        const productId = 1;
        const updateProductDto: UpdateFullProductDto = {
          title: 'New Title',
          current_price: 80,
          description: 'New Description',
          subtypeFields: {
            author: 'New Author'
          } as any
        };

        const existingProduct = {
          product_id: 1,
          title: 'Old Title',
          current_price: 100,
          description: 'Old Description',
          manager_id: 1,
          value: 100,
          type: ProductType.BOOK
        };

        const mockQueryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(null),
        };

        productRepo.findOne.mockResolvedValue(existingProduct as any);
        productRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
        editHistoryService.getProductEditCountToday.mockResolvedValue(1);
        editHistoryService.getManagerEditCountToday.mockResolvedValue(2);
        productRepo.update.mockResolvedValue({} as any);
        editHistoryService.create.mockResolvedValue({} as any);
        
        jest.spyOn(service, 'findOne').mockResolvedValue({
          ...existingProduct,
          ...updateProductDto
        } as any);

        await service.update(productId, updateProductDto);

        // THUẬT TOÁN KIỂM TRA CHI TIẾT:
        const createCall = editHistoryService.create.mock.calls[0][0];
        const changeDescription = createCall.change_description;
        
        // Xác minh tất cả thay đổi được ghi lại
        expect(changeDescription).toContain('title: Old Title ---> New Title');
        expect(changeDescription).toContain('current_price: 100 ---> 80');
        expect(changeDescription).toContain('description: Old Description ---> New Description');
        expect(changeDescription).toContain('author: Original Author ---> New Author');
        
        // Kiểm tra format tổng thể (các thay đổi được phân cách bằng dấu phẩy)
        expect(changeDescription).toMatch(/.*,.*,.*,.*/) // Ít nhất 4 thay đổi được ghi lại
      });
    });
  });

  describe('findOne', () => {
    it('should return product with subtype data', async () => {
      // Test Case ID: TC_08
      // Test Case Name: Find product with valid ID
      // Description: Retrieve a product by ID including its subtype data
      // Unit Under Test: ProductService.findOne()
      
      const productId = 1;
      const mockProduct = {
        product_id: 1,
        title: 'Test Book',
        type: ProductType.BOOK
      };

      const mockBookData = {
        book_id: 1,
        author: 'Test Author',
        publisher: 'Test Publisher'
      };

      productRepo.findOne.mockResolvedValue(mockProduct as any);
      bookService.findOne.mockResolvedValue(mockBookData as any);

      const result = await service.findOne(productId);

      expect(productRepo.findOne).toHaveBeenCalledWith({ where: { product_id: productId } });
      expect(bookService.findOne).toHaveBeenCalledWith({ where: { book_id: productId } });
      expect(result).toEqual({ ...mockProduct, ...mockBookData });
      // Expected Output: Product with subtype data
      // Actual Output: Product with book data merged
      // Pass/Fail: Pass
    });

    it('should return null when product not found', async () => {
      // Test Case ID: TC_09
      // Test Case Name: Find product with invalid ID
      // Description: Attempt to retrieve a product with non-existent ID
      // Unit Under Test: ProductService.findOne()
      
      const productId = 999;
      productRepo.findOne.mockResolvedValue(null);

      const result = await service.findOne(productId);

      expect(result).toBeNull();
      // Expected Output: null
      // Actual Output: null
      // Pass/Fail: Pass
    });
  });
  describe('findAll', () => {
    it('should return filtered products with pagination', async () => {
      // Test Case ID: TC_10
      // Test Case Name: Find products with filters
      // Description: Find products with search, category, and price filters
      
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      productRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.findAll({
        search: 'test',
        category: 'book',
        minPrice: 10,
        maxPrice: 100,
        sort: 'price_asc',
        limit: 10
      });

      expect(productRepo.createQueryBuilder).toHaveBeenCalledWith('product');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(product.title) LIKE LOWER(:search) OR LOWER(product.category) LIKE LOWER(:search))',
        { search: '%test%' }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('product.type = :category', { category: 'book' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('product.current_price >= :minPrice', { minPrice: 10 });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('product.current_price <= :maxPrice', { maxPrice: 100 });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('product.current_price', 'ASC');
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should sort by random when sort param is random', async () => {
        const mockQueryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        };
  
        productRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
  
        await service.findAll({
          limit: 20,
          sort: 'random'
        });
  
        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('RANDOM()');
    });
  });
});
