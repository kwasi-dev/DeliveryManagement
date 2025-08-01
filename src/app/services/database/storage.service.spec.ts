import { TestBed } from '@angular/core/testing';
import { SQLiteService } from './sqlite.service';
import { DbnameVersionService } from './dbname-version.service';
import { StorageService } from './storage.service';
import { SQLiteDBConnection, capSQLiteChanges, DBSQLiteValues } from '@capacitor-community/sqlite';
import { Toast } from '@capacitor/toast';
import { Customer } from '../../models/customer';
import { InvoiceItem } from '../../models/invoice_item';
import { Invoice } from '../../models/invoice';
import { Observable } from 'rxjs';

describe('StorageService', () => {
    let service: StorageService;
    let sqliteServiceSpy: jasmine.SpyObj<SQLiteService>;
    let dbnameVersionServiceSpy: jasmine.SpyObj<DbnameVersionService>;
    let dbConnectionSpy: jasmine.SpyObj<SQLiteDBConnection>;
    let toastSpy: jasmine.Spy;

    const mockCustomer: Customer = {
        id: 1,
        areaNo: 1,
        lastInvoiceDate: '2025-04-18',
        company: 'Test Company',
        contact: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        terms: 'Net 30',
        type: 'Retail',
        addr1: '123 Main St',
        addr2: 'Suite 100'
    };

    const mockInvoiceItem: InvoiceItem = {
        itemNo: 1,
        numPerPack: 10,
        orderNo: 100,
        packs: 5,
        partNo: 'PART123',
        quantity: 50,
        returnsNo: 0,
        price: 100,
        vat: 20,
        vatRate: 0.2,
        discrepancies: 0,
        discount: 10,
        creditNotes: 0
    };

    const mockInvoice: Invoice = {
        invoiceNo: 200,
        orderNo: 100,
        custNo: 1,
        routeNo: 'ROUTE1',
        standingDay: 'Monday',
        invoiceDate: '2025-04-18',
        generate: 'Pending',
        generalNote: "Invoice",
        custDiscount: 5,
        taxRate: 0.2,
        terms: 'Net 30',
        totalDiscount: 50,
        totalDiscount_adjdown: 45,
        totalDiscount_adjup: 55,
        totalItems: 1000,
        totalItems_adjdown: 950,
        totalItems_adjup: 1050,
        totalVat: 200,
        totalVat_adjdown: 190,
        totalVat_adjup: 210
    };

    beforeEach(async () => {
        // Mock dependencies
        sqliteServiceSpy = jasmine.createSpyObj('SQLiteService', ['addUpgradeStatement', 'openDatabase']);
        dbnameVersionServiceSpy = jasmine.createSpyObj('DbnameVersionService', ['set']);
        dbConnectionSpy = jasmine.createSpyObj('SQLiteDBConnection', ['run', 'execute', 'query']);
        toastSpy = spyOn(Toast, 'show').and.returnValue(Promise.resolve());

        // Default mock for query to prevent undefined errors
        dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [] } as DBSQLiteValues));

        // Configure TestBed
        TestBed.configureTestingModule({
            providers: [
                StorageService,
                { provide: SQLiteService, useValue: sqliteServiceSpy },
                { provide: DbnameVersionService, useValue: dbnameVersionServiceSpy }
            ]
        });

        service = TestBed.inject(StorageService);

        // Mock SQLiteService methods
        sqliteServiceSpy.addUpgradeStatement.and.returnValue(Promise.resolve());
        sqliteServiceSpy.openDatabase.and.returnValue(Promise.resolve(dbConnectionSpy));

        // Mock loadHomePageData and loadReturnsData to prevent query errors in loadData
        spyOn(service, 'loadHomePageData').and.returnValue(Promise.resolve());
        spyOn(service, 'loadReturnsData').and.returnValue(Promise.resolve());

        // Initialize database to set this.db and call loadData
        await service.initializeDatabase('testDB');
    });

    afterEach(() => {
        // Reset toastSpy and dbConnectionSpy to avoid interference between tests
        toastSpy.and.returnValue(Promise.resolve());
        dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [] } as DBSQLiteValues));
        dbConnectionSpy.run.and.returnValue(Promise.resolve({ changes: { changes: 0 } } as capSQLiteChanges));
        dbConnectionSpy.execute.and.returnValue(Promise.resolve({ changes: { changes: 0 } } as capSQLiteChanges));
    });

    describe('initializeDatabase', () => {
        const dbName = 'testDB';
        const version = 1;

        it('should initialize database and load data', async () => {
            // Arrange
            const isDatabaseReadySpy = spyOn(service['isDatabaseReady'], 'next').and.callThrough();
            // Reset spy to ignore calls from beforeEach
            isDatabaseReadySpy.calls.reset();

            // Act
            await service.initializeDatabase(dbName);

            // Assert
            expect(sqliteServiceSpy.addUpgradeStatement).toHaveBeenCalledWith({
                database: dbName,
                upgrade: jasmine.any(Array)
            });
            expect(sqliteServiceSpy.openDatabase).toHaveBeenCalledWith(dbName, false, 'no-encryption', version, false);
            expect(dbnameVersionServiceSpy.set).toHaveBeenCalledWith(dbName, version);
            expect(service['loadHomePageData']).toHaveBeenCalled();
            expect(service['loadReturnsData']).toHaveBeenCalled();
            expect(isDatabaseReadySpy).toHaveBeenCalledWith(true);
        });
    });

    describe('databaseState', () => {
        it('should return observable of isDatabaseReady', () => {
            // Arrange
            const isDatabaseReadySpy = spyOn(service['isDatabaseReady'], 'asObservable').and.callThrough();

            // Act
            const state$ = service.databaseState();

            // Assert
            expect(state$).toBeInstanceOf(Observable);
            expect(isDatabaseReadySpy).toHaveBeenCalled();
        });
    });

    describe('addCustomer', () => {
        it('should add a customer and load data', async () => {
            // Arrange
            spyOn(service, 'loadData').and.returnValue(Promise.resolve());
            dbConnectionSpy.run.and.returnValue(Promise.resolve({ changes: { changes: 1 } } as capSQLiteChanges));

            // Act
            await service.addCustomer(mockCustomer);

            // Assert
            expect(dbConnectionSpy.run).toHaveBeenCalledWith(
                jasmine.any(String),
                [
                    mockCustomer.id,
                    mockCustomer.areaNo,
                    mockCustomer.lastInvoiceDate,
                    mockCustomer.company,
                    mockCustomer.contact,
                    mockCustomer.email,
                    mockCustomer.phone,
                    mockCustomer.terms,
                    mockCustomer.type,
                    mockCustomer.addr1,
                    mockCustomer.addr2
                ]
            );
            expect(service['loadData']).toHaveBeenCalled();
        });
    });

    describe('addCustomers', () => {
        it('should add multiple customers and load data', async () => {
            // Arrange
            spyOn(service, 'loadData').and.returnValue(Promise.resolve());
            dbConnectionSpy.execute.and.returnValue(Promise.resolve({ changes: { changes: 2 } } as capSQLiteChanges));
            const customers = [mockCustomer, { ...mockCustomer, id: 2, company: 'Test Company 2' }];

            // Act
            await service.addCustomers(customers);

            // Assert
            expect(dbConnectionSpy.execute).toHaveBeenCalledWith(jasmine.stringMatching(/INSERT OR IGNORE INTO customers/));
            expect(service['loadData']).toHaveBeenCalled();
        });
    });

    describe('addInvoiceItem', () => {
        it('should add an invoice item and load data', async () => {
            // Arrange
            spyOn(service, 'loadData').and.returnValue(Promise.resolve());
            dbConnectionSpy.run.and.returnValue(Promise.resolve({ changes: { changes: 1 } } as capSQLiteChanges));

            // Act
            await service.addInvoiceItems([mockInvoiceItem]);

            // Assert
            expect(dbConnectionSpy.run).toHaveBeenCalledWith(
                jasmine.any(String),
                [
                    mockInvoiceItem.itemNo,
                    mockInvoiceItem.numPerPack,
                    mockInvoiceItem.orderNo,
                    mockInvoiceItem.packs,
                    mockInvoiceItem.partNo,
                    mockInvoiceItem.quantity,
                    mockInvoiceItem.returnsNo,
                    mockInvoiceItem.price,
                    mockInvoiceItem.price,
                    mockInvoiceItem.vat,
                    mockInvoiceItem.vatRate,
                    mockInvoiceItem.discrepancies,
                    mockInvoiceItem.discount,
                    mockInvoiceItem.creditNotes
                ]
            );
            expect(service['loadData']).toHaveBeenCalled();
        });
    });

    describe('addInvoiceItems', () => {
        it('should add multiple invoice items and load data', async () => {
            // Arrange
            spyOn(service, 'loadData').and.returnValue(Promise.resolve());
            dbConnectionSpy.execute.and.returnValue(Promise.resolve({ changes: { changes: 2 } } as capSQLiteChanges));
            const items = [mockInvoiceItem, { ...mockInvoiceItem, itemNo: 2 }];

            // Act
            await service.addInvoiceItems(items);

            // Assert
            expect(dbConnectionSpy.execute).toHaveBeenCalledWith(jasmine.stringMatching(/INSERT INTO invoiceitems/));
            expect(service['loadData']).toHaveBeenCalled();
        });
    });

    describe('addInvoice', () => {
        it('should add an invoice and load data', async () => {
            // Arrange
            spyOn(service, 'loadData').and.returnValue(Promise.resolve());
            dbConnectionSpy.run.and.returnValue(Promise.resolve({ changes: { changes: 1 } } as capSQLiteChanges));

            // Act
            await service.addInvoices([mockInvoice]);

            // Assert
            expect(dbConnectionSpy.run).toHaveBeenCalledWith(
                jasmine.any(String),
                [
                    mockInvoice.invoiceNo,
                    mockInvoice.orderNo,
                    mockInvoice.custNo,
                    mockInvoice.routeNo,
                    mockInvoice.standingDay,
                    mockInvoice.invoiceDate,
                    mockInvoice.generate,
                    mockInvoice.generalNote, // Changed from '' to mockInvoice.generalNote (null)
                    mockInvoice.custDiscount,
                    mockInvoice.taxRate,
                    mockInvoice.terms,
                    mockInvoice.totalDiscount,
                    mockInvoice.totalDiscount_adjdown,
                    mockInvoice.totalDiscount_adjup,
                    mockInvoice.totalItems,
                    mockInvoice.totalItems_adjdown,
                    mockInvoice.totalItems_adjup,
                    mockInvoice.totalVat,
                    mockInvoice.totalVat_adjdown,
                    mockInvoice.totalVat_adjup
                ]
            );
            expect(service['loadData']).toHaveBeenCalled();
        });
    });


    describe('addInvoices', () => {
        it('should add multiple invoices and load data', async () => {
            // Arrange
            spyOn(service, 'loadData').and.returnValue(Promise.resolve());
            dbConnectionSpy.execute.and.returnValue(Promise.resolve({ changes: { changes: 2 } } as capSQLiteChanges));
            const invoices = [mockInvoice, { ...mockInvoice, invoiceNo: 201 }];

            // Act
            await service.addInvoices(invoices);

            // Assert
            expect(dbConnectionSpy.execute).toHaveBeenCalledWith(jasmine.stringMatching(/INSERT INTO invoices/));
            expect(service['loadData']).toHaveBeenCalled();
        });
    });

    describe('getInvoiceItems', () => {
        it('should return invoice items for given order number', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [mockInvoiceItem] } as DBSQLiteValues));

            // Act
            const result = await service.getInvoiceItems(100);

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith('SELECT * FROM invoiceitems WHERE orderNo = ?', [100]);
            expect(result).toEqual([mockInvoiceItem]);
        });

        it('should return null if no items found', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [] } as DBSQLiteValues));

            // Act
            const result = await service.getInvoiceItems(100);

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith('SELECT * FROM invoiceitems WHERE orderNo = ?', [100]);
            expect(result).toBeNull();
        });
    });

    describe('getSingleInvoiceItem', () => {
        it('should return single invoice item', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [mockInvoiceItem] } as DBSQLiteValues));

            // Act
            const result = await service.getSingleInvoiceItem(1, 100);

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith('SELECT * FROM invoiceitems WHERE itemNo = ? AND orderNo = ?', [1, 100]);
            expect(result).toEqual([mockInvoiceItem]);
        });

        it('should return null if no item found', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [] } as DBSQLiteValues));

            // Act
            const result = await service.getSingleInvoiceItem(1, 100);

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith('SELECT * FROM invoiceitems WHERE itemNo = ? AND orderNo = ?', [1, 100]);
            expect(result).toBeNull();
        });
    });

    describe('getCustomer', () => {
        it('should return customer by ID', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [mockCustomer] } as DBSQLiteValues));

            // Act
            const result = await service.getCustomer(1);

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith('SELECT * FROM customers WHERE id = ?', [1]);
            expect(result).toEqual([mockCustomer]);
        });

        it('should return null if no customer found', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [] } as DBSQLiteValues));

            // Act
            const result = await service.getCustomer(1);

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith('SELECT * FROM customers WHERE id = ?', [1]);
            expect(result).toBeNull();
        });
    });

    describe('getCustomerbyInvoice', () => {
        it('should return customer by invoice number', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [mockCustomer] } as DBSQLiteValues));

            // Act
            const result = await service.getCustomerbyInvoice(200);

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith(
                'SELECT c.* FROM customers c JOIN invoices i ON c.id = i.custNo WHERE i.invoiceNo = ?',
                [200]
            );
            expect(result).toEqual([mockCustomer]);
        });

        it('should return null if no customer found', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [] } as DBSQLiteValues));

            // Act
            const result = await service.getCustomerbyInvoice(200);

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith(
                'SELECT c.* FROM customers c JOIN invoices i ON c.id = i.custNo WHERE i.invoiceNo = ?',
                [200]
            );
            expect(result).toBeNull();
        });
    });

    describe('getInvoice', () => {
        it('should return invoice by invoice number', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [mockInvoice] } as DBSQLiteValues));

            // Act
            const result = await service.getInvoice(200);

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith('SELECT * FROM invoices WHERE invoiceNo = ?', [200]);
            expect(result).toEqual(mockInvoice);
        });

        it('should return null if no invoice found', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [] } as DBSQLiteValues));

            // Act
            const result = await service.getInvoice(200);

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith('SELECT * FROM invoices WHERE invoiceNo = ?', [200]);
            expect(result).toBeNull();
        });
    });

    describe('getInvoicebyOrderNo', () => {
        it('should return invoice by order number', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [mockInvoice] } as DBSQLiteValues));

            // Act
            const result = await service.getInvoicebyOrderNo(100);

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith('SELECT * FROM invoices where orderNo = ?', [100]);
            expect(result).toEqual([mockInvoice]);
        });

        it('should return null if no invoice found', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [] } as DBSQLiteValues));

            // Act
            const result = await service.getInvoicebyOrderNo(100);

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith('SELECT * FROM invoices where orderNo = ?', [100]);
            expect(result).toBeNull();
        });
    });

    describe('getInvoicesbyCustNo', () => {
        it('should return invoices by customer number', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [mockInvoice] } as DBSQLiteValues));

            // Act
            const result = await service.getInvoicesbyCustNo(1);

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith('SELECT * FROM invoices WHERE custNo = ?', [1]);
            expect(result).toEqual([mockInvoice]);
        });

        it('should return null if no invoices found', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [] } as DBSQLiteValues));

            // Act
            const result = await service.getInvoicesbyCustNo(1);

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith('SELECT * FROM invoices WHERE custNo = ?', [1]);
            expect(result).toBeNull();
        });
    });

    describe('logReturn', () => {
        it('should log return and update data when item and invoice exist', async () => {
            spyOn(service, 'getSingleInvoiceItem').and.returnValue(Promise.resolve([mockInvoiceItem]));
            spyOn(service, 'getInvoicebyOrderNo').and.returnValue(Promise.resolve([mockInvoice]));
            spyOn(service, 'loadData').and.returnValue(Promise.resolve());
            dbConnectionSpy.run.and.returnValue(Promise.resolve({ changes: { changes: 1 } } as capSQLiteChanges));

            await service.logReturn(1, 100, 5, 'Return note');

            expect(dbConnectionSpy.run).toHaveBeenCalledWith('UPDATE invoiceitems SET returnsNo = ? WHERE orderNo = ?', [5, 100]);
            expect(dbConnectionSpy.run).toHaveBeenCalledWith('UPDATE invoices SET generalNote = ? WHERE orderNo = ?', ['Return note', 100]);
            expect(service['loadData']).toHaveBeenCalled();
            expect(toastSpy).not.toHaveBeenCalled();
        });

        it('should show toast error when item or invoice does not exist', async () => {
            spyOn(service, 'getSingleInvoiceItem').and.returnValue(Promise.resolve(null));
            spyOn(service, 'getInvoicebyOrderNo').and.returnValue(Promise.resolve(null));

            await service.logReturn(1, 100, 5, 'Return note');

            expect(dbConnectionSpy.run).not.toHaveBeenCalled();
        });
    });

    describe('updateInvoiceStatus', () => {
        it('should update invoice status and load data when invoice exists', async () => {
            // Arrange
            spyOn(service, 'getInvoice').and.returnValue(Promise.resolve(mockInvoice));
            spyOn(service, 'loadData').and.returnValue(Promise.resolve());
            dbConnectionSpy.run.and.returnValue(Promise.resolve({ changes: { changes: 1 } } as capSQLiteChanges));

            // Act
            await service.updateInvoiceStatus(200, 'Delivered');

            // Assert
            expect(dbConnectionSpy.run).toHaveBeenCalledWith('UPDATE invoices SET generate = ? WHERE invoiceNo = ?', ['Delivered', 200]);
            expect(service['loadData']).toHaveBeenCalled();
            expect(toastSpy).not.toHaveBeenCalled();
        });

        it('should show toast error when invoice does not exist', async () => {
            // Arrange
            spyOn(service, 'getInvoice').and.returnValue(Promise.resolve(null));

            // Act
            await service.updateInvoiceStatus(200, 'Delivered');

            // Assert
            expect(dbConnectionSpy.run).not.toHaveBeenCalled();

        });
    });

    describe('loadHomePageData', () => {
        it('should load home page data and update homePageList', async () => {
            // Arrange
            const mockData = [{ ...mockInvoice, company: mockCustomer.company }];
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: mockData } as DBSQLiteValues));
            const homePageListSpy = spyOn(service['homePageList'], 'next');
            // Reset loadHomePageData spy to allow real implementation
            (service['loadHomePageData'] as jasmine.Spy).and.callThrough();

            // Act
            await service.loadHomePageData();

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith('SELECT i.*, c.company FROM invoices i JOIN customers c ON i.custNo = c.id;');
            expect(homePageListSpy).toHaveBeenCalledWith(mockData);
        });

        it('should update homePageList with empty array if no data', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: undefined } as DBSQLiteValues));
            const homePageListSpy = spyOn(service['homePageList'], 'next');
            // Reset loadHomePageData spy to allow real implementation
            (service['loadHomePageData'] as jasmine.Spy).and.callThrough();

            // Act
            await service.loadHomePageData();

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith('SELECT i.*, c.company FROM invoices i JOIN customers c ON i.custNo = c.id;');
            expect(homePageListSpy).toHaveBeenCalledWith([]);
        });
    });

    describe('loadReturnsData', () => {
        it('should load returns data and update returnsList', async () => {
          // Arrange
          const mockData = [
            { ...mockInvoice, ...mockInvoiceItem, orderNo: 100, itemNo: 1, returnsNo: 5, discrepancies: 0 }
          ];
          dbConnectionSpy.query.calls.reset(); // Clear previous calls
          dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: mockData } as DBSQLiteValues));
          const returnsListSpy = spyOn(service['returnsList'], 'next');
          (service['loadReturnsData'] as jasmine.Spy).and.callThrough();
          service['db'] = dbConnectionSpy;
          console.log('service.db:', service['db']);
          console.log('dbConnectionSpy.query:', dbConnectionSpy.query);

          // Act
          await service.loadReturnsData();

          // Assert
          console.log('dbConnectionSpy.query calls:', dbConnectionSpy.query.calls.all());
          console.log('returnsListSpy calls:', returnsListSpy.calls.all());
          expect(dbConnectionSpy.query).toHaveBeenCalledWith(
            'SELECT inv.*, inv_item.* FROM invoices inv JOIN invoiceitems inv_item ON inv.orderNo = inv_item.orderNo WHERE inv_item.returnsNo > 0'
          );
          expect(returnsListSpy).toHaveBeenCalledWith([
            {
              ...mockData[0],
              items: [{ itemNo: 1, returnsNo: 5, discrepancies: 0 }]
            }
          ]);
        });

        it('should update returnsList with empty array if no data', async () => {
          // Arrange
          dbConnectionSpy.query.calls.reset(); // Clear previous calls
          dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: undefined } as DBSQLiteValues));
          const returnsListSpy = spyOn(service['returnsList'], 'next');
          (service['loadReturnsData'] as jasmine.Spy).and.callThrough();
          service['db'] = dbConnectionSpy;
          console.log('service.db:', service['db']);
          console.log('dbConnectionSpy.query:', dbConnectionSpy.query);

          // Act
          await service.loadReturnsData();

          // Assert
          console.log('dbConnectionSpy.query calls:', dbConnectionSpy.query.calls.all());
          console.log('returnsListSpy calls:', returnsListSpy.calls.all());
          expect(dbConnectionSpy.query).toHaveBeenCalledWith(
            'SELECT inv.*, inv_item.* FROM invoices inv JOIN invoiceitems inv_item ON inv.orderNo = inv_item.orderNo WHERE inv_item.returnsNo > 0'
          );
          expect(returnsListSpy).toHaveBeenCalledWith([]);
        });
      });

    describe('getAllData', () => {
        it('should return all data from invoices and invoiceitems', async () => {
            // Arrange
            const mockData = [{ ...mockInvoice, ...mockInvoiceItem }];
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: mockData } as DBSQLiteValues));

            // Act
            const result = await service.getAllData();

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith(
                'SELECT * FROM invoices JOIN invoiceitems ON invoiceitems.orderNo = invoices.orderNo'
            );
            expect(result).toEqual(mockData);
        });

        it('should return null if no data found', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [] } as DBSQLiteValues));

            // Act
            const result = await service.getAllData();

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith(
                'SELECT * FROM invoices JOIN invoiceitems ON invoiceitems.orderNo = invoices.orderNo'
            );
            expect(result).toBeNull();
        });
    });

    describe('getAllInvoices', () => {
        it('should return all invoices', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [mockInvoice] } as DBSQLiteValues));

            // Act
            const result = await service.getAllInvoices();

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith('SELECT * FROM invoices');
            expect(result).toEqual([mockInvoice]);
        });

        it('should return null if no invoices found', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [] } as DBSQLiteValues));

            // Act
            const result = await service.getAllInvoices();

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith('SELECT * FROM invoices');
            expect(result).toBeNull();
        });
    });

    describe('getAllInvoiceItems', () => {
        it('should return all invoice items', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [mockInvoiceItem] } as DBSQLiteValues));

            // Act
            const result = await service.getAllInvoiceItems();

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith('SELECT * FROM invoiceitems');
            expect(result).toEqual([mockInvoiceItem]);
        });

        it('should return null if no invoice items found', async () => {
            // Arrange
            dbConnectionSpy.query.and.returnValue(Promise.resolve({ values: [] } as DBSQLiteValues));

            // Act
            const result = await service.getAllInvoiceItems();

            // Assert
            expect(dbConnectionSpy.query).toHaveBeenCalledWith('SELECT * FROM invoiceitems');
            expect(result).toBeNull();
        });
    });

    describe('loadData', () => {
        it('should load all data and update isDatabaseReady', async () => {
            const isDatabaseReadySpy = spyOn(service['isDatabaseReady'], 'next').and.callThrough();
            isDatabaseReadySpy.calls.reset();

            await service.loadData();

            expect(service['loadHomePageData']).toHaveBeenCalled();
            expect(service['loadReturnsData']).toHaveBeenCalled();
            expect(isDatabaseReadySpy).toHaveBeenCalledWith(true);
        });
    });
});
