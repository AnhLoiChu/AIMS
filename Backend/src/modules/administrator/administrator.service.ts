import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../cart/entities/cart.entity';
import { User } from '../user/entities/user.entity';
import { Role } from '../role/entities/role.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdministratorService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) { }

  // Get all users
  async findAllUsers(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['roles'],
      select: ['user_id', 'name', 'email', 'phone', 'is_active', 'edit_count', 'delete_count'],
    });
  }

  // Get user by ID
  async findUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  // Create new user
  async createUser(createUserDto: {
    name: string;
    email: string;
    phone: string;
    password: string;
    roleIds?: number[];
  }): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new BadRequestException(`User with email ${createUserDto.email} already exists`);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    let roles: Role[] = [];
    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      roles = await this.roleRepository.findByIds(createUserDto.roleIds);
    }

    const user = this.userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      phone: createUserDto.phone,
      password: hashedPassword,
      is_active: true,
      roles: roles,
    });

    return this.userRepository.save(user);
  }

  // Update user information
  async updateUser(userId: number, updateUserDto: {
    name?: string;
    email?: string;
    phone?: string;
    is_active?: boolean;
    roleIds?: number[];
  }): Promise<User> {
    const user = await this.findUserById(userId);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser) {
        throw new BadRequestException(`Email ${updateUserDto.email} is already in use`);
      }
    }

    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.phone) user.phone = updateUserDto.phone;
    if (updateUserDto.is_active !== undefined) user.is_active = updateUserDto.is_active;

    if (updateUserDto.roleIds) {
      const roles = await this.roleRepository.findByIds(updateUserDto.roleIds);
      user.roles = roles;
    }

    return this.userRepository.save(user);
  }

  // Delete user
  async deleteUser(userId: number): Promise<{ message: string }> {
    const user = await this.findUserById(userId);
    await this.userRepository.remove(user);
    return { message: `User with ID ${userId} has been deleted` };
  }

  // Block user
  async blockUser(userId: number): Promise<User> {
    const user = await this.findUserById(userId);
    user.is_active = false;
    return this.userRepository.save(user);
  }

  // Unblock user
  async unblockUser(userId: number): Promise<User> {
    const user = await this.findUserById(userId);
    user.is_active = true;
    return this.userRepository.save(user);
  }

  // Reset user password
  async resetPassword(userId: number, newPassword: string): Promise<{ message: string }> {
    const user = await this.findUserById(userId);
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
    return { message: `Password for user ID ${userId} has been reset` };
  }

  // Set user roles
  async setUserRoles(userId: number, roleIds: number[]): Promise<User> {
    const user = await this.findUserById(userId);
    const roles = await this.roleRepository.findByIds(roleIds);
    user.roles = roles;
    return this.userRepository.save(user);
  }
}
