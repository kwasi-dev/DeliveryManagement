export interface PrintTextOptions {
  text: string;
}

export interface PrintTextResult {
  result: number;
}

export interface NyxPrinterPlugin {
  isReady(): Promise<IsReadyResult>;
  printText(options: PrintTextOptions): Promise<PrintTextResult>;
}

export interface IsReadyResult {
  connected: boolean;
}