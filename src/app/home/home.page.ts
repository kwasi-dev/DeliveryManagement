import { Component } from '@angular/core';
 import { IonicModule } from '@ionic/angular';
 import { UsersComponent } from '../components/users/users.component';
 import { CommonModule } from '@angular/common';

 @Component({
 selector: 'app-home',
 templateUrl: 'home.page.html',
 styleUrls: ['home.page.scss'],
 standalone: true,
 imports: [IonicModule, CommonModule],
 })
 export class HomePage {
    isDropdownHidden = true;

 constructor() {}

 toggleDropDown() {
    this.isDropdownHidden = !this.isDropdownHidden;
 }
}