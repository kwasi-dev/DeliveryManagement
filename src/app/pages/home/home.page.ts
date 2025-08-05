import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../services/database/storage.service';
import { Invoice } from '../../models/invoice';
import { InvoicedetailsComponent } from '../../components/invoicedetails/invoicedetails.component';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular'
import { InvoiceItem } from '../../models/invoice_item';
import { IonSearchbar } from '@ionic/angular';
import { ViewChild } from '@angular/core';
import { SearchService } from 'src/app/services/search/search.service';
import { PopoverController } from "@ionic/angular";
import { FilterPopoverComponent } from 'src/app/components/filter-popover/filter-popover.component';
import {InvoiceReturn} from "../../models/invoice_return";

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
    returnInvoices: any[] = []; // Invoices that has returns

    shownInvoices: any[] = [];
    shownReturns: any[] = [];

    searchQuery: string = ''; // Stores the search input
    filterParameter: string = 'Today';

    deliveredCount: number = 0;
    undeliveredCount: number = 0;
    returnsCount: number = 0;
    totalCount: number = 0;

    showSearch: boolean = false;
    showToolbar: boolean = true;

    returnSelected: boolean = false;

    startDate: any = null;
    endDate: any = null;


    groupedReturns: { [key: string]: InvoiceReturn[] } ={};

  constructor(private storage: StorageService, private modalCtrl: ModalController, private searchService: SearchService, private popOverCtrl: PopoverController) {}

  // Listen for data updates and auto update UI
  async ngOnInit() {
    this.storage.homePageList.subscribe(async data => {
      this.invoices = data;
      await this.filter(this.filterParameter, this.startDate, this.endDate);
    })

    this.storage.returnsList.subscribe(async data => {
      this.returnInvoices = data;
      this.groupedReturns = {};
      for (let retInv of this.returnInvoices){
          if (!(retInv.invoiceNo in this.groupedReturns)){
            this.groupedReturns[retInv.invoiceNo] = [];
          }
          this.groupedReturns[retInv.invoiceNo].push(retInv);
      }
      await this.filter(this.filterParameter, this.startDate, this.endDate);
    })

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
    this.deliveredCount =  this.shownInvoices.filter(inv => inv.generate === 'Y').length;
    this.undeliveredCount = this.shownInvoices.filter(inv => inv.generate !== 'Y').length;
    this.returnsCount = this.shownReturns.reduce((total, inv) => total + (inv.qtyadj || 0), 0);
    console.log(`Returns count ${this.returnsCount}`)
  }

  // Search based on Company Name, Invoice number and Date.
  filterInvoices(event: any) {
    const rawQuery = event.target.value || '';
    const query = normalize(rawQuery);

    this.filteredInvoices = this.invoices.filter(invoice => {
      return normalize(invoice.company).includes(query) ||
             invoice.invoiceNo.toString().includes(query) ||
             normalize(invoice.invoiceDate).includes(query) ||
             invoice.custNo?.toString().includes(query);
    });
  }

  // Filter Button Functions

  filterByToday() {
    const date = '2024-09-02';
    this.shownInvoices = this.invoices.filter(invoice => invoice.invoiceDate.includes(date));
    this.shownReturns = this.returnInvoices.filter(inv => inv.returndate.includes(date));
    this.groupedReturns = {};
    for (let retInv of this.shownReturns){
      if (!(retInv.invoiceNo in this.groupedReturns)){
        this.groupedReturns[retInv.invoiceNo] = [];
      }
      this.groupedReturns[retInv.invoiceNo].push(retInv);
    }
    this.filterParameter = 'Today';
  }

  filterByDate(date: string) {
    const dateString = date.split('T')[0];
    this.shownInvoices = this.invoices.filter(invoice => invoice.invoiceDate.includes(dateString));
    this.shownReturns = this.returnInvoices.filter(inv => inv.returndate.includes(dateString));
    this.groupedReturns = {};
    for (let retInv of this.shownReturns){
      if (!(retInv.invoiceNo in this.groupedReturns)){
        this.groupedReturns[retInv.invoiceNo] = [];
      }
      this.groupedReturns[retInv.invoiceNo].push(retInv);
    }
    this.filterParameter = 'Specific Date';
  }

  filterByAll() {
    this.returnSelected = false;
    this.shownInvoices = this.invoices;
    this.shownReturns = this.returnInvoices;
    this.groupedReturns = {};
    for (let retInv of this.shownReturns){
      if (!(retInv.invoiceNo in this.groupedReturns)){
        this.groupedReturns[retInv.invoiceNo] = [];
      }
      this.groupedReturns[retInv.invoiceNo].push(retInv);
    }

    this.filterParameter = 'All';
  }

  filterByRange(start: string, end: string) {
    const startDate = new Date(start).toISOString().split('T')[0];
    const endDate = new Date(end).toISOString().split('T')[0];

    this.shownInvoices = this.invoices.filter(invoice => {
      const invDate = new Date(invoice.returndate).toISOString().split('T')[0];
      return invDate >= startDate && invDate <= endDate;
    });

    this.shownReturns = this.returnInvoices.filter(inv => {
      const invDate = new Date(inv.invoiceDate).toISOString().split('T')[0];
      return invDate >= startDate && invDate <= endDate;
    });

    this.groupedReturns = {};
    for (let retInv of this.shownReturns){
      if (!(retInv.invoiceNo in this.groupedReturns)){
        this.groupedReturns[retInv.invoiceNo] = [];
      }
      this.groupedReturns[retInv.invoiceNo].push(retInv);
    }

    this.filterParameter = 'Range';
  }

  async filter(type: string, start: string | null, end: string | null) {
    switch (type) {
      case 'All':
        this.filterByAll();
        await this.setTopTab(this.selectedTab);
        this.updateInvoiceSummary();
        break;
      case 'Today':
        this.filterByToday();
        await this.setTopTab(this.selectedTab);
        this.updateInvoiceSummary();
        break;
      case 'Range':
        if (start != null && end != null) {
        this.filterByRange(start, end);
        await this.setTopTab(this.selectedTab);
        this.updateInvoiceSummary();
        }
        break;
      case 'Specific Date':
        if (start != null) {
          this.filterByDate(start);
          await this.setTopTab(this.selectedTab);
          this.updateInvoiceSummary();
        }
        break;
    }
  }

  // Creates Modal for Invoice Details
  async openInvoiceDetails(invoice: Invoice) {
    const items = await this.storage.getInvoiceItems(invoice.orderNo)
    const products = await this.storage.getAllProducts()
    const modal = await this.modalCtrl.create({
      component: InvoicedetailsComponent,
      componentProps: {
        invoice,
        items,
        products
      }, // Pass invoice data to modal
    });
    return await modal.present();
  }

  // Selects a specific tab in the header bar and filters the results
  selectedTab = 'delivered';
  async setTopTab(tab: string) {
    this.selectedTab = tab;
    switch (tab) {
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

  // Shows Delivered invoices
  showDelivered() {
    this.returnSelected = false
    this.filteredInvoices = this.shownInvoices.filter(invoice => invoice.generate === 'Y')
  }

  // Shows undelivered invoices
  showPending() {
    this.returnSelected = false;
    this.filteredInvoices = this.shownInvoices.filter(invoice => invoice.generate === 'N')
  }

  // Show returns
  showReturns() {
    this.returnSelected = true;
    this.filteredInvoices = [];
  }

  async openFilterPopover(ev: any) {
    const popover = await this.popOverCtrl.create({
      component: FilterPopoverComponent,
      event: ev,
      translucent: true,
      showBackdrop: false
    });

    await popover.present();

    const { data, role } = await popover.onWillDismiss();
    if(role === "confirm" && data?.filter) {
      if (data.filter === 'Range') {
        await this.filter(data.filter, data.start, data.end);
      } else if (data.filter === 'Specific Date') {
        await this.filter(data.filter, data.date, null)
      } else {
        await this.filter(data.filter, null, null);
      }
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
