import { TestBed } from '@angular/core/testing';
import { HomePage } from './home.page';  // Import HomePage component
import { StorageService } from '../../services/database/storage.service';
import { SQLiteService } from '../../services/database/sqlite.service';
import { DbnameVersionService } from '../../services/database/dbname-version.service';
import { ModalController, PopoverController, AngularDelegate } from '@ionic/angular';  // For modal/popover controller mocks
import { HttpClientTestingModule } from '@angular/common/http/testing';  // For HTTP client testing
import { BehaviorSubject } from 'rxjs';

describe('HomePage', () => {
  let component: HomePage;
  let fixture;
  let storageServiceMock: jasmine.SpyObj<StorageService>;
  let sqliteServiceMock: jasmine.SpyObj<SQLiteService>;
  let dbVerServiceMock: jasmine.SpyObj<DbnameVersionService>;

  beforeEach(() => {
    // Mock StorageService methods
    storageServiceMock = jasmine.createSpyObj('StorageService', [
      'homePageList',
      'returnsList',
      'getInvoiceItems',
      'getSingleInvoiceItem',
      'getInvoicebyOrderNo'
    ]);

    // Mock SQLiteService methods
    sqliteServiceMock = jasmine.createSpyObj('SQLiteService', [
      'initializePlugin',
      'platform',
      'initWebStore',
      'saveToStore',
      'openDatabase',
      'addUpgradeStatement'
    ]);

    // Mock DbnameVersionService methods
    dbVerServiceMock = jasmine.createSpyObj('DbnameVersionService', ['set']);

    // Set up mock return values for BehaviorSubjects
    storageServiceMock.homePageList = new BehaviorSubject<any[]>([]);  // Correct type here
    storageServiceMock.returnsList = new BehaviorSubject<any[]>([]);   // Correct type here

    // Mocking AngularDelegate for ModalController and PopoverController
    const angularDelegateMock = jasmine.createSpyObj('AngularDelegate', ['loadView', 'create']);
    
    // Configure TestBed with necessary imports and providers
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],  // Import HTTP client testing module if HttpClient is used
      providers: [
        HomePage,
        { provide: StorageService, useValue: storageServiceMock },
        { provide: SQLiteService, useValue: sqliteServiceMock },
        { provide: DbnameVersionService, useValue: dbVerServiceMock },
        { provide: ModalController, useValue: jasmine.createSpyObj('ModalController', ['create', 'dismiss']) },
        { provide: PopoverController, useValue: jasmine.createSpyObj('PopoverController', ['create']) },
        { provide: AngularDelegate, useValue: angularDelegateMock }  // Mocking AngularDelegate here
      ]
    });

    // Create the component with TestBed
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();  // Ensure HomePage component is created
  });

  // Add other tests for HomePage component here...
});
