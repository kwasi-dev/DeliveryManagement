import { WebPlugin } from '@capacitor/core';

import type { NyxPrinterPlugin } from './definitions';

export class NyxPrinterWeb extends WebPlugin implements NyxPrinterPlugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }
}
