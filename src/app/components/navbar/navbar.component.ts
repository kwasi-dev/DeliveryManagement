import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd} from "@angular/router";
import { Platform, NavController } from '@ionic/angular';
import { ViewChild } from '@angular/core';
import { IonTabs } from '@ionic/angular';


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class NavbarComponent  implements OnInit {
  selectedBottomTab: string = "home";
  visitedTabs: string[] = [];
  @ViewChild('tabs', { static: false }) tabs!: IonTabs;

  constructor(private router: Router, private platform: Platform, private navCtrl: NavController) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects;
        console.log('Current URL:', url);

        if (url.includes('home')) {
          this.selectedBottomTab = 'home';
        } else if (url.includes('upload')) {
          this.selectedBottomTab = 'upload';
        } else {
          this.selectedBottomTab = 'settings';
        }
        this.visitedTabs.push(this.selectedBottomTab);
        console.log(this.visitedTabs)
        console.log(`Changed bottomtab to ${this.selectedBottomTab} for URL ${url}`)
      }
    });
  }

  ngOnInit() {
    this.platform.backButton.subscribeWithPriority(10, async () => {
     await this.goBackInTabs();
    });
  }
  async goBackInTabs() {
    if (this.visitedTabs.length > 1) {
      this.visitedTabs.pop();
      const previousTab = this.visitedTabs[this.visitedTabs.length - 1];
      this.selectedBottomTab = previousTab;
      this.tabs.select(previousTab);
    }
  }

}
