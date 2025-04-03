import { registerPlugin } from '@capacitor/core';

import type { NyxPrinterPlugin } from './definitions';

// const NyxPrinter = registerPlugin<NyxPrinterPlugin>('NyxPrinter', {
//   web: () => import('./web').then((m) => new m.NyxPrinterWeb()),
// });

const NyxPrinter = registerPlugin<NyxPrinterPlugin>('NyxPrinter');

export * from './definitions';
export { NyxPrinter };
