import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
@Controller('auth')
@ApiBearerAuth()
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiBody({ type: LoginDto })
  signIn(@Body() signInDto: LoginDto) {
    return this.authService.login(signInDto.email, signInDto.password);
  }

  @Post('signup')
  @ApiBody({ type: SignupDto })
  signUp(@Body() signupDto: SignupDto) {
    return this.authService.signup(
      signupDto.name,
      signupDto.email,
      signupDto.phone,
      signupDto.password,
    );
  }

  @Post('reset-password')
  @ApiBody({ type: ResetPasswordDto })
  resetPassword(@Body() resetDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetDto.email, resetDto.newPassword);
  }
}
