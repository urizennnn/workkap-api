import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

/**
 * Build a simple error response schema with a consistent structure.  The
 * upstream repository exposes this helper so that error responses across
 * endpoints follow the same pattern.  The `exampleMessage` argument is used
 * to set the example message shown in the generated Swagger docs.
 *
 * @param exampleMessage A human friendly description of the error
 * @returns An OpenAPI schema object describing the error structure
 */
export function errorSchema(exampleMessage: string): SchemaObject {
  return {
    type: 'object',
    properties: {
      status: { type: 'string', example: 'error' },
      message: { type: 'string', example: exampleMessage },
    },
  };
}