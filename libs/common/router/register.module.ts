import { DynamicModule, Type } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

function toPath(name: string): string {
  return name
    .replace(/Module$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

export function RegisterModule(
  prefix: string,
  modules: Type<any>[],
): DynamicModule {
  const routes = [
    {
      path: prefix,
      children: modules.map((module) => ({
        path: toPath(module.name),
        module,
      })),
    },
  ];
  return RouterModule.register(routes);
}
