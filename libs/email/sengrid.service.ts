import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sg from '@sendgrid/mail';
import { pickFrom } from 'libs/config';
import {
  resetPasswordTemplate,
  verificationTemplate,
} from './templates';

@Injectable()
export class SengridService {
  private readonly sg: sg.MailService;
  private readonly setApiKey: string;
  private sendgridFromEmail: string;
  constructor(private readonly cfg: ConfigService) {
    this.setApiKey = pickFrom(cfg, 'sendgrid.api_key');
    this.sendgridFromEmail = pickFrom(cfg, 'sendgrid.from_email');
    sg.setApiKey(this.setApiKey);
  }

  async sendEmail(to: string, subject: string, html: string) {
    await this.sg.send({
      to,
      from: this.sendgridFromEmail,
      subject,
      html,
    });
  }

  async sendVerificationEmail(to: string, code: string) {
    await this.sendEmail(
      to,
      'Verify your email',
      verificationTemplate(code),
    );
  }

  async sendResetPasswordEmail(to: string, code: string) {
    await this.sendEmail(
      to,
      'Password reset',
      resetPasswordTemplate(code),
    );
  }
}
