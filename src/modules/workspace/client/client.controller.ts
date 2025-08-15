import { Controller, Get } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientDocs } from 'src/libs';

@Controller()
@ClientDocs.controller
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  @ClientDocs.getData
  getData() {
    return this.clientService.getClientData();
  }
}
