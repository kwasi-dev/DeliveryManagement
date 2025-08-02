import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { StorageService } from 'src/app/services/database/storage.service';
import { Toast } from '@capacitor/toast';
import { InvoiceItem } from 'src/app/models/invoice_item';

@Component({
  selector: 'app-return-discrepancy-modal',
  templateUrl: './return-discrepancy-modal.component.html',
  styleUrls: ['./return-discrepancy-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ReturnDiscrepancyModalComponent implements OnInit {
  @Input() invoice!: any;
  @Input() products!: any;
  items!: any;
  selectedItems: any[] = [];
  selectedType: string = "R";
  quantityArr!: number[];
  generalNote = '';
  returnDate: string = new Date().toISOString();

  constructor(private modalCtrl: ModalController, private storage: StorageService) {}

  async ngOnInit() {
    this.items = await this.storage.getInvoiceItems(this.invoice.orderNo);
    this.quantityArr = await Array(this.items.length).fill(0);
  }

  async postChange() {

    const returns = this.items.map((item: InvoiceItem, index: number) => ({
      partNo: item.partNo,
      invoiceNo: this.invoice.invoiceNo,
      qtyadj: this.quantityArr[index],
      returntype: this.selectedType,
      returndate: this.returnDate.split('T')[0],
      route: this.invoice.routeNo,
      routeuser: this.invoice.routeNo,
      generalNote: this.generalNote,
    })).filter((r: { qtyadj: number }) => r.qtyadj > 0);

    if (returns.length > 0){
      await this.storage.logReturns(returns);
    }
    await this.modalCtrl.dismiss();
  }

  getProductName(partNo:string){
    for (const product of this.products){
      if (product.partNo === partNo){
        return `${partNo} - ${product.description}`;
      }
    }
    return partNo;
  }

  close() {
    this.modalCtrl.dismiss();
  }

  increase(index: number) {
    if (this.quantityArr[index] < this.items[index].quantity) {
      this.quantityArr[index]++;
    }
  }

  decrease(index: number) {
    if (this.quantityArr[index] > 0) {
      this.quantityArr[index]--;
    }
  }

  validateInput(index: number) {
    const max = this.items[index].quantity;
    let value = this.quantityArr[index];

    if (value < 0) {
      this.quantityArr[index] = 0;
    } else if (value > max) {
      this.quantityArr[index] = max;
    }
  }
}
