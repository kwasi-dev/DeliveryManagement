import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DataService } from './data.service';
import { StorageService } from './storage.service';
import { Customer } from '../../models/customer';
import { InvoiceItem } from '../../models/invoice_item';
import { Invoice } from '../../models/invoice';

// Define the NyxPrinter plugin interface
interface NyxPrinterPlugin {
  isReady(): Promise<{ connected: boolean }>;
  printText(options: { text: string }): Promise<void>;
}

describe('DataService', () => {
  let service: DataService;
  let storageServiceSpy: jasmine.SpyObj<StorageService>;
  let httpTestingController: HttpTestingController;
  let nyxPrinterSpy: jasmine.SpyObj<NyxPrinterPlugin>;

  const mockCustomerRecord = {
    attributes: {
      custno: 1,
      areano: 1,
      lastinvoicedate: '2023-01-01',
      company: 'Test Company',
      contact: 'John Doe',
      emailaddress: 'john@example.com',
      phone: '1234567890',
      terms: 'Net 30',
      type: 'Retail',
      addr1: '123 Main St',
      addr2: 'Suite 100'
    }
  };

  const mockInvoiceItemRecord = {
    attributes: {
      itemno: 1,
      num_per_pack: 10,
      orderno: 1,
      packs: 5,
      partno: 'P001',
      qty: 50,
      returnsno: 0,
      storedprice: 100,
      vatamount: 10,
      vatrate: 0.1,
      discrepencies: 0,
      discount: 5,
      creditnotes: 0
    }
  };

  const mockInvoiceRecord = {
    attributes: {
      invoiceno: 1,
      orderno: 1,
      custno: 1,
      routeno: 'R001',
      standing_day: 'Monday',
      invoicedate: '2023-01-01',
      generate: 'true',
      generalnote: 'Note',
      custdiscount: 10,
      taxrate: 0.1,
      terms: 'Net 30',
      totaldiscount: 15,
      totaldiscount_adjdown: 12,
      totaldiscount_adjup: 18,
      totalitems: 50,
      totalitems_adjdown: 45,
      totalitems_adjup: 55,
      totalvat: 10,
      totalvat_adjdown: 8,
      totalvat_adjup: 12
    }
  };

  const mockResponse = {
    customer_details: [mockCustomerRecord, mockInvoiceItemRecord],
    invoice_master: [mockInvoiceRecord]
  };

  beforeEach(() => {
    storageServiceSpy = jasmine.createSpyObj('StorageService', [
      'addCustomers',
      'addInvoices',
      'addInvoiceItems'
    ]);
    storageServiceSpy.addCustomers.and.returnValue(Promise.resolve());
    storageServiceSpy.addInvoices.and.returnValue(Promise.resolve());
    storageServiceSpy.addInvoiceItems.and.returnValue(Promise.resolve());

    nyxPrinterSpy = jasmine.createSpyObj<NyxPrinterPlugin>('NyxPrinter', ['isReady', 'printText']);
    nyxPrinterSpy.isReady.and.returnValue(Promise.resolve({ connected: true }));
    nyxPrinterSpy.printText.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DataService,
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: 'PrinterService', useValue: nyxPrinterSpy }
      ]
    });

    service = TestBed.inject(DataService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify(); // Ensure no outstanding HTTP requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch data and process response correctly', fakeAsync(() => {
    const date = '2023-01-01';
    const route = 'R001';

    service.fetchData(date, route);
    tick();
    const req = httpTestingController.expectOne(`http://3.208.13.82:2078/akiproorders/downloadinvoices/${date}/${route}`);
    req.flush(mockResponse);
    tick();

    expect(req.request.method).toBe('GET');
    expect(storageServiceSpy.addCustomers).toHaveBeenCalledWith(jasmine.arrayContaining([
      jasmine.objectContaining({ id: 1, company: 'Test Company' } as Partial<Customer>)
    ]));
    expect(storageServiceSpy.addInvoiceItems).toHaveBeenCalledWith(jasmine.arrayContaining([
      jasmine.objectContaining({ itemNo: 1, orderNo: 1 } as Partial<InvoiceItem>)
    ]));
    expect(storageServiceSpy.addInvoices).toHaveBeenCalledWith(jasmine.arrayContaining([
      jasmine.objectContaining({ invoiceNo: 1, custNo: 1 } as Partial<Invoice>)
    ]));
    expect(nyxPrinterSpy.isReady).not.toHaveBeenCalled();
    expect(nyxPrinterSpy.printText).not.toHaveBeenCalled();
  }));

  it('should handle HTTP error in fetchData', fakeAsync(() => {
    // Arrange
    const date = '2023-01-01';
    const route = 'R001';
    spyOn(console, 'log');

    // Act
    service.fetchData(date, route);
    const req = httpTestingController.expectOne(`http://3.208.13.82:2078/akiproorders/downloadinvoices/${date}/${route}`);
    req.flush('Error', { status: 500, statusText: 'Server Error' });
    tick();

    // Assert
    expect(console.log).toHaveBeenCalledWith('Ionic Error requesting: ', 'Http failure response for http://3.208.13.82:2078/akiproorders/downloadinvoices/2023-01-01/R001: 500 Server Error');
    expect(storageServiceSpy.addCustomers).not.toHaveBeenCalled();
    expect(storageServiceSpy.addInvoiceItems).not.toHaveBeenCalled();
    expect(storageServiceSpy.addInvoices).not.toHaveBeenCalled();
    expect(nyxPrinterSpy.isReady).not.toHaveBeenCalled();
  }));

  it('should handle empty response in fetchData', fakeAsync(() => {
    // Arrange
    const date = '2023-01-01';
    const route = 'R001';

    // Act
    service.fetchData(date, route);
    tick();
    const req = httpTestingController.expectOne(`http://3.208.13.82:2078/akiproorders/downloadinvoices/${date}/${route}`);
    req.flush({ customer_details: [], invoice_master: [] });
    tick();

    // Assert
    expect(storageServiceSpy.addCustomers).toHaveBeenCalledWith([]);
    expect(storageServiceSpy.addInvoiceItems).toHaveBeenCalledWith([]);
    expect(storageServiceSpy.addInvoices).toHaveBeenCalledWith([]);
    
  }));

  it('should generate receipt with correct format', () => {
    // Arrange
    service['invoiceList'] = [
      { invoiceNo: 1, custNo: 1, orderNo: 1, routeNo: 'R001', standingDay: '', invoiceDate: '', generate: 'true', generalNote: '', custDiscount: 0, taxRate: 0, terms: '', totalDiscount: 0, totalDiscount_adjdown: 0, totalDiscount_adjup: 0, totalItems: 0, totalItems_adjdown: 0, totalItems_adjup: 0, totalVat: 0, totalVat_adjdown: 0, totalVat_adjup: 0 },
      { invoiceNo: 2, custNo: 2, orderNo: 2, routeNo: 'R002', standingDay: '', invoiceDate: '', generate: 'true', generalNote: '', custDiscount: 0, taxRate: 0, terms: '', totalDiscount: 0, totalDiscount_adjdown: 0, totalDiscount_adjup: 0, totalItems: 0, totalItems_adjdown: 0, totalItems_adjup: 0, totalVat: 0, totalVat_adjdown: 0, totalVat_adjup: 0 }
    ];
    const route = 'R001';
    const date = '2023-01-01';

    // Act
    const receipt = service.generateReceipt(route, date);

    // Assert
    expect(receipt).toContain(
      `Confirmation of Download`
    );
  });

  it('should check record type correctly', () => {
    // Arrange
    const customerRecord = { attributes: { company: 'Test Company' } };
    const invoiceItemRecord = { attributes: { itemno: 1 } };

    // Act & Assert
    expect(service['checkRecord'](customerRecord)).toBe('customer');
    expect(service['checkRecord'](invoiceItemRecord)).toBe('invoiceItem');
  });

  it('should push customer correctly', () => {
    // Arrange
    service['customerList'] = [];

    // Act
    service['pushCustomer'](mockCustomerRecord);

    // Assert
    expect(service['customerList']).toEqual([
      jasmine.objectContaining({
        id: 1,
        company: 'Test Company',
        contact: 'John Doe',
        email: 'john@example.com'
      } as Partial<Customer>)
    ]);
  });

  it('should push invoice item correctly', () => {
    // Arrange
    service['invoiceItemList'] = [];

    // Act
    service['pushInvoiceItem'](mockInvoiceItemRecord);

    // Assert
    expect(service['invoiceItemList']).toEqual([
      jasmine.objectContaining({
        itemNo: 1,
        orderNo: 1,
        quantity: 50,
        price: 100
      } as Partial<InvoiceItem>)
    ]);
  });

  it('should push invoice correctly', () => {
    // Arrange
    service['invoiceList'] = [];

    // Act
    service['pushInvoice'](mockInvoiceRecord);

    // Assert
    expect(service['invoiceList']).toEqual([
      jasmine.objectContaining({
        invoiceNo: 1,
        custNo: 1,
        orderNo: 1,
        routeNo: 'R001'
      } as Partial<Invoice>)
    ]);
  });

  it('should map customer IDs correctly', () => {
    // Arrange
    service['invoiceList'] = [
      { invoiceNo: 1, custNo: 1, orderNo: 1, routeNo: 'R001', standingDay: '', invoiceDate: '', generate: 'true', generalNote: '', custDiscount: 0, taxRate: 0, terms: '', totalDiscount: 0, totalDiscount_adjdown: 0, totalDiscount_adjup: 0, totalItems: 0, totalItems_adjdown: 0, totalItems_adjup: 0, totalVat: 0, totalVat_adjdown: 0, totalVat_adjup: 0 },
      { invoiceNo: 2, custNo: 2, orderNo: 2, routeNo: 'R002', standingDay: '', invoiceDate: '', generate: 'true', generalNote: '', custDiscount: 0, taxRate: 0, terms: '', totalDiscount: 0, totalDiscount_adjdown: 0, totalDiscount_adjup: 0, totalItems: 0, totalItems_adjdown: 0, totalItems_adjup: 0, totalVat: 0, totalVat_adjdown: 0, totalVat_adjup: 0 }
    ];
    service['customerList'] = [
      { id: 999, company: 'Company1', areaNo: 1, lastInvoiceDate: '', contact: '', email: '', phone: '', terms: '', type: '', addr1: '', addr2: '' },
      { id: 999, company: 'Company2', areaNo: 1, lastInvoiceDate: '', contact: '', email: '', phone: '', terms: '', type: '', addr1: '', addr2: '' }
    ];

    // Act
    service['mapCust']();

    // Assert
    expect(service['customerList'][0].id).toBe(1);
    expect(service['customerList'][1].id).toBe(2);
  });

  it('should store data correctly', fakeAsync(() => {
    // Arrange
    const customers: Customer[] = [{ id: 1, company: 'Test', areaNo: 1, lastInvoiceDate: '', contact: '', email: '', phone: '', terms: '', type: '', addr1: '', addr2: '' }];
    const invoiceItems: InvoiceItem[] = [{ itemNo: 1, numPerPack: 10, orderNo: 1, packs: 5, partNo: 'P001', quantity: 50, returnsNo: 0, price: 100, vat: 10, vatRate: 0.1, discrepancies: 0, discount: 5, creditNotes: 0 }];
    const invoices: Invoice[] = [{ invoiceNo: 1, custNo: 1, orderNo: 1, routeNo: 'R001', standingDay: '', invoiceDate: '', generate: 'true', generalNote: '', custDiscount: 0, taxRate: 0, terms: '', totalDiscount: 0, totalDiscount_adjdown: 0, totalDiscount_adjup: 0, totalItems: 0, totalItems_adjdown: 0, totalItems_adjup: 0, totalVat: 0, totalVat_adjdown: 0, totalVat_adjup: 0 }];
    service['customerList'] = customers;
    service['invoiceItemList'] = invoiceItems;
    service['invoiceList'] = invoices;

    // Act
    service['store']();
    tick();

    // Assert
    expect(storageServiceSpy.addCustomers).toHaveBeenCalledWith(customers);
    expect(storageServiceSpy.addInvoiceItems).toHaveBeenCalledWith(invoiceItems);
    expect(storageServiceSpy.addInvoices).toHaveBeenCalledWith(invoices);
  }));
});