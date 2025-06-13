import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { LoginWithEmailAndPassword, SignUpWithEmailAndPassword } from './dto';
import { RegistrationMethod, User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { hashPassword } from './utils';
import {
  JwtPayload,
  JWTService,
  PrismaService,
  UserType,
  WorkkapLogger,
} from 'libs';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WorkkapLogger,
    private readonly jwtService: JWTService,
  ) {}

  async signupWithEmailAndPassword(
    payload: SignUpWithEmailAndPassword,
  ): Promise<{ status: 'success'; data: User }> {
    this.logger.info(`Attempting to create user with email: ${payload.email}`);
    try {
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
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email or username already exists');
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async loginWithEmailAndPassword(payload: LoginWithEmailAndPassword): Promise<{
    status: 'success';
    data: { user: User; tokens: { accessToken: string; refreshToken: string } };
  }> {
    this.logger.info(`Attempting to login user with email: ${payload.email}`);
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: payload.email },
      });
      if (!user) {
        this.logger.info(`User not found with email: ${payload.email}`);
        throw new UnauthorizedException('Invalid email or password');
      }

      if (user.registrationMethod !== RegistrationMethod.COMBINATION) {
        this.logger.info(
          `User registration method is not combination for email: ${payload.email}`,
        );
        throw new BadRequestException(
          `An account was found with a different login method. Please use ${user.registrationMethod} to login.`,
        );
      }

      const hashedInput = await hashPassword(payload.password);
      if (user.password !== hashedInput) {
        this.logger.info(
          `Invalid password for user with email: ${payload.email}`,
        );
        throw new UnauthorizedException('Invalid email or password');
      }

      this.logger.info(`User logged in successfully with ID: ${user.id}`);
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
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to login user');
    }
  }

  async loginWithGoogle(googleUser: {
    email?: string;
    fullName?: string;
    profilePictureUrl?: string;
  }): Promise<{
    status: 'success';
    data: { user: User; tokens: { accessToken: string; refreshToken: string } };
  }> {
    if (!googleUser.email) {
      throw new BadRequestException('Email not provided by Google');
    }
    this.logger.info(`Attempting Google login for email: ${googleUser.email}`);
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
        throw new BadRequestException(
          `An account was found with a different login method. Please use ${user.registrationMethod} to login.`,
        );
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
    } catch (error: unknown) {
      this.logger.error('Error logging in with Google', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to login user');
    }
  }

  async updateUserDetails(
    payload: Partial<User>,
  ): Promise<{ status: 'success'; data: User }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: payload.email! },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (
        payload.password &&
        user.registrationMethod !== RegistrationMethod.COMBINATION
      ) {
        throw new BadRequestException(
          'User does not meet the requirement. Cannot update password.',
        );
      }

      const updatedUser = await this.prisma.user.update({
        where: { email: payload.email! },
        data: { ...payload },
      });
      return { status: 'success', data: updatedUser };
    } catch (error: unknown) {
      this.logger.error('Error updating user details', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update user details');
    }
  }
}
