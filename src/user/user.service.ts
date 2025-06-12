import { Injectable } from '@nestjs/common';
import { PrismaService } from 'libs/db';
import { LoginWithEmailAndPassword, SignUpWithEmailAndPassword } from './dto';
import { RegistrationMethod } from '@prisma/client';
import { WorkkapLogger } from 'libs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { hashPassword } from './utils';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WorkkapLogger,
  ) {}

  async signupWithEmailAndPassword(payload: SignUpWithEmailAndPassword) {
    try {
      this.logger.info(
        `UserService: Attempting to create user with email: ${payload.email}`,
      );
      const hashedPassword = await hashPassword(payload.password);
      const user = await this.prisma.user.create({
        data: {
          email: payload.email,
          password: hashedPassword,
          fullName: payload.fullName,
          registrationMethod: RegistrationMethod.COMBINATION,
          username: payload.username,
        },
      });
      this.logger.info(
        `UserService: User created successfully with ID: ${user.id}`,
      );
      return { status: 'success', data: user };
    } catch (error: unknown) {
      this.logger.error(
        `UserService: Error creating user with email: ${payload.email}`,
        error,
      );
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return {
            status: 'error',
            message: 'Email or username already exists',
          };
        }
      }
      return {
        status: 'error',
        message: 'Failed to create user',
      };
    }
  }
  async loginWithEmailAndPassword(payload: LoginWithEmailAndPassword) {
    try {
      this.logger.info(
        `UserService: Attempting to login user with email: ${payload.email}`,
      );
      const user = await this.prisma.user.findUnique({
        where: { email: payload.email },
      });
      if (!user) {
        this.logger.info(
          `UserService: User not found with email: ${payload.email}`,
        );
        return {
          status: 'error',
          message: 'Invalid email or password',
        };
      }
      const checkRegistrationMethod = user.registrationMethod;
      if (checkRegistrationMethod !== RegistrationMethod.COMBINATION) {
        this.logger.info(
          `UserService: User registration method is not combination for user with email: ${payload.email}`,
        );
        return {
          status: 'error',
          message: `An account was found with a different login method. Please use ${user.registrationMethod} to login.`,
        };
      }
      const isPasswordValid = await hashPassword(payload.password);
      if (user.password !== isPasswordValid) {
        this.logger.info(
          `UserService: Invalid password for user with email: ${payload.email}`,
        );
        return {
          status: 'error',
          message: 'Invalid email or password',
        };
      }
      this.logger.info(
        `UserService: User logged in successfully with ID: ${user.id}`,
      );
      return { status: 'success', data: user };
    } catch (error: unknown) {
      this.logger.error(
        `UserService: Error logging in user with email: ${payload.email}`,
        error,
      );
      return {
        status: 'error',
        message: 'Failed to login user',
      };
    }
  }
}
