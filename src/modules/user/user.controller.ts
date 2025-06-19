import { Body, Controller, Post, Get, Req, Patch } from '@nestjs/common';
import { Request } from 'express';
import { Google, Docs, NeedsAuth, ValidateSchema, UserType } from 'libs';
import type { AuthorizedRequest, GoogleRequest } from 'libs/@types/express';
import { UserService } from './user.service';
import {
  LoginWithEmailAndPassword,
  LoginWithEmailAndPasswordSchema,
  SignUpWithEmailAndPassword,
  SignUpWithEmailAndPasswordSchema,
  SwitchProfile,
  SwitchProfileSchema,
} from './dto';
import { User } from '@prisma/client';

@Controller('users')
@Docs.controller
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Docs.signupWithEmailAndPassword
  @Post('signup/combination')
  @ValidateSchema({
    body: SignUpWithEmailAndPasswordSchema,
  })
  async signupWithEmailAndPassword(
    @Body() payload: SignUpWithEmailAndPassword,
  ) {
    return this.userService.signupWithEmailAndPassword(payload);
  }

  @Docs.loginWithEmailAndPassword
  @Post('login/combination')
  @ValidateSchema({
    body: LoginWithEmailAndPasswordSchema,
  })
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

  @Post('switch-profile')
  @NeedsAuth()
  @ValidateSchema({ body: SwitchProfileSchema })
  @Docs.switchProfile
  async switchProfile(@Req() req: Request, @Body() body: SwitchProfile) {
    const { user } = req as AuthorizedRequest;
    return this.userService.switchProfile(user, body.profile);
  }
}
