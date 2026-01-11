import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ProductService } from '../../product/product.service';

interface JwtPayload {
  user_id: number;
  email: string;
  roles: string[];
}

@Injectable()
export class ManagerProductOwnershipGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private productService: ProductService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException('Token not provided');

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const userId = payload.user_id;

    const paramId = request.params?.id;
    const bodyProductIds: number[] = Array.isArray(
      (request.body as { productIds?: unknown }).productIds,
    )
      ? ((request.body as { productIds?: unknown }).productIds as number[])
      : [];

    // Case 1: Edit - single ID in route params
    if (paramId) {
      const productId = parseInt(paramId, 10);
      const product = await this.productService.findOne(productId);
      if (!product || product.manager_id !== userId) {
        throw new ForbiddenException(
          'You do not have permission to modify this product',
        );
      }
    }

    // Case 2: Delete - array of productIds in body
    if (bodyProductIds.length) {
      const products = await this.productService.findByIds(bodyProductIds);
      const unauthorized = products.find((p) => p.manager_id !== userId);
      if (unauthorized) {
        throw new ForbiddenException(
          `You do not have permission to delete one or more of the selected products`,
        );
      }
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
