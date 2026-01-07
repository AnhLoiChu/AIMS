import { Controller, Post, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('reset-counters')
  @ApiOperation({
    summary: 'Manually reset all user edit/delete counters to 0',
  })
  @ApiResponse({ status: 200, description: 'Counters reset successfully' })
  async resetCounters() {
    await this.userService.resetDailyCounters();
    return {
      message: 'All user edit_count and delete_count have been reset to 0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('counter-stats')
  @ApiOperation({ summary: 'Get statistics about user counters' })
  @ApiResponse({
    status: 200,
    description: 'Counter statistics retrieved successfully',
  })
  async getCounterStats() {
    const stats = await this.userService.getCounterStats();
    return {
      ...stats,
      timestamp: new Date().toISOString(),
    };
  }
}
