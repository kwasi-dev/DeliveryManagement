import { TestBed } from '@angular/core/testing';
import { InitializeAppService } from './initialize.app.service';
import { SQLiteService } from './sqlite.service';
import { StorageService } from './storage.service';
import { DataService } from './data.service';
import { Toast } from '@capacitor/toast';

describe('InitializeAppService', () => {
  let service: InitializeAppService;
  let sqliteServiceSpy: jasmine.SpyObj<SQLiteService>;
  let storageServiceSpy: jasmine.SpyObj<StorageService>;
  let toastSpy: jasmine.SpyObj<typeof Toast>;

  beforeEach(() => {
    // Create spies for dependencies
    sqliteServiceSpy = jasmine.createSpyObj('SQLiteService', [
      'initializePlugin',
      'initWebStore',
      'saveToStore'
    ]);
    // Define platform as a writable property
    Object.defineProperty(sqliteServiceSpy, 'platform', {
      value: 'android',
      writable: true
    });
    storageServiceSpy = jasmine.createSpyObj('StorageService', ['initializeDatabase']);
    toastSpy = jasmine.createSpyObj('Toast', ['show']);

    // Mock successful resolutions
    sqliteServiceSpy.initializePlugin.and.returnValue(Promise.resolve(true));
    sqliteServiceSpy.initWebStore.and.returnValue(Promise.resolve());
    sqliteServiceSpy.saveToStore.and.returnValue(Promise.resolve());
    storageServiceSpy.initializeDatabase.and.returnValue(Promise.resolve());

    // Configure TestBed
    TestBed.configureTestingModule({
      providers: [
        InitializeAppService,
        { provide: SQLiteService, useValue: sqliteServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: DataService, useValue: {} } // Empty mock for DataService
      ]
    });

    // Inject service
    service = TestBed.inject(InitializeAppService);

    // Mock Toast.show globally
    spyOn(Toast, 'show').and.callFake(toastSpy.show);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize app successfully for non-web platform', async () => {
    sqliteServiceSpy.platform = 'android';
    service.isAppInit = false;

    await service.initializeApp();

    expect(sqliteServiceSpy.initializePlugin).toHaveBeenCalled();
    expect(sqliteServiceSpy.initWebStore).not.toHaveBeenCalled();
    expect(storageServiceSpy.initializeDatabase).toHaveBeenCalledWith('deliveryManagementDB_Test1');
    expect(sqliteServiceSpy.saveToStore).not.toHaveBeenCalled();
    expect(toastSpy.show).not.toHaveBeenCalled();
    expect(service.isAppInit).toBeTrue();
    expect(service.platform).toBe('android');
  });

  it('should initialize app successfully for web platform', async () => {
    storageServiceSpy.initializeDatabase.and.returnValue(Promise.resolve());
    sqliteServiceSpy.platform = 'web';
    service.isAppInit = false;
    console.log('sqliteServiceSpy:', sqliteServiceSpy);
    console.log('service.sqliteService:', service['sqliteService']);
    console.log('sqliteServiceSpy.platform before:', sqliteServiceSpy.platform);

    await service.initializeApp();

    console.log('sqliteServiceSpy.platform after:', sqliteServiceSpy.platform);
    console.log('storageServiceSpy.initializeDatabase calls:', storageServiceSpy.initializeDatabase.calls.all());
    expect(sqliteServiceSpy.initializePlugin).toHaveBeenCalled();
    expect(sqliteServiceSpy.initWebStore).toHaveBeenCalled();
    expect(storageServiceSpy.initializeDatabase).toHaveBeenCalledWith('deliveryManagementDB_Test1');
    expect(sqliteServiceSpy.saveToStore).toHaveBeenCalledWith('deliveryManagementDB_Test1');
    expect(toastSpy.show).not.toHaveBeenCalled();
    expect(service.isAppInit).toBeTrue();
    expect(service.platform).toBe('web');
  });

  it('should handle error during initialization and show toast', async () => {
    const errorMessage = 'Database initialization failed';
    storageServiceSpy.initializeDatabase.and.returnValue(Promise.reject(new Error(errorMessage)));
    service.isAppInit = false;
    toastSpy.show.and.returnValue(Promise.resolve());
    sqliteServiceSpy.platform = 'android';

    await service.initializeApp();

    expect(sqliteServiceSpy.initializePlugin).toHaveBeenCalled();
    expect(storageServiceSpy.initializeDatabase).toHaveBeenCalledWith('deliveryManagementDB_Test1');
    expect(service.isAppInit).toBeFalse();
  });
});