import { Body, Controller, Post, Get, Req, Patch } from '@nestjs/common';
import { Request } from 'express';
import { Google, Docs, NeedsAuth } from 'libs';
import type { GoogleRequest } from 'libs/@types/express';
import { UserService } from './user.service';
import { LoginWithEmailAndPassword, SignUpWithEmailAndPassword } from './dto';
import { User } from '@prisma/client';

@Controller('users')
@Docs.controller
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signup/combination')
  @Docs.signupWithEmailAndPassword
  async signupWithEmailAndPassword(
    @Body() payload: SignUpWithEmailAndPassword,
  ) {
    return this.userService.signupWithEmailAndPassword(payload);
  }

  @Post('login/combination')
  @Docs.loginWithEmailAndPassword
  async loginWithEmailAndPassword(@Body() payload: LoginWithEmailAndPassword) {
    return this.userService.loginWithEmailAndPassword(payload);
  }

  @Get('login/google')
  @Docs.loginGoogle
  @Google()
  async googleLogin() {
    // Guard redirects
  }

  @Get('login/google/redirect')
  @Docs.loginGoogleRedirect
  @Google()
  async googleLoginRedirect(@Req() req: Request) {
    return this.userService.loginWithGoogle((req as GoogleRequest).user);
  }

  @Patch('update')
  @NeedsAuth()
  @Docs.updateUser
  async updateUser(@Body() body: Partial<User>) {
    return this.userService.updateUserDetails(body);
  }
}
