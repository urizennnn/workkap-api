import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sg from '@sendgrid/mail';
import { pickFrom } from 'src/libs/config';
import { resetPasswordTemplate, verificationTemplate } from './templates';

@Injectable()
export class SengridService {
  private readonly logger = new Logger(SengridService.name);
  private readonly setApiKey: string;
  private sendgridFromEmail: string;
  constructor(private readonly cfg: ConfigService) {
    this.setApiKey = pickFrom(this.cfg, 'sendgrid.api_key', 'app');
    this.sendgridFromEmail = pickFrom(this.cfg, 'sendgrid.from_email', 'app');
    sg.setApiKey(this.setApiKey);
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      await sg.send({
        to,
        from: this.sendgridFromEmail,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send email: ${(error as Error).message}`);
    }
  }

  async sendVerificationEmail(to: string, code: string) {
    try {
      const html = verificationTemplate(code);
      await this.sendEmail(to, 'Verify your email', html);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email: ${(error as Error).message}`,
      );
    }
  }

  async sendResetPasswordEmail(to: string, code: string) {
    try {
      const html = resetPasswordTemplate(code);
      await this.sendEmail(to, 'Password reset', html);
    } catch (error) {
      this.logger.error(
        `Failed to send reset password email: ${(error as Error).message}`,
      );
    }
  }
}
