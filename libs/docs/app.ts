import { applyDecorators } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiOperation } from '@nestjs/swagger';

export const AppControllerSwagger = {
  controller: applyDecorators(ApiTags('App')),

  getHello: applyDecorators(
    ApiOperation({ summary: 'Root endpoint' }),
    ApiOkResponse({
      description: 'Returns a greeting message',
      schema: { type: 'string', example: 'Hello World!' },
    }),
  ),
};
