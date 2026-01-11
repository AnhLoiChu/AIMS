import {
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Query,
  Body,
  NotFoundException,
  Delete,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateFullProductDto } from './dto/update-full-product.dto';
import { DeleteProductsDto } from './dto/delete-products.dto';
import { UseGuards } from '@nestjs/common';
import { ManagerProductOwnershipGuard } from './guards/manager.guard';
import { RolesGuard } from './guards/role.guard';
import { Roles } from './guards/role.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  @ApiBearerAuth()
  @UseGuards(ManagerProductOwnershipGuard, RolesGuard)
  @Roles('manager', 'admin')
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }
  @ApiBearerAuth()
  @UseGuards(ManagerProductOwnershipGuard, RolesGuard)
  @Roles('manager', 'admin')
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateFullProductDto: UpdateFullProductDto,
  ) {
    try {
      const product = await this.productService.update(
        id,
        updateFullProductDto,
      );
      if (!product) throw new NotFoundException('Product not found');
      return product;
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    const product = await this.productService.findOne(id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  @Get()
  findAll(@Query('limit') limit?: string) {
    const effectiveLimit = limit ? parseInt(limit, 10) : 30;
    return this.productService.findAll(effectiveLimit);
  }
  @ApiBearerAuth()
  @UseGuards(ManagerProductOwnershipGuard, RolesGuard)
  @Roles('manager', 'admin')
  @Delete('multiple')
  async deleteMultiple(@Body() deleteProductsDto: DeleteProductsDto) {
    return this.productService.deleteMultiple(deleteProductsDto);
  }
}
