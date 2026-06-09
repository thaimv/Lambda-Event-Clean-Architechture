import 'reflect-metadata';
import type { TNewable, TProviderMetadata } from '@common/types/di.type';

const MODULE_METADATA = {
  IMPORTS: Symbol('imports'),
  PROVIDERS: Symbol('providers'),
};

interface ModuleMetadata {
  /**
   * List of modules to import.
   */
  imports?: TNewable<unknown>[];
  /**
   * List of providers to register.
   */
  providers?: TProviderMetadata[];
}

/**
 * Decorator to define a module to be registered.
 * @param metadata metadata for the module to be registered
 */
export const Module = (metadata: ModuleMetadata): ClassDecorator => {
  return (target) => {
    Reflect.defineMetadata(MODULE_METADATA.IMPORTS, metadata.imports || [], target);
    Reflect.defineMetadata(MODULE_METADATA.PROVIDERS, metadata.providers || [], target);
  };
};

/**
 * Get the metadata for the module to be registered.
 * @param target target module object
 * @returns metadata for the module to be registered
 */
export const getModuleMetadata = (target: object): ModuleMetadata => {
  const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, target) || [];
  const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, target) || [];
  return { imports, providers };
};
