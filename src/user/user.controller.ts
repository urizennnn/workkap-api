import { Body, Controller, Post } from '@nestjs/common';
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
}
