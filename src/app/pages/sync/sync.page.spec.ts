import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SyncPage } from './sync.page';
import { LoadingController, NavController, ToastController, ModalController } from '@ionic/angular';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DataService } from 'src/app/services/database/data.service';
import { StorageService } from 'src/app/services/database/storage.service';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


describe('SyncPage', () => {
  let component: SyncPage;
  let fixture: ComponentFixture<SyncPage>;
  let loadingCtrl: jasmine.SpyObj<LoadingController>;
  let navCtrl: jasmine.SpyObj<NavController>;
  let toastCtrl: jasmine.SpyObj<ToastController>;
  let dataService: jasmine.SpyObj<DataService>;
  let storageService: jasmine.SpyObj<StorageService>;
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    loadingCtrl = jasmine.createSpyObj('LoadingController', ['create']);
    navCtrl = jasmine.createSpyObj('NavController', ['back']);
    toastCtrl = jasmine.createSpyObj('ToastController', ['create']);
    dataService = jasmine.createSpyObj('DataService', ['fetchData']);
    storageService = jasmine.createSpyObj('StorageService', ['getAllInvoices', 'getAllInvoiceItems']);
    
    // Return a resolved Promise with an empty array for invoices and invoice items
    storageService.getAllInvoices.and.returnValue(Promise.resolve([])); // Mock returning empty invoices
    storageService.getAllInvoiceItems.and.returnValue(Promise.resolve([])); // Mock returning empty invoice items
  
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, IonicModule.forRoot(), CommonModule, FormsModule, SyncPage], // Import SyncPage as standalone component
      providers: [
        { provide: LoadingController, useValue: loadingCtrl },
        { provide: NavController, useValue: navCtrl },
        { provide: ToastController, useValue: toastCtrl },
        { provide: DataService, useValue: dataService },
        { provide: StorageService, useValue: storageService },
      ]
    });
  
    fixture = TestBed.createComponent(SyncPage);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });
  

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
 
});
