export interface Invoice {
    invoiceNo: number;
    orderNo: number;
    custNo: number;
    routeNo: string;
    standingDay: string;
    invoiceDate: string;
    generate: string;
    generalNote: string;
    custDiscount: number;
    taxRate: number;
    terms: string;
    totalDiscount: number;
    totalDiscount_adjdown: number;
    totalDiscount_adjup: number;
    totalItems: number;
    totalItems_adjdown: number;
    totalItems_adjup: number;
    totalVat: number;
    totalVat_adjdown: number;
    totalVat_adjup: number;
}