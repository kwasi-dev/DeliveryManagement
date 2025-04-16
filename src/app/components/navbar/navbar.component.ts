import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService } from 'src/app/services/search/search.service';
import { Router, NavigationEnd} from "@angular/router";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class NavbarComponent  implements OnInit {
  showSearch: boolean = false;
  showToolbar: boolean = true;
  selectedBottomTab: string = "";

  constructor(private searchService: SearchService, private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects;

        if (url.includes('/navbar/home')) {
          this.selectedBottomTab = 'home';
        } else if (url.includes('/navbar/settings')) {
          this.selectedBottomTab = 'settings';
        } else if (url.includes('/navbar/upload')) {
          this.selectedBottomTab = 'upload';
        }
      }
    });
  }

  ngOnInit() {
    this.searchService.init();
  }

  toggleSearch() {
    this.searchService.toggle();
  }
}