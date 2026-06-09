import { getModuleMetadata } from '@common/decorators/module.decorator';
import type { TNewable, TProviderMetadata } from '@common/types/di.type';
import { Container } from 'inversify';

const container = new Container();

/**
 * Register all objects to the container and add controllers to the router
 * @param entryModule the entry module of the application
 * @param router the router instance
 */
export function bootstrapApplication(entryModule: TNewable<unknown>) {
  const { imports, providers } = getModuleMetadata(entryModule);

  // Recursively bind and add other modules
  if (imports) {
    imports.forEach((importModule) => {
      bootstrapApplication(importModule);
    });
  }

  // Bind providers to the container
  bindProviders(providers);
}

function bindProviders(providers: TProviderMetadata[] | undefined) {
  providers?.forEach((provider) => {
    if (typeof provider === 'function') {
      if (container.isBound(provider)) {
        return;
      }
      container.bind(provider).toSelf().inSingletonScope();
      return;
    }

    if (container.isBound(provider.provide)) {
      return;
    }

    if ('useValue' in provider) {
      container.bind(provider.provide).toConstantValue(provider.useValue);
    } else if ('useClass' in provider && provider.useClass) {
      container.bind(provider.provide).to(provider.useClass).inSingletonScope();
    } else if ('useFactory' in provider && provider.useFactory) {
      container.bind(provider.provide).toDynamicValue(provider.useFactory);
    }
  });
}

/**
 * Get the instance of the provider from the container
 * @param provider the provider key to get the instance
 * @returns the instance of the provider
 */
export function getInstance<T>(provider: symbol | string | TNewable<T>): T {
  return container.get(provider);
}
