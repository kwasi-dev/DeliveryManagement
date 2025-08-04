import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Invoice } from 'src/app/models/invoice';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReturnDiscrepancyModalComponent } from '../return-discrepancy-modal/return-discrepancy-modal.component';
import { StorageService } from 'src/app/services/database/storage.service';
import { Toast } from '@capacitor/toast';
import { NyxPrinter } from 'nyx-printer/src';

@Component({
  selector: 'app-invoicedetails',
  templateUrl: './invoicedetails.component.html',
  styleUrls: ['./invoicedetails.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class InvoicedetailsComponent {
  @Input() invoice!: any;
  @Input() items!: any;
  @Input() products!: any;
  receipt: string = '';
  total: number = 0;
  vat: number = 0;
  discount: number = 0;

  constructor(public modalCtrl: ModalController, private storage: StorageService) {
  }

  close() {
    this.modalCtrl.dismiss();
  }

  async confirmDelivery() {
    await this.storage.updateInvoiceStatus(this.invoice.invoiceNo, 'Y');
    await this.generateReceipt();
    console.log("Delivery confirmed for Invoice:", this.invoice.invoiceNo);
    NyxPrinter.isReady().then(res => {
      if (res.connected) {
        NyxPrinter.printText({ text: this.receipt });
      } else {
        console.error('Printer service not ready yet');
      }
    });
    this.modalCtrl.dismiss();
  }

  async handleReturnOrDiscrepancy() {
    const modal = await this.modalCtrl.create({
      component: ReturnDiscrepancyModalComponent,
      componentProps: { invoice: this.invoice, products: this.products }
    });
    return await modal.present();
  }

  async generateReceipt() {
    this.receipt = `Confirmation of Delivery\n${this.invoice.company}\nInvoice: ${this.invoice.invoiceNo}\nRoute: ${this.invoice.routeNo}\nCustomer: ${this.invoice.custNo}\nDate: ${this.invoice.invoiceDate.split('T')[0]}\nNote: ${this.invoice.generalNote}\n\nList of Items:\n`;
    for (const item of this.items) {
      this.receipt += `${this.getProductName(item.partNo)} x ${item.quantity} units\n`
    }
    this.receipt += `Total: ${this.invoice.totalItems.toFixed(2)}\n\n\n____________________________\nSignature\n\n\n`;
  }

  getProductName(partNo:string){
    for (const product of this.products){
      if (product.partNo === partNo){
        return `${partNo} - ${product.description}`;
      }
    }
    return partNo;
  }

  async ngOnInit() {
    for (const item of this.items) {
      this.total += item.price * item.quantity;
      this.vat += item.vat;
    }
  }
}
