import { Injectable } from '@nestjs/common';
import { PrismaService } from 'libs/db';
import { LoginWithEmailAndPassword, SignUpWithEmailAndPassword } from './dto';
import { RegistrationMethod } from '@prisma/client';
import { WorkkapLogger } from 'libs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { hashPassword } from './utils';
import { JwtPayload, JWTService, UserType } from 'libs/auth/jwt/jwt.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WorkkapLogger,
    private readonly jwtService: JWTService,
  ) {}

  async signupWithEmailAndPassword(payload: SignUpWithEmailAndPassword) {
    try {
      this.logger.info(
        `Attempting to create user with email: ${payload.email}`,
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
      this.logger.info(`User created successfully with ID: ${user.id}`);
      return { status: 'success', data: user };
    } catch (error: unknown) {
      this.logger.error(
        `Error creating user with email: ${payload.email}`,
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
      this.logger.info(`Attempting to login user with email: ${payload.email}`);
      const user = await this.prisma.user.findUnique({
        where: { email: payload.email },
      });
      if (!user) {
        this.logger.info(`User not found with email: ${payload.email}`);
        return {
          status: 'error',
          message: 'Invalid email or password',
        };
      }
      const checkRegistrationMethod = user.registrationMethod;
      if (checkRegistrationMethod !== RegistrationMethod.COMBINATION) {
        this.logger.info(
          `User registration method is not combination for email: ${payload.email}`,
        );
        return {
          status: 'error',
          message: `An account was found with a different login method. Please use ${user.registrationMethod} to login.`,
        };
      }
      const isPasswordValid = await hashPassword(payload.password);
      if (user.password !== isPasswordValid) {
        this.logger.info(
          `Invalid password for user with email: ${payload.email}`,
        );
        return {
          status: 'error',
          message: 'Invalid email or password',
        };
      }
      this.logger.info(`User logged in successfully with ID: ${user.id}`);
      this.logger.info(`Assigning tokens to user`);
      const tokenPayload: JwtPayload = {
        userId: user.id,
        userType: UserType.FREELANCER,
      };
      const accessToken = this.jwtService.sign(tokenPayload);
      const refreshToken = this.jwtService.signRefreshToken(tokenPayload);

      return {
        status: 'success',
        data: { user, tokens: { accessToken, refreshToken } },
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error logging in user with email: ${payload.email}`,
        error,
      );
      return {
        status: 'error',
        message: 'Failed to login user',
      };
    }
  }

  async loginWithGoogle(googleUser: {
    email?: string;
    fullName?: string;
    profilePictureUrl?: string;
  }) {
    if (!googleUser.email) {
      return { status: 'error', message: 'Email not provided by Google' };
    }
    try {
      let user = await this.prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: googleUser.email,
            fullName: googleUser.fullName,
            profilePictureUrl: googleUser.profilePictureUrl,
            registrationMethod: RegistrationMethod.GOOGLE,
          },
        });
      } else if (user.registrationMethod !== RegistrationMethod.GOOGLE) {
        return {
          status: 'error',
          message: `An account was found with a different login method. Please use ${user.registrationMethod} to login.`,
        };
      }

      const tokenPayload: JwtPayload = {
        userId: user.id,
        userType: UserType.FREELANCER,
      };
      const accessToken = this.jwtService.sign(tokenPayload);
      const refreshToken = this.jwtService.signRefreshToken(tokenPayload);

      return {
        status: 'success',
        data: { user, tokens: { accessToken, refreshToken } },
      };
    } catch (error) {
      this.logger.error('Error logging in with Google', error);
      return { status: 'error', message: 'Failed to login user' };
    }
  }
}
