import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  Patch,
  Param,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Google, Docs, NeedsAuth, ValidateSchema } from 'src/libs';
import type { AuthorizedRequest, GoogleRequest } from 'src/libs/@types/express';
import { UserService } from './user.service';
import {
  LoginWithEmailAndPassword,
  LoginWithEmailAndPasswordSchema,
  SignUpWithEmailAndPassword,
  SignUpWithEmailAndPasswordSchema,
  SwitchProfile,
  SwitchProfileSchema,
  VerifyEmail,
  VerifyEmailSchema,
  ResendOtp,
  ResendOtpSchema,
  ForgotPassword,
  ForgotPasswordSchema,
  ResetPassword,
  ResetPasswordSchema,
  RefreshToken,
  RefreshTokenSchema,
  UpdateUser,
  UpdateUserSchema,
} from './dto';
import { SubscriptionPlan } from '@prisma/client';

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

  @Docs.verifyEmail
  @Post('verify-email')
  @ValidateSchema({ body: VerifyEmailSchema })
  async verifyEmail(@Body() payload: VerifyEmail) {
    return this.userService.verifyEmail(payload);
  }

  @Docs.resendOtp
  @Post('resend-otp')
  @ValidateSchema({ body: ResendOtpSchema })
  async resendOtp(@Body() payload: ResendOtp) {
    return this.userService.resendOtp(payload);
  }

  @Docs.forgotPassword
  @Post('forgot-password')
  @ValidateSchema({ body: ForgotPasswordSchema })
  async forgotPassword(@Body() payload: ForgotPassword) {
    return this.userService.forgotPassword(payload);
  }

  @Docs.resetPassword
  @Post('reset-password')
  @ValidateSchema({ body: ResetPasswordSchema })
  async resetPassword(@Body() payload: ResetPassword) {
    return this.userService.resetPassword(payload);
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
  @ValidateSchema({ body: UpdateUserSchema })
  async updateUser(@Body() body: UpdateUser, @Req() req: Request) {
    const user = req.user as AuthorizedRequest['user'];
    return this.userService.updateUserDetails(body, user.userId);
  }
  @Post('subscribe')
  @NeedsAuth()
  @Docs.subscribe
  async subscribe(@Req() req: Request, @Body('plan') plan: SubscriptionPlan) {
    const { user } = req as AuthorizedRequest;
    return this.userService.subscribe(user.userId, plan);
  }

  @Post('switch-profile')
  @NeedsAuth()
  @ValidateSchema({ body: SwitchProfileSchema })
  @Docs.switchProfile
  async switchProfile(@Req() req: Request, @Body() body: SwitchProfile) {
    const { user } = req as AuthorizedRequest;
    return this.userService.switchProfile(user, body.profile);
  }

  @Get('verify-token')
  @Docs.verifyToken
  async verifyToken(@Headers('authorization') auth?: string) {
    if (!auth) throw new UnauthorizedException('Missing authorization header');
    const [type, token] = auth.split(' ');
    if (type !== 'Bearer' || !token)
      throw new UnauthorizedException('Invalid authorization header');
    return this.userService.verifyToken(token);
  }

  @Get(':id')
  @Docs.getUserById
  async getUser(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Patch(':id')
  @Docs.patchUser
  async patchUser(@Param('id') id: string, @Body() body: Partial<UpdateUser>) {
    return this.userService.patchUser(id, body);
  }

  @Post('refresh-token')
  @ValidateSchema({ body: RefreshTokenSchema })
  @Docs.refreshToken
  async refreshToken(@Body() body: RefreshToken) {
    return this.userService.refreshAccessToken(body.refreshToken);
  }
}
