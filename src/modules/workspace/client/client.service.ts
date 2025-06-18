import { Injectable } from '@nestjs/common';

@Injectable()
export class ClientService {
  getClientData() {
    return { message: 'client workspace' };
  }
}
