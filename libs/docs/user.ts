import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';

export class UserDocs {
  static userController(): ClassDecorator & MethodDecorator {
    return applyDecorators(ApiTags('Users'));
  }

  static signupWithEmailAndPassword(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ApiOperation({ summary: 'Signup using email and password' }),
      ApiCreatedResponse({ description: 'User account created' }),
    );
  }

  static loginWithEmailAndPassword(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ApiOperation({ summary: 'Login using email and password' }),
      ApiOkResponse({ description: 'User logged in' }),
    );
  }

  static loginGoogle(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ApiOperation({ summary: 'Initiate Google OAuth login' }),
      ApiOkResponse({ description: 'Redirect to Google OAuth login page' }),
    );
  }

  static loginGoogleRedirect(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ApiOperation({ summary: 'Handle Google OAuth redirect' }),
      ApiOkResponse({ description: 'User logged in via Google' }),
    );
  }
}
