import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Customer } from '../../models/customer';
import { InvoiceItem } from '../../models/invoice_item';
import { Invoice } from '../../models/invoice';
import { HttpClient } from '@angular/common/http';
import { NyxPrinter } from 'nyx-printer/src';
import {Product} from "../../models/product";


@Injectable({
  providedIn: 'root'
})

export class DataService {
  private baseURL = "";
  private customerList: Customer[] = [];
  private invoiceItemList: InvoiceItem[] = [];
  private invoiceList: Invoice[] = [];
  private productList: Product[] = [];

  constructor(private storage: StorageService, private http: HttpClient) {}

  async fetchData(date: string, route: string) {
    this.customerList = [];
    this.invoiceItemList = [];
    this.invoiceList = [];
    this.productList = [];
    this.baseURL = await this.storage.getBaseUrl();

    const url = `${this.baseURL}/akiproorders/downloadinvoices/${date}/${route}`

    this.http.get(url).subscribe({
      next: async (data) => {
        console.log("Ionic Response Receieved")
        const customers_items = (data as any).customer_details;

        if (customers_items) {
          customers_items.forEach((customer:any) => {
            this.pushCustomer(customer);
          });
        }

        const invoices = (data as any).invoice_master;
        if (invoices) {
          invoices.forEach((record: any) => {
            this.pushInvoice(record);
          })
        }

        const invoice_items = (data as any).invoice_items;
        if (invoice_items) {
          invoice_items.forEach((record: any) => {
            this.pushInvoiceItem(record);
          })
        }

        const products = (data as any).products;
        if (products){
          products.forEach((record: any) =>{
            if (record.attributes){
              this.pushProduct(record);
            }
          });
        }


        this.mapCust();
        await this.store();

        const receipt = this.generateReceipt(route, date);
        NyxPrinter.isReady().then(res => {
          if (res.connected) {
            NyxPrinter.printText({ text: receipt });
          } else {
            console.error('Printer service not ready yet');
          }
        });
      },
      error: (error) => console.log("Ionic Error requesting: ", error.message)
    });
  }

  generateReceipt(route: string, date: string) {
    var receiept = `Confirmation of Download\nRoute: ${route}\nDate: ${date}\nList of Invoices\n`;
    this.invoiceList.forEach(invoice=> receiept += `${this.getCustomerForInvoice(invoice.custNo)} - ${invoice.invoiceNo}\n`);
    receiept += "\n\n\n_____________________\n   Signature\n\n\n";
    console.log(`Printed Receipt: ${receiept}`)
    return receiept;
  }

  getCustomerForInvoice(invoiceNumber: number){
    console.log(`The customer list: ${JSON.stringify(this.customerList)}`);
    return this.customerList.find(c => c.id === invoiceNumber)?.company || 'Unknown Customer';
  }

  pushCustomer(record: any) {
    this.customerList.push({
      'id': record.attributes.custno,
      'areaNo': record.attributes.areano,
      'lastInvoiceDate': record.attributes.lastinvoicedate,
      'company': record.attributes.company,
      'contact': record.attributes.contact ?? "",
      'email': record.attributes.emailaddress ?? "",
      'phone': record.attributes.phone,
      'terms': record.attributes.terms ?? "",
      'type': record.attributes.type,
      'addr1': record.attributes.addr1,
      'addr2': record.attributes.addr2 ?? ""
    });
  }

  pushInvoiceItem(invoiceItem: any) {
    this.invoiceItemList.push({
      'itemNo': invoiceItem.attributes.itemno,
      'numPerPack': invoiceItem.attributes.num_per_pack,
      'orderNo': invoiceItem.attributes.orderno,
      'packs': invoiceItem.attributes.packs,
      'partNo': invoiceItem.attributes.partno,
      'quantity': invoiceItem.attributes.qty,
      'returnsNo': invoiceItem.attributes.returnsno,
      'price': invoiceItem.attributes.storedprice,
      'vat': invoiceItem.attributes.vatamount,
      'vatRate': invoiceItem.attributes.vatrate,
      'discrepancies': invoiceItem.attributes.discrepencies,
      'discount': invoiceItem.attributes.discount,
      'creditNotes': invoiceItem.attributes.creditnotes
    });
  }

  pushInvoice(invoice: any) {
    this.invoiceList.push({
      'invoiceNo': invoice.attributes.invoiceno,
      'orderNo': invoice.attributes.orderno,
      'custNo': invoice.attributes.custno,
      'routeNo': invoice.attributes.routeno,
      'standingDay': invoice.attributes.standing_day,
      'invoiceDate': invoice.attributes.invoicedate,
      'generate': invoice.attributes.generate,
      'generalNote': invoice.attributes.generalnote ?? "",
      'custDiscount': invoice.attributes.custdiscount,
      'taxRate': invoice.attributes.taxrate,
      'terms': invoice.attributes.terms ?? "",
      'totalDiscount': invoice.attributes.totaldiscount,
      'totalDiscount_adjdown': invoice.attributes.totaldiscount_adjdown,
      'totalDiscount_adjup': invoice.attributes.totaldiscount_adjup,
      'totalItems': invoice.attributes.totalitems,
      'totalItems_adjdown': invoice.attributes.totalitems_adjdown,
      'totalItems_adjup': invoice.attributes.totalitems_adjup,
      'totalVat': invoice.attributes.totalvat,
      'totalVat_adjdown': invoice.attributes.totalvat_adjdown,
      'totalVat_adjup': invoice.attributes.totalvat_adjup
    });
  }
  pushProduct(product: any) {
    this.productList.push({
      'description': product.attributes.description,
      'partNo': product.attributes.partno
    });
  }

  mapCust() {
    var count = 0;
    const customerIDs = this.invoiceList.map(c => c.custNo).filter(Boolean);

    this.customerList.forEach(customer => {
      customer.id = customerIDs[count];
      count++;
    })
  }

  async store() {
    await this.storage.addCustomers(this.customerList);
    await this.storage.addInvoices(this.invoiceList);
    await this.storage.addInvoiceItems(this.invoiceItemList);
    await this.storage.addProductItems(this.productList);
  }
}
