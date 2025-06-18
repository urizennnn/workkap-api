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
};
