import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../services/database/storage.service';
import { Invoice } from '../../models/invoice';
import { InvoicedetailsComponent } from '../../components/invoicedetails/invoicedetails.component';
import { FormsModule } from '@angular/forms';  // ✅ Import FormsModule
import { ModalController } from '@ionic/angular'
import { InvoiceItem } from '../../models/invoice_item';
import { IonSearchbar } from '@ionic/angular';
import { ViewChild } from '@angular/core';
import { SearchService } from 'src/app/services/search/search.service';

 @Component({
 selector: 'app-home',
 templateUrl: 'home.page.html',
 styleUrls: ['home.page.scss'],
 standalone: true,
 imports: [IonicModule, CommonModule, FormsModule],
 })

 export class HomePage implements OnInit {
    invoices: any[] = []; // Stores all invoices
    filteredInvoices: any[] = []; // Stores filtered invoices
    shownInvoices: any[] = [];

    searchQuery: string = ''; // Stores the search input

    deliveredCount: number = 0;
    undeliveredCount: number = 0;
    returnsCount: number = 0;
    totalCount: number = 0;

    showSearch: boolean = false;
    showToolbar: boolean = true;

  constructor(private storage: StorageService, private modalCtrl: ModalController, private searchService: SearchService) {}

  async ngOnInit() {
    this.invoices = await this.storage.getInvoices();
    this.convertDates();
    this.filteredInvoices = [...this.invoices];
    this.updateInvoiceSummary();
    
    this.searchService.showSearch$.subscribe(state => {
      if (state === true) {
        this.showSearch = true;
        this.ngAfterViewInit()
      } else {
        this.showSearch = state;
      }
    });

    this.searchService.showToolbar$.subscribe(ToolbarState => {
      if (ToolbarState === true) {
        this.cancelSearch();
      } else {
        this.showToolbar = ToolbarState;
      }
    });
  }

  // Dynamically Update the Toolbar upon changes
  updateInvoiceSummary() {
    this.deliveredCount = this.invoices.filter(inv => inv.generate === 'Y').length;
    this.undeliveredCount = this.invoices.filter(inv => inv.generate !== 'Y').length;
    this.returnsCount = this.invoices.reduce((total, inv) => total + (inv.returnsNo || 0), 0);
    this.totalCount = this.invoices.length;
  }

  // Search based on Company Name, Invoice number and Date.
  filterInvoices(event: any) {
    const rawQuery = event.target.value || '';
    const query = normalize(rawQuery);
  
    this.filteredInvoices = this.invoices.filter(invoice => {
      return normalize(invoice.company).includes(query) ||
             invoice.invoiceNo.toString().includes(query) ||
             normalize(invoice.invoiceDate).includes(query); // ✅ this line
    });
  }
  
  // Creates Modal for Invoice Details
  async openInvoiceDetails(invoice: Invoice) {
    const items = await this.storage.getInvoiceItems(invoice.orderNo)
    const modal = await this.modalCtrl.create({
      component: InvoicedetailsComponent,
      componentProps: { invoice, items }, // Pass invoice data to modal
    });
    return await modal.present();
  }

  // Selects a specific tab in the header bar and filters the results
  selectedTab = 'all';
  setTopTab(tab: string) {
    this.selectedTab = tab;
    switch (tab) {
      case 'all':
        this.showAll();
        break;
      case 'delivered':
        this.showDelivered();
        break;
      case 'pending':
        this.showPending();
        break;
      case 'returns':
        this.showReturns();
        break;
    }
  }
 
  // Shows all invoices
  showAll() {
    this.shownInvoices = this.invoices
    this.filteredInvoices = this.shownInvoices
  }

  // Shows Delivered invoices
  showDelivered() {
    this.shownInvoices = this.invoices.filter(invoice => invoice.generate === 'Y')
    this.filteredInvoices = this.shownInvoices
  }

  // Shows undelivered invoices
  showPending() {
    this.shownInvoices = this.invoices.filter(invoice => invoice.generate === 'N')
    this.filteredInvoices = this.shownInvoices
  }

  // Show returns
  showReturns() {
    this.shownInvoices = this.invoices
    this.filteredInvoices = this.shownInvoices
  }

  // Convert the date in invoice array to a readable format and return the invoices
  convertDates() {
    for (let i = 0; i < this.invoices.length; i++) {
      this.invoices[i].invoiceDate = formatDate(this.invoices[i].invoiceDate)
    }
  }

  // Opens keyboard to search bar after small delay when search is clicked
  @ViewChild('searchBar', { static: false }) searchBar!: IonSearchbar;
  ngAfterViewInit() {
    setTimeout(() => {
      this.searchBar?.setFocus();
    }, 300);
  }

  // Handles cancel search click back to home page
  cancelSearch() {
    setTimeout(() => {
      this.searchQuery = ''
      this.toggleSearchBar()
    }, 300);
  }

  // Hide Search Bar
  toggleSearchBar() {
    if (this.showSearch === true) {
      this.showSearch = !this.showSearch;
      this.showToolbar = !this.showToolbar;
    }
  }
}

// Functions to convert dateformat to readable
function formatDate(dateStr: string): string {
   const date = new Date(dateStr);
   const day = date.getDate();
   const month = date.toLocaleString('en-US', { month: 'short'});
   const year = date.getFullYear();

   const suffix = getSuffix(day);
   return `${month} ${day}${suffix} ${year}`;
}

 function getSuffix(day: number): string {
   if (day > 3 && day < 21) return 'th';
   switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th'
   }
}

function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}
