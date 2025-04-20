import { registerPlugin } from '@capacitor/core';

import type { NyxPrinterPlugin } from './definitions';

const NyxPrinter = registerPlugin<NyxPrinterPlugin>('NyxPrinter', {
  web: () => import('./web').then((m) => new m.NyxPrinterWeb()),
});

export * from './definitions';
export { NyxPrinter };
