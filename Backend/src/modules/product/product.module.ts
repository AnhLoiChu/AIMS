import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductInCart } from '../product-in-cart/entities/product-in-cart.entity';
import { OrderDescription } from '../order-description/entities/order-description.entity';
import { EditHistory } from '../edit-history/entities/edit-history.entity';
import { DvdModule } from '../dvd/dvd.module';
import { CdModule } from '../cd/cd.module';
import { LpModule } from '../lp/lp.module';
import { BookModule } from '../book/book.module';
import { EditHistoryModule } from '../edit-history/edit-history.module';
import { UserModule } from '../user/user.module';
import { ProductSubtypeFactory } from './factories/product-subtype.factory';
import { ProductValidatorService } from './services/product-validator.service';
import { ProductBusinessRulesService } from './services/product-business-rules.service';
import { CascadeDeletionService } from './services/cascade-deletion.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductInCart,
      OrderDescription,
      EditHistory,
    ]),
    DvdModule,
    CdModule,
    LpModule,
    BookModule,
    EditHistoryModule,
    UserModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ProductController],
  providers: [
    ProductService,
    ProductSubtypeFactory,
    ProductValidatorService,
    ProductBusinessRulesService,
    CascadeDeletionService,
  ],
})
export class ProductModule {}
