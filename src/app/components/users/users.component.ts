import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../services/storage.service';
import { Customer } from '../../models/customer';
import { of, switchMap } from 'rxjs';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  imports: [CommonModule, IonicModule, FormsModule],
  standalone: true,
})

export class UsersComponent implements OnInit {
  newUserName = ''
  userList: Customer[] = []
  isWeb: any

  constructor(private storage: StorageService, private dataService: DataService) {}

  async ngOnInit() {
    try {
      if (this.storage.databaseState()) {
        this.dataService.getData();
      }
      this.storage.databaseState().pipe(
        switchMap(res => {
          if (res) {
            return this.storage.fetchCustomers();
          } else {
            return of([]);
          }
        })
      ).subscribe(data => {
        this.userList = data; // Update the user list when the data changes
      });
    } catch (err) {
      throw new Error(`Error: ${err}`);
    }
  }

  //async createCustomer() {
  //  await this.storage.addCustomer(this.newUserName)
  //  this.newUserName = ''
  //  console.log(this.userList, '#customers')
  //}

  //updateCustomer(customer: Customer) {
  //  const active = customer.active === 0 ? 1 : 0
  //  this.storage.updateCustomerById(customer.id.toString(), active)
  //}

  //deleteCustomer(customer: Customer) {
  //  this.storage.deleteCustomerById(customer.id.toString())
  //}
}