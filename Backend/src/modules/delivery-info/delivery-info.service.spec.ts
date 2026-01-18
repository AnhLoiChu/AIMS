import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryInfoService } from './delivery-info.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeliveryInfo } from './entities/delivery-info.entity';
import { Order } from '../order/entities/order.entity';
import { Cart } from '../cart/entities/cart.entity';
import { User } from '../user/entities/user.entity';
import { Role, RoleName } from '../role/entities/role.entity';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { CreateDeliveryInfoDto } from './dto/create-delivery-info.dto';
import { OrderStatus } from '../order/dto/order-status.enum';

// Mock TypeOrmCrudService to avoid real constructor logic
jest.mock('@dataui/crud-typeorm', () => ({
  TypeOrmCrudService: jest.fn().mockImplementation(() => ({})),
}));

describe('DeliveryInfoService', () => {
  let service: DeliveryInfoService;
  let deliveryInfoRepository: any;
  let orderRepository: any;

  beforeEach(async () => {
    deliveryInfoRepository = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest.fn().mockResolvedValue({}),
    };
    orderRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryInfoService,
        {
          provide: getRepositoryToken(DeliveryInfo),
          useValue: deliveryInfoRepository,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepository,
        },
      ],
    }).compile();

    service = module.get<DeliveryInfoService>(DeliveryInfoService);
    // Patch the prototype so methods are available
    Object.setPrototypeOf(service, DeliveryInfoService.prototype);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNormalDeliveryInfo', () => {
    const mockCustomerRole: Role = {
      role_id: 1,
      name: RoleName.CUSTOMER,
    };

    const mockUser: User = {
      user_id: 1,
      name: 'Test User',
      email: 'test@example.com',
      phone: '+84123456789',
      password: 'hashedpassword',
      roles: [mockCustomerRole],
      is_active: true,
      edit_count: 0,
      delete_count: 0,
    };

    const mockCart: Cart = {
      cart_id: 1,
      customer_id: 1,
      customer: mockUser,
    };

    const mockOrder: Order = {
      order_id: 1,
      cart_id: 1,
      subtotal: 100,
      status: OrderStatus.PENDING,
      accept_date: new Date(),
      delivery_fee: 10,
      cart: mockCart,
    };

    const validNormalDeliveryDto: CreateDeliveryInfoDto = {
      recipient_name: 'John Doe',
      email: 'john@example.com',
      phone: '0123456789',
      province: 'HN',
      address: '123 Hanoi Street',
      instruction: null,
      delivery_time: null,
    };

    const mockDeliveryInfo: DeliveryInfo = {
      delivery_id: 1,
      recipient_name: 'John Doe',
      email: 'john@example.com',
      phone: '0123456789',
      order_id: 1,
      province: 'HN',
      address: '123 Hanoi Street',
      instruction: null,
      delivery_time: null,
      order: mockOrder,
    };

    describe('Success Scenarios', () => {
      it('should create normal delivery info successfully', async () => {
        deliveryInfoRepository.create.mockReturnValue(mockDeliveryInfo);
        deliveryInfoRepository.save.mockResolvedValue(mockDeliveryInfo);

        const result = await service.createDeliveryInfo(validNormalDeliveryDto);

        expect(deliveryInfoRepository.create).toHaveBeenCalledWith(
          validNormalDeliveryDto,
        );
        expect(deliveryInfoRepository.save).toHaveBeenCalledWith(
          mockDeliveryInfo,
        );
        expect(result).toEqual(mockDeliveryInfo);
      });

      it('should create normal delivery info with undefined instruction and delivery_time', async () => {
        const dtoWithUndefined = {
          ...validNormalDeliveryDto,
          instruction: null,
          delivery_time: null,
        };
        const mockDeliveryInfoWithUndefined = {
          ...mockDeliveryInfo,
          instruction: null,
          delivery_time: null,
        };

        deliveryInfoRepository.create.mockReturnValue(
          mockDeliveryInfoWithUndefined,
        );
        deliveryInfoRepository.save.mockResolvedValue(
          mockDeliveryInfoWithUndefined,
        );

        const result = await service.createDeliveryInfo(dtoWithUndefined);

        expect(deliveryInfoRepository.create).toHaveBeenCalledWith(
          dtoWithUndefined,
        );
        expect(deliveryInfoRepository.save).toHaveBeenCalledWith(
          mockDeliveryInfoWithUndefined,
        );
        expect(result).toEqual(mockDeliveryInfoWithUndefined);
      });
    });

    describe('Validation Scenarios', () => {
      it('should throw BadRequestException if recipient_name is missing', async () => {
        const dtoWithoutRecipientName = {
          ...validNormalDeliveryDto,
          recipient_name: null as any,
        };

        await expect(service.createDeliveryInfo(dtoWithoutRecipientName)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.createDeliveryInfo(dtoWithoutRecipientName)).rejects.toMatchObject({
          response: {
            code: 'RECIPIENT_NAME_REQUIRED',
            message: 'Recipient name is required and cannot be empty',
          },
        });
      });

      it('should throw BadRequestException if recipient_name is empty string', async () => {
        const dtoWithEmptyRecipientName = {
          ...validNormalDeliveryDto,
          recipient_name: '',
        };

        await expect(service.createDeliveryInfo(dtoWithEmptyRecipientName)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.createDeliveryInfo(dtoWithEmptyRecipientName)).rejects.toMatchObject({
          response: {
            code: 'RECIPIENT_NAME_REQUIRED',
            message: 'Recipient name is required and cannot be empty',
          },
        });
      });

      it('should throw BadRequestException if recipient_name is whitespace only', async () => {
        const dtoWithWhitespaceRecipientName = {
          ...validNormalDeliveryDto,
          recipient_name: '   ',
        };

        await expect(service.createDeliveryInfo(dtoWithWhitespaceRecipientName)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.createDeliveryInfo(dtoWithWhitespaceRecipientName)).rejects.toMatchObject({
          response: {
            code: 'RECIPIENT_NAME_REQUIRED',
            message: 'Recipient name is required and cannot be empty',
          },
        });
      });

      it('should throw BadRequestException if email is missing', async () => {
        const dtoWithoutEmail = {
          ...validNormalDeliveryDto,
          email: null as any,
        };

        await expect(service.createDeliveryInfo(dtoWithoutEmail)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.createDeliveryInfo(dtoWithoutEmail)).rejects.toMatchObject({
          response: {
            code: 'EMAIL_REQUIRED',
            message: 'Email is required and cannot be empty',
          },
        });
      });

      it('should throw BadRequestException if email is empty string', async () => {
        const dtoWithEmptyEmail = {
          ...validNormalDeliveryDto,
          email: '',
        };

        await expect(service.createDeliveryInfo(dtoWithEmptyEmail)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.createDeliveryInfo(dtoWithEmptyEmail)).rejects.toMatchObject({
          response: {
            code: 'EMAIL_REQUIRED',
            message: 'Email is required and cannot be empty',
          },
        });
      });

      it('should throw BadRequestException if phone is missing', async () => {
        const dtoWithoutPhone = {
          ...validNormalDeliveryDto,
          phone: null as any,
        };

        await expect(service.createDeliveryInfo(dtoWithoutPhone)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.createDeliveryInfo(dtoWithoutPhone)).rejects.toMatchObject({
          response: {
            code: 'PHONE_REQUIRED',
            message: 'Phone number is required and cannot be empty',
          },
        });
      });

      it('should throw BadRequestException if phone is empty string', async () => {
        const dtoWithEmptyPhone = {
          ...validNormalDeliveryDto,
          phone: '',
        };

        await expect(service.createDeliveryInfo(dtoWithEmptyPhone)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.createDeliveryInfo(dtoWithEmptyPhone)).rejects.toMatchObject({
          response: {
            code: 'PHONE_REQUIRED',
            message: 'Phone number is required and cannot be empty',
          },
        });
      });

      it('should throw BadRequestException if province is missing', async () => {
        const dtoWithoutProvince = {
          ...validNormalDeliveryDto,
          province: null as any,
        };

        await expect(service.createDeliveryInfo(dtoWithoutProvince)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.createDeliveryInfo(dtoWithoutProvince)).rejects.toMatchObject({
          response: {
            code: 'PROVINCE_REQUIRED',
            message: 'Province is required and cannot be empty',
          },
        });
      });

      it('should throw BadRequestException if province is empty string', async () => {
        const dtoWithEmptyProvince = {
          ...validNormalDeliveryDto,
          province: '',
        };

        await expect(service.createDeliveryInfo(dtoWithEmptyProvince)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.createDeliveryInfo(dtoWithEmptyProvince)).rejects.toMatchObject({
          response: {
            code: 'PROVINCE_REQUIRED',
            message: 'Province is required and cannot be empty',
          },
        });
      });

      it('should throw BadRequestException if address is missing', async () => {
        const dtoWithoutAddress = {
          ...validNormalDeliveryDto,
          address: null as any,
        };

        await expect(service.createDeliveryInfo(dtoWithoutAddress)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.createDeliveryInfo(dtoWithoutAddress)).rejects.toMatchObject({
          response: {
            code: 'ADDRESS_REQUIRED',
            message: 'Address is required and cannot be empty',
          },
        });
      });

      it('should throw BadRequestException if address is empty string', async () => {
        const dtoWithEmptyAddress = {
          ...validNormalDeliveryDto,
          address: '',
        };

        await expect(service.createDeliveryInfo(dtoWithEmptyAddress)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.createDeliveryInfo(dtoWithEmptyAddress)).rejects.toMatchObject({
          response: {
            code: 'ADDRESS_REQUIRED',
            message: 'Address is required and cannot be empty',
          },
        });
      });

      it('should throw BadRequestException if instruction is provided', async () => {
        const dtoWithInstruction = {
          ...validNormalDeliveryDto,
          instruction: 'Call before delivery',
        };

        await expect(service.createDeliveryInfo(dtoWithInstruction)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.createDeliveryInfo(dtoWithInstruction)).rejects.toMatchObject({
          response: {
            code: 'NORMAL_ORDER_INVALID_FIELDS',
            message:
              'Normal orders should not include instruction or delivery time',
          },
        });
      });

      it('should throw BadRequestException if delivery_time is provided', async () => {
        const dtoWithDeliveryTime = {
          ...validNormalDeliveryDto,
          delivery_time: new Date(Date.now() + 3600000),
        };

        await expect(service.createDeliveryInfo(dtoWithDeliveryTime)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.createDeliveryInfo(dtoWithDeliveryTime)).rejects.toMatchObject({
          response: {
            code: 'NORMAL_ORDER_INVALID_FIELDS',
            message:
              'Normal orders should not include instruction or delivery time',
          },
        });
      });

      it('should throw BadRequestException if both instruction and delivery_time are provided', async () => {
        const dtoWithBoth = {
          ...validNormalDeliveryDto,
          instruction: 'Call before delivery',
          delivery_time: new Date(Date.now() + 3600000),
        };

        await expect(service.createDeliveryInfo(dtoWithBoth)).rejects.toThrow(
          BadRequestException,
        );

        await expect(service.createDeliveryInfo(dtoWithBoth)).rejects.toMatchObject({
          response: {
            code: 'NORMAL_ORDER_INVALID_FIELDS',
            message:
              'Normal orders should not include instruction or delivery time',
          },
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty string instruction', async () => {
        const dtoWithEmptyInstruction = {
          ...validNormalDeliveryDto,
          instruction: '',
        };

        await expect(service.createDeliveryInfo(dtoWithEmptyInstruction)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should handle whitespace-only instruction', async () => {
        const dtoWithWhitespaceInstruction = {
          ...validNormalDeliveryDto,
          instruction: '   ',
        };

        await expect(service.createDeliveryInfo(dtoWithWhitespaceInstruction)).rejects.toThrow(
          BadRequestException,
        );
      });
    });
  });
});
