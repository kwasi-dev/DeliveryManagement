export interface InvoiceReturn {
  id: number;
  partNo: string;
  invoiceNo: number;
  qtyadj: number;
  returntype: string;
  returndate: string;
  route: string;
  routeuser: string;
  generalNote: string;
  control: number;
}
