import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateFullProductDto } from './dto/update-full-product.dto';
import { ProductType } from './dto/base-product.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ProductController', () => {
  let controller: ProductController;
  let service: ProductService;

  // Mock data
  const mockUser = {
    user_id: 1,
    name: 'John Manager',
    email: 'manager@example.com',
    phone: '+84123456789',
    password: 'hashedpassword',
    roles: [],
    is_active: true,
    edit_count: 0,
    delete_count: 0,
  };

  const mockProduct = {
    product_id: 1,
    title: 'The Great Gatsby',
    value: 100,
    quantity: 10,
    current_price: 95,
    category: 'Literature',
    manager_id: 1,
    creation_date: new Date(),
    barcode: '1234567890123',
    description: 'A classic novel',
    weight: 0.5,
    dimensions: '20x15x3 cm',
    type: 'book' as const,
    warehouse_entrydate: new Date(),
    manager: mockUser,
  };

  const mockBookFields = {
    author: 'F. Scott Fitzgerald',
    cover_type: 'Hardcover',
    publisher: 'Scribner',
    publication_date: new Date('1925-04-10'),
    number_of_pages: 218,
    language: 'English',
    genre: 'Classic Literature',
  };

  const mockCreateProductDto: CreateProductDto = {
    title: 'The Great Gatsby',
    value: 100,
    quantity: 10,
    current_price: 95,
    category: 'Literature',
    manager_id: 1,
    creation_date: new Date(),
    barcode: '1234567890123',
    description: 'A classic novel',
    weight: 0.5,
    dimensions: '20x15x3 cm',
    warehouse_entrydate: new Date(),
    type: ProductType.BOOK,
    subtypeFields: mockBookFields,
  };

  const mockUpdateProductDto: UpdateFullProductDto = {
    title: 'The Great Gatsby - Updated',
    current_price: 90,
    quantity: 15,
    subtypeFields: {
      author: 'F. Scott Fitzgerald',
      genre: 'Modern Literature',
    },
  };

  beforeEach(async () => {
    const mockProductService = {
      create: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      deleteMultiple: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);
  });

  describe('create', () => {
    it('should create a new book product successfully', async () => {
      // Arrange
      const expectedResult = { ...mockProduct };
      jest.spyOn(service, 'create').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(mockCreateProductDto);

      // Assert
      expect(service.create).toHaveBeenCalledWith(mockCreateProductDto);
      expect(result).toEqual(expectedResult);
    });

    it('should create a CD product successfully', async () => {
      // Arrange
      const cdCreateDto: CreateProductDto = {
        ...mockCreateProductDto,
        type: ProductType.CD,
        subtypeFields: {
          artist: 'The Beatles',
          record_label: 'Apple Records',
          genre: 'Rock',
          tracklist: 'Come Together, Something',
          release_date: new Date('1969-09-26'),
        },
      };
      const expectedResult = { ...mockProduct, type: 'cd' as const };
      jest.spyOn(service, 'create').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(cdCreateDto);

      // Assert
      expect(service.create).toHaveBeenCalledWith(cdCreateDto);
      expect(result).toEqual(expectedResult);
    });

    it('should create a DVD product successfully', async () => {
      // Arrange
      const dvdCreateDto: CreateProductDto = {
        ...mockCreateProductDto,
        type: ProductType.DVD,
        subtypeFields: {
          director: 'Christopher Nolan',
          runtime: '148 minutes',
          studio: 'Warner Bros',
          language: 'English',
          subtitles: 'English, Spanish',
          disc_type: 'DVD',
          genre: 'Action',
          release_date: new Date('2010-07-16'),
        },
      };
      const expectedResult = { ...mockProduct, type: 'dvd' as const };
      jest.spyOn(service, 'create').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(dvdCreateDto);

      // Assert
      expect(service.create).toHaveBeenCalledWith(dvdCreateDto);
      expect(result).toEqual(expectedResult);
    });



    it('should handle service errors during creation', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      jest.spyOn(service, 'create').mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(controller.create(mockCreateProductDto)).rejects.toThrow(
        errorMessage,
      );
    });
  });

  describe('update', () => {
    it('should update a product successfully', async () => {
      // Arrange
      const productId = 1;
      const expectedResult = {
        product_id: 1,
        title: 'The Great Gatsby - Updated',
        value: 100,
        quantity: 15,
        current_price: 90,
        category: 'Literature',
        manager_id: 1,
        creation_date: new Date(),
        barcode: '1234567890123',
        description: 'A classic novel',
        weight: 0.5,
        dimensions: '20x15x3 cm',
        type: 'book' as const,
        warehouse_entrydate: new Date(),
        manager: mockUser,
      };
      jest.spyOn(service, 'update').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.update(productId, mockUpdateProductDto);

      // Assert
      expect(service.update).toHaveBeenCalledWith(productId, mockUpdateProductDto);
      expect(result).toEqual(expectedResult);
    });

    it('should update only base product fields', async () => {
      // Arrange
      const productId = 1;
      const updateDto = {
        title: 'Updated Title',
        current_price: 85,
        quantity: 20,
      };
      const expectedResult = { ...mockProduct, ...updateDto };
      jest.spyOn(service, 'update').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.update(productId, updateDto);

      // Assert
      expect(service.update).toHaveBeenCalledWith(productId, updateDto);
      expect(result).toEqual(expectedResult);
    });

    it('should update only subtype fields', async () => {
      // Arrange
      const productId = 1;
      const updateDto = {
        subtypeFields: {
          author: 'Updated Author',
          genre: 'Updated Genre',
        },
      };
      const expectedResult = { ...mockProduct };
      jest.spyOn(service, 'update').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.update(productId, updateDto);

      // Assert
      expect(service.update).toHaveBeenCalledWith(productId, updateDto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      // Arrange
      const productId = 999;
      jest.spyOn(service, 'update').mockResolvedValue(null);

      // Act & Assert
      await expect(
        controller.update(productId, mockUpdateProductDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when service throws not found error', async () => {
      // Arrange
      const productId = 1;
      const errorMessage = 'Product with id 1 not found';
      jest.spyOn(service, 'update').mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(
        controller.update(productId, mockUpdateProductDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle price validation errors', async () => {
      // Arrange
      const productId = 1;
      const errorMessage = 'Giá hiện tại phải nằm trong khoảng 30.00 - 150.00';
      jest.spyOn(service, 'update').mockRejectedValue(
        new BadRequestException(errorMessage),
      );

      // Act & Assert
      await expect(
        controller.update(productId, mockUpdateProductDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle edit limit validation errors', async () => {
      // Arrange
      const productId = 1;
      const errorMessage = 'Sản phẩm chỉ được chỉnh sửa tối đa 5 lần trong một ngày';
      jest.spyOn(service, 'update').mockRejectedValue(
        new BadRequestException(errorMessage),
      );

      // Act & Assert
      await expect(
        controller.update(productId, mockUpdateProductDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle manager edit limit validation errors', async () => {
      // Arrange
      const productId = 1;
      const errorMessage = 'Manager chỉ được chỉnh sửa tối đa 5 lần trong một ngày';
      jest.spyOn(service, 'update').mockRejectedValue(
        new BadRequestException(errorMessage),
      );

      // Act & Assert
      await expect(
        controller.update(productId, mockUpdateProductDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle unexpected service errors', async () => {
      // Arrange
      const productId = 1;
      const errorMessage = 'Unexpected database error';
      jest.spyOn(service, 'update').mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(
        controller.update(productId, mockUpdateProductDto),
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('findOne', () => {
    it('should return a product when found', async () => {
      // Arrange
      const productId = 1;
      jest.spyOn(service, 'findOne').mockResolvedValue(mockProduct);

      // Act
      const result = await controller.findOne(productId);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(productId);
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      // Arrange
      const productId = 999;
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(controller.findOne(productId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      // Arrange
      const expectedResult = [mockProduct];
      jest.spyOn(service, 'findAll').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should return empty array when no products exist', async () => {
      // Arrange
      const expectedResult = [];
      jest.spyOn(service, 'findAll').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('deleteMultiple', () => {
    it('should delete multiple products successfully', async () => {
      // Arrange
      const deleteDto = { productIds: [1, 2, 3] };
      const expectedResult = {
        success: true,
        deletedCount: 3,
        errorCount: 0,
        deletedProducts: [
          { id: 1, title: 'Product 1', type: 'book' },
          { id: 2, title: 'Product 2', type: 'cd' },
          { id: 3, title: 'Product 3', type: 'dvd' },
        ],
        errors: [],
        message: 'Successfully deleted 3 products',
      };
      jest.spyOn(service, 'deleteMultiple').mockResolvedValue(expectedResult);

      // Act
      const result = await controller.deleteMultiple(deleteDto);

      // Assert
      expect(service.deleteMultiple).toHaveBeenCalledWith(deleteDto);
      expect(result).toEqual(expectedResult);
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
