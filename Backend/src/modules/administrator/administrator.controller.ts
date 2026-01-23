import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AdministratorService } from './administrator.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetRolesDto } from './dto/set-roles.dto';

@ApiTags('administrator')
@ApiBearerAuth()
@Controller('administrator')
export class AdministratorController {
  constructor(public readonly service: AdministratorService) { }

  @Get('users')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns list of all users' })
  async getAllUsers() {
    return this.service.findAllUsers();
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns user details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findUserById(id);
  }

  @Post('users')
  @ApiOperation({ summary: 'Create new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or email already exists' })
  async createUser(@Body() createUserDto: CreateAdminUserDto) {
    return this.service.createUser(createUserDto);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user information (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateAdminUserDto,
  ) {
    return this.service.updateUser(id, updateUserDto);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteUser(id);
  }

  @Post('users/:id/block')
  @ApiOperation({ summary: 'Block user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User blocked successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async blockUser(@Param('id', ParseIntPipe) id: number) {
    return this.service.blockUser(id);
  }

  @Post('users/:id/unblock')
  @ApiOperation({ summary: 'Unblock user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User unblocked successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unblockUser(@Param('id', ParseIntPipe) id: number) {
    return this.service.unblockUser(id);
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: 'Reset user password (Admin only)' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.service.resetPassword(id, resetPasswordDto.newPassword);
  }

  @Put('users/:id/roles')
  @ApiOperation({ summary: 'Set user roles (Admin only)' })
  @ApiResponse({ status: 200, description: 'Roles updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async setUserRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() setRolesDto: SetRolesDto,
  ) {
    return this.service.setUserRoles(id, setRolesDto.roleIds);
  }
}
