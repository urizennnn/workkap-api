import { Body, Controller, Post, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { Google } from 'libs/auth/google';
import { UserService } from './user.service';
import { LoginWithEmailAndPassword, SignUpWithEmailAndPassword } from './dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup/combination')
  async signupWithEmailAndPassword(
    @Body() payload: SignUpWithEmailAndPassword,
  ) {
    return this.userService.signupWithEmailAndPassword(payload);
  }

  @Post('login/combination')
  async loginWithEmailAndPassword(@Body() payload: LoginWithEmailAndPassword) {
    return this.userService.loginWithEmailAndPassword(payload);
  }

  @Get('login/google')
  @Google()
  async googleLogin() {
    // Guard redirects
  }

  @Get('login/google/redirect')
  @Google()
  async googleLoginRedirect(@Req() req: Request) {
    return this.userService.loginWithGoogle(req.user!);
  }
}
