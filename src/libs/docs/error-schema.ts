import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export function errorSchema(exampleMessage: string): SchemaObject {
  return {
    type: 'object',
    properties: {
      status: { type: 'string', example: 'error' },
      message: { type: 'string', example: exampleMessage },
    },
  };
}
