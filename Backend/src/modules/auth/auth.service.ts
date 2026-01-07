import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RoleName } from '../role/entities/role.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(
    email: string,
    plainPassword: string,
  ): Promise<{ access_token: string; id: number; roles: string[] }> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatch = plainPassword === user.password;
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      user_id: user.user_id,
      email: user.email,
      roles: user.roles ? user.roles.map((role) => role.name) : [],
    };
    console.log('Payload:', payload);
    return {
      access_token: await this.jwtService.signAsync(payload),
      id: payload.user_id,
      roles: payload.roles,
    };
  }

  async signup(
    name: string,
    email: string,
    phone: string,
    plainPassword: string,
  ): Promise<{ message: string }> {
    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = plainPassword;
    await this.usersService.createWithRole(
      {
        name,
        email,
        phone,
        password: hashedPassword,
      },
      RoleName.CUSTOMER,
    );

    return { message: 'User registered successfully' };
  }

  async resetPassword(
    email: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await this.usersService.update(user.user_id, user);

    return { message: 'Password reset successfully' };
  }
}
