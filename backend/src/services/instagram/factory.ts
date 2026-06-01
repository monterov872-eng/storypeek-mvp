import type { AppConfig } from '../../config.js';
import type { InstagramProvider } from './provider.js';
import { LiveInstagramProvider } from './liveProvider.js';
import { MockInstagramProvider } from './mockProvider.js';
import { GenericRestInstagramSource } from './sources/genericRest/source.js';
import { WebPublicInstagramSource } from './sources/webPublic/source.js';

export function createInstagramProvider(config: AppConfig): InstagramProvider {
  switch (config.INSTAGRAM_PROVIDER) {
    case 'mock':
      return new MockInstagramProvider();

    case 'web': {
      const source = new WebPublicInstagramSource(config);
      return new LiveInstagramProvider(source, config);
    }

    case 'rest': {
      const source = new GenericRestInstagramSource(config);
      return new LiveInstagramProvider(source, config);
    }

    default:
      throw new Error(`Unknown INSTAGRAM_PROVIDER: ${config.INSTAGRAM_PROVIDER}`);
  }
}
