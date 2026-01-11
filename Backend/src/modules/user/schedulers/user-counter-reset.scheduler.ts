import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserService } from '../user.service';

@Injectable()
export class UserCounterResetScheduler {
  private readonly logger = new Logger(UserCounterResetScheduler.name);

  constructor(private readonly userService: UserService) {}

  /**
   * Reset user counters daily at midnight (00:00)
   * Cron expression: '0 0 * * *' means "at 00:00 every day"
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailyCounters() {
    try {
      this.logger.log('Starting daily user counter reset...');

      // Get stats before reset for logging
      const statsBefore = await this.userService.getCounterStats();
      this.logger.log(
        `Before reset - Users: ${statsBefore.totalUsers}, ` +
          `With edits: ${statsBefore.usersWithEdits}, ` +
          `With deletes: ${statsBefore.usersWithDeletes}, ` +
          `Max edit count: ${statsBefore.maxEditCount}, ` +
          `Max delete count: ${statsBefore.maxDeleteCount}`,
      );

      // Reset counters
      await this.userService.resetDailyCounters();

      // Verify reset
      const statsAfter = await this.userService.getCounterStats();
      this.logger.log(
        `After reset - Max edit count: ${statsAfter.maxEditCount}, ` +
          `Max delete count: ${statsAfter.maxDeleteCount}`,
      );

      this.logger.log('Daily user counter reset completed successfully');
    } catch (error) {
      this.logger.error('Failed to reset daily counters', error);
    }
  }

  /**
   * Manual trigger for testing - runs every minute
   * Remove this in production or use it for testing only
   */
  // @Cron('*/1 * * * *') // Every minute - FOR TESTING ONLY
  async testReset() {
    this.logger.log('Test reset triggered');
    await this.resetDailyCounters();
  }
}
