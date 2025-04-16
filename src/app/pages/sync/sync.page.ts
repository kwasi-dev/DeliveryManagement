import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, NavController } from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DataService } from 'src/app/services/database/data.service';
import { ToastController } from '@ionic/angular';
import { StorageService } from 'src/app/services/database/storage.service';
import { Invoice } from 'src/app/models/invoice';


@Component({
  selector: 'app-sync',
  templateUrl: './sync.page.html',
  styleUrls: ['./sync.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SyncPage implements OnInit {
  selectedDate: string = '';
  routeNo: string = '';
  baseURL: string = "http://3.208.13.82:2078/akiproorders/downloadinvoices"
  routes: string[] = ['ROUTE1', 'ROUTE2', 'ROUTE3', 'ROUTE4', 'ROUTE5', 'ROUTE6', 'ROUTE7', 'ROUTE8', 'ROUTE9', 'ROUTE10']

  constructor(private loadingCtrl: LoadingController, private http: HttpClient, private data: DataService, private toastController: ToastController, private storage: StorageService, private navCtrl: NavController) { }

  ngOnInit() {
  }


  
  goBack() {
    setTimeout(() => {
      this.navCtrl.back();
    }, 200)
  }
  
  minDate = '2024-08-01'
  // get minDate() {
  //   const min = new Date();
  //   min.setDate(min.getDate() - 14);
  //   return min.toISOString().split('T')[0];
  // }

  maxDate = '2024-09-20'
  // get maxDate() {
  //   const max = new Date();
  //   max.setDate(max.getDate() + 7);
  //   return max.toISOString().split('T')[0];
  // }

  onDateSelected(event: any) {
    this.selectedDate = event.detail.value.split('T')[0];
  }

  async downloadAndSave() {
    const loading = await this.loadingCtrl.create({
      message: "Downloading and Storing Data",
      spinner: 'crescent',
      backdropDismiss: false
    });

    await loading.present();
    try {

      this.data.fetchData(this.selectedDate, this.routeNo);
    } catch (err) {
      console.log('Ionic Download failed: ', err);
    } finally {
      await loading.dismiss();
    }
  }

  async uploadChanges() {
    const loading = await this.loadingCtrl.create({
      message: "Uploading Changes",
      spinner: 'crescent',
      backdropDismiss: false
    });

    await loading.present();

    try {
      const invoices = await this.storage.getAllInvoices();
      const invoiceItems = await this.storage.getAllInvoiceItems();

      const itemMap = new Map<number, { itemNo: number; returnsNo: number; discrepancies: number; }[]>();

      if (invoiceItems != null ) {
        invoiceItems.forEach((invoiceItem) => {
          if (!itemMap.has(invoiceItem.orderNo)) {
            itemMap.set(invoiceItem.orderNo, []);
          }

          if (invoiceItem.returnsNo > 0 || invoiceItem.discrepancies > 0) {
            itemMap.get(invoiceItem.orderNo)!.push({
              itemNo: invoiceItem.itemNo,
              returnsNo: invoiceItem.returnsNo,
              discrepancies: invoiceItem.discrepancies
            });
          }
        });

        const data = invoices?.map(invoice => ({
          invoiceNo: invoice.invoiceNo,
          orderNo: invoice.orderNo,
          generalNote: invoice.generalNote,
          invoiceStatus: invoice.generate,
          items: itemMap.get(invoice.orderNo) || []
        }));

        //const uploadURL = "http://3/208.13.82:2078/akiproorders/uploadinvoices";
        //const response = await this.http.post(uploadURL, data).toPromise();
        //console.log('Upload Success: ', response);
      }
    } catch (err) {
      console.log('Uploading Failed: ', err)
      throw err;
    } finally {
      await loading.dismiss();
    }
  }
}
