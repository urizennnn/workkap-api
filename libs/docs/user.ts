import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserType } from 'libs/auth';
import { errorSchema } from './error-schema';

export const UserControllerSwagger = {
  controller: applyDecorators(ApiTags('Users')),

  signupWithEmailAndPassword: applyDecorators(
    ApiOperation({ summary: 'Signup using email and password' }),
    ApiCreatedResponse({
      description: 'User account created',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: {
            type: 'string',
            example: 'User account created successfully',
          },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              fullName: { type: 'string' },
              username: { type: 'string' },
            },
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid signup data',
      schema: errorSchema('Invalid signup data'),
    }),
    ApiBody({
      description: 'User registration details',
      required: true,
      schema: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
          fullName: { type: 'string' },
          username: { type: 'string' },
          country: { type: 'string' },
        },
        required: ['email', 'password', 'fullName', 'username'],
      },
      examples: {
        example1: {
          summary: 'Typical signup payload',
          value: {
            email: 'example@gmail.com',
            password: 'StrongPassword123!',
            fullName: 'John Doe',
            username: 'johndoe',
            country: 'USA',
          },
        },
      },
    }),
  ),

  loginWithEmailAndPassword: applyDecorators(
    ApiOperation({ summary: 'Login using email and password' }),
    ApiOkResponse({
      description: 'User logged in',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Login successful' },
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  email: { type: 'string', format: 'email' },
                  fullName: { type: 'string' },
                  username: { type: 'string' },
                },
              },
              tokens: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Invalid credentials',
      schema: errorSchema('Invalid credentials'),
    }),
    ApiBadRequestResponse({
      description: 'Invalid login data',
      schema: errorSchema('Invalid login data'),
    }),
    ApiBody({
      description: 'User login credentials',
      required: true,
      schema: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
        },
        required: ['email', 'password'],
      },
      examples: {
        example1: {
          summary: 'Typical login payload',
          value: {
            email: 'example@gmail.com',
            password: 'StrongPassword123!',
          },
        },
      },
    }),
  ),

  loginGoogle: applyDecorators(
    ApiOperation({ summary: 'Initiate Google OAuth login' }),
    ApiOkResponse({ description: 'Redirects to Google OAuth consent screen' }),
  ),

  loginGoogleRedirect: applyDecorators(
    ApiOperation({ summary: 'Handle Google OAuth callback and issue tokens' }),
    ApiOkResponse({
      description: 'User logged in via Google',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Login successful' },
          data: {
            type: 'object',
            properties: {
              user: { type: 'object' },
              tokens: { type: 'object' },
            },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Google authentication failed',
      schema: errorSchema('Google authentication failed'),
    }),
  ),

  updateUser: applyDecorators(
    ApiOperation({ summary: 'Update user details' }),
    ApiOkResponse({
      description: 'User updated',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'User updated successfully' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
              fullName: { type: 'string' },
              username: { type: 'string' },
              country: { type: 'string' },
            },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      schema: errorSchema('Unauthorized'),
    }),
    ApiBadRequestResponse({
      description: 'Invalid update data',
      schema: errorSchema('Invalid update data'),
    }),
    ApiBody({
      description: 'Fields to update',
      required: true,
      schema: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          fullName: { type: 'string' },
          username: { type: 'string' },
          country: { type: 'string' },
          password: { type: 'string', format: 'password' },
        },
        required: ['email'],
      },
      examples: {
        example1: {
          summary: 'Update user details payload. Not all fields are required.',
          value: {
            email: 'example@gmail.com',
            password: 'NewStrongPassword123!',
            fullName: 'Jane Doe',
            username: 'janedoe',
            country: 'Canada',
          },
        },
      },
    }),
  ),

  switchProfile: applyDecorators(
    ApiOperation({ summary: 'Switch between client and freelancer profiles' }),
    ApiOkResponse({
      description: 'Profile switched and new tokens issued',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: {
            type: 'string',
            example: 'Profile switched successfully',
          },
          data: { type: 'object' },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Profile switch not allowed',
      schema: errorSchema('Profile switch not allowed'),
    }),
    ApiBody({
      description: 'Desired profile',
      required: true,
      schema: {
        type: 'object',
        properties: {
          profile: { type: 'string', enum: Object.values(UserType) },
        },
        required: ['profile'],
      },
    }),
  ),

  verifyEmail: applyDecorators(
    ApiOperation({ summary: 'Verify user email with OTP' }),
    ApiOkResponse({
      description: 'Email verified',
      schema: { type: 'object' },
    }),
    ApiBadRequestResponse({
      description: 'Invalid code',
      schema: errorSchema('Invalid or expired code'),
    }),
    ApiBody({
      required: true,
      schema: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          code: { type: 'string' },
        },
      },
    }),
  ),

  resendOtp: applyDecorators(
    ApiOperation({ summary: 'Resend verification OTP' }),
    ApiOkResponse({ description: 'OTP resent', schema: { type: 'object' } }),
    ApiBody({
      required: true,
      schema: {
        type: 'object',
        properties: { email: { type: 'string', format: 'email' } },
        required: ['email'],
      },
    }),
  ),

  forgotPassword: applyDecorators(
    ApiOperation({ summary: 'Send OTP for password reset' }),
    ApiOkResponse({ description: 'OTP sent', schema: { type: 'object' } }),
    ApiBody({
      required: true,
      schema: {
        type: 'object',
        properties: { email: { type: 'string', format: 'email' } },
        required: ['email'],
      },
    }),
  ),

  resetPassword: applyDecorators(
    ApiOperation({ summary: 'Reset password using OTP' }),
    ApiOkResponse({
      description: 'Password reset',
      schema: { type: 'object' },
    }),
    ApiBadRequestResponse({
      description: 'Invalid code',
      schema: errorSchema('Invalid or expired code'),
    }),
    ApiBody({
      required: true,
      schema: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          code: { type: 'string' },
          newPassword: { type: 'string' },
        },
      },
    }),
  ),
};
