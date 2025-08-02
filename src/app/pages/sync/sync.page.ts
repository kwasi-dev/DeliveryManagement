import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonicModule, LoadingController, NavController, ToastController} from '@ionic/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DataService } from 'src/app/services/database/data.service';
import { StorageService } from 'src/app/services/database/storage.service';
import { Invoice } from 'src/app/models/invoice';
import {Toast} from "@capacitor/toast";


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

  ngOnInit(): void {
    console.log("")
  }

  goBack() {
    setTimeout(() => {
      this.navCtrl.back();
    }, 200)
  }

  minDate = '2024-06-01'
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
      await this.data.fetchData(this.selectedDate, this.routeNo);
    } catch (err) {
      loading.message = `Download failed. Please try again`;
      console.log('Ionic Download failed: ', err);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      await new Promise(resolve => setTimeout(resolve, 750));
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
      const returns = await this.storage.getAllUnsyncedReturns();
      console.log(JSON.stringify(returns));

      if (returns !== null){
        let datas: any[] = []

        returns.forEach((ret)=>{
          let matchingRoute = datas.find(element => element.data.attributes.route == ret.route && element.data.attributes.returndate == ret.returndate);
          if (matchingRoute === undefined){
            matchingRoute = {
              "data": {
                "attributes":{
                  "route": ret.route,
                  "routeuser": ret.routeuser,
                  "returndate": ret.returndate,
                  "notes": [],
                  "returnitems": [],
                  "mobile_ids": []
                }
              }
            }
            datas.push(matchingRoute);
          }
          if (ret.generalNote !== ''){
            matchingRoute.data.attributes.notes.push({
              "notes": ret.generalNote,
              "invoiceno": ret.invoiceNo
            });
          }
          matchingRoute.data.attributes.returnitems.push({
            "partno": ret.partNo,
            "invoiceno": ret.invoiceNo,
            "qtyadj": ret.qtyadj,
            "returntype": ret.returntype
          });
          matchingRoute.data.attributes.mobile_ids.push(ret.id);
        });

        for (const data of datas){
          try {
            console.log(`Posting return data to server: ${JSON.stringify(data)}`);

            const response = await fetch('http://3.208.13.82:2078/akiproorders/uploadadjustments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            } else {
              const json = await response.json();
              const controlId = json.data.attributes.controlid;
              console.log(`Success JSON ${JSON.stringify(json)}`);
              console.log(`Got control ID: ${controlId}`);

              console.log(`Update control ID for internal IDS: ${data.data.attributes.mobile_ids}`)
              await this.storage.setControlId(controlId,data.data.attributes.mobile_ids,)

              const resp2 = await fetch('http://3.208.13.82:2078/akiproorders/uploadcontrol', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  "data":{
                    "attributes":{
                      "controlid": controlId,
                      "controlaction": "ComfirmUploadReturns"
                    }
                  }
                }),
              });

            }
            console.log('Data posted successfully');

          } catch (error){
            console.error('Error posting data:', error);
            await Toast.show({text: "Failed to sync data. Please check your internet connection and try again!"});
          }
        }
      }


    } catch (err) {
      console.log('Uploading Failed: ', err)
      throw err;
    } finally {
      await loading.dismiss();
    }
  }


}
