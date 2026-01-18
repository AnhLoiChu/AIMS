import {
  Get,
  Controller,
  Post,
  Param,
  Query,
  Patch,
  Delete,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { UpdateFullProductDto } from './dto/update-full-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { DeleteProductsDto } from './dto/delete-products.dto';
import { RolesGuard } from './guards/role.guard';
import { ManagerProductOwnershipGuard } from './guards/manager.guard';
import { Roles } from './guards/role.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minPrice') minPrice?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const effectiveLimit = limit ? parseInt(limit, 10) : 20;
    return this.productService.findAll({
      category,
      search,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      sort,
      includeInactive: includeInactive === 'true',
      limit: effectiveLimit,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    const product = await this.productService.findOne(id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

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

  @ApiBearerAuth()
  @UseGuards(ManagerProductOwnershipGuard, RolesGuard)
  @Roles('manager', 'admin')
  @Delete('multiple')
  async deleteMultiple(@Body() deleteProductsDto: DeleteProductsDto) {
    return this.productService.deleteMultiple(deleteProductsDto);
  }
}
