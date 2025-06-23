import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sg from '@sendgrid/mail';
import { pickFrom } from 'libs/config';

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

  async sendEmail() {}
}
