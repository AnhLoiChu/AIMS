import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { DeliveryInfo } from './entities/delivery-info.entity';
import { Order } from '../order/entities/order.entity';
import { CreateDeliveryInfoDto } from './dto/create-delivery-info.dto';

@Injectable()
export class DeliveryInfoService extends TypeOrmCrudService<DeliveryInfo> {
  constructor(
    @InjectRepository(DeliveryInfo)
    private readonly deliveryInfoRepository: Repository<DeliveryInfo>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {
    super(deliveryInfoRepository);
  }

  async createDeliveryInfo(dto: CreateDeliveryInfoDto) {
    if (!dto.recipient_name || !dto.recipient_name.trim()) {
      throw new BadRequestException({
        code: 'RECIPIENT_NAME_REQUIRED',
        message: 'Recipient name is required and cannot be empty',
      });
    }

    if (!dto.email || !dto.email.trim()) {
      throw new BadRequestException({
        code: 'EMAIL_REQUIRED',
        message: 'Email is required and cannot be empty',
      });
    }

    if (!dto.phone || !dto.phone.trim()) {
      throw new BadRequestException({
        code: 'PHONE_REQUIRED',
        message: 'Phone number is required and cannot be empty',
      });
    }

    if (!dto.province || !dto.province.trim()) {
      throw new BadRequestException({
        code: 'PROVINCE_REQUIRED',
        message: 'Province is required and cannot be empty',
      });
    }

    if (!dto.address || !dto.address.trim()) {
      throw new BadRequestException({
        code: 'ADDRESS_REQUIRED',
        message: 'Address is required and cannot be empty',
      });
    }
    if (dto.instruction != null || dto.delivery_time != null) {
      throw new BadRequestException({
        code: 'NORMAL_ORDER_INVALID_FIELDS',
        message:
          'Normal orders should not include instruction or delivery time',
      });
    }
    const deliveryInfo = this.deliveryInfoRepository.create(dto);
    const saved = await this.deliveryInfoRepository.save(deliveryInfo);

    // Example eligibility and update messages
    const eligibility = { message: 'Normal order is eligible for delivery.' };
    const updateResult = { message: 'Delivery info created successfully.' };

    return {
      success: true,
      eligibilityMessage: eligibility.message,
      updateMessage: updateResult.message,
      data: saved,
    };
  }

  async createRushOrderDeliveryInfo(dto: CreateDeliveryInfoDto) {
    if (!dto.recipient_name || !dto.recipient_name.trim()) {
      throw new BadRequestException({
        code: 'RECIPIENT_NAME_REQUIRED',
        message: 'Recipient name is required and cannot be empty',
      });
    }

    if (!dto.email || !dto.email.trim()) {
      throw new BadRequestException({
        code: 'EMAIL_REQUIRED',
        message: 'Email is required and cannot be empty',
      });
    }

    if (!dto.phone || !dto.phone.trim()) {
      throw new BadRequestException({
        code: 'PHONE_REQUIRED',
        message: 'Phone number is required and cannot be empty',
      });
    }

    if (!dto.province || !dto.province.trim()) {
      throw new BadRequestException({
        code: 'PROVINCE_REQUIRED',
        message: 'Province is required and cannot be empty',
      });
    }

    if (!dto.address || !dto.address.trim()) {
      throw new BadRequestException({
        code: 'ADDRESS_REQUIRED',
        message: 'Address is required and cannot be empty',
      });
    }

    if (!dto.instruction || !dto.instruction.trim()) {
      throw new BadRequestException({
        code: 'RUSH_ORDER_INSTRUCTION_REQUIRED',
        message: 'Rush orders must include a valid instruction',
      });
    }

    if (!dto.delivery_time) {
      throw new BadRequestException({
        code: 'RUSH_ORDER_TIME_REQUIRED',
        message: 'Rush orders must include a delivery time',
      });
    }

    if (dto.province.toUpperCase() !== 'HN') {
      throw new BadRequestException({
        code: 'RUSH_ORDER_PROVINCE_NOT_ELIGIBLE',
        message: 'Rush delivery is only available in Hanoi (HN)',
      });
    }
    const deliveryInfo = this.deliveryInfoRepository.create(dto);
    const saved = await this.deliveryInfoRepository.save(deliveryInfo);

    // Example eligibility and update messages
    const eligibility = { message: 'Rush order is eligible for delivery.' };
    const updateResult = {
      message: 'Rush delivery info created successfully.',
    };

    return {
      success: true,
      eligibilityMessage: eligibility.message,
      updateMessage: updateResult.message,
      data: saved,
    };
  }
}
