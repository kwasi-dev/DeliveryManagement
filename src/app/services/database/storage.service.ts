import { DBSQLiteValues, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Injectable } from '@angular/core';
import { SQLiteService } from './sqlite.service';
import { DbnameVersionService } from './dbname-version.service';
import { UserUpgradeStatements } from '../../upgrades/user.upgrade.statements';
import { Customer } from '../../models/customer';
import { InvoiceItem } from '../../models/invoice_item';
import { Invoice } from '../../models/invoice';
import { BehaviorSubject, Observable } from 'rxjs';
import { Toast } from '@capacitor/toast';
import {Product} from "../../models/product";
import {InvoiceReturn} from "../../models/invoice_return";

@Injectable()
export class StorageService {
    public homePageList: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
    public returnsList: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

    private databaseName: string = "";
    private uUpdStmts: UserUpgradeStatements = new UserUpgradeStatements();
    private versionUpgrades;
    private loadToVersion;
    private db!: SQLiteDBConnection;
    private isDatabaseReady: BehaviorSubject<boolean> = new BehaviorSubject(false);

    constructor(private sqliteService: SQLiteService, private dbVerService: DbnameVersionService) {
        this.versionUpgrades = this.uUpdStmts.userUpgrades;
        this.loadToVersion = this.versionUpgrades[this.versionUpgrades.length - 1].toVersion;
    }

    async initializeDatabase(dbName: string) {
        this.databaseName = dbName;
        await this.sqliteService.addUpgradeStatement({ database: this.databaseName, upgrade: this.versionUpgrades });
        this.db = await this.sqliteService.openDatabase(this.databaseName, false, 'no-encryption', this.loadToVersion, false);
        this.dbVerService.set(this.databaseName, this.loadToVersion);
        await this.loadData();
    }

    databaseState() {
        return this.isDatabaseReady.asObservable();
    }

    // Adds a single customer
    async addCustomer(customer: Customer) {
        const sql = `INSERT INTO customers (id, areaNo, lastInvoiceDate, company, contact, email, phone, terms, type, addr1, addr2)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
        await this.db.run(sql, [
            customer.id,
            customer.areaNo ?? 0,
            customer.lastInvoiceDate,
            customer.company,
            customer.contact || null,
            customer.email || null,
            customer.phone,
            customer.terms,
            customer.type,
            customer.addr1,
            customer.addr2 || null
        ]);
        await this.loadData();
    }

    // Adds a list of customers
    async addCustomers(customers: Customer[]) {
      if (customers.length > 0){
        const sql = `INSERT OR IGNORE INTO customers (id, areaNo, lastInvoiceDate, company, contact, email, phone, terms, type, addr1, addr2)
        VALUES `;

        var values = customers.map(customer => `(${customer.id}, ${customer.areaNo}, '${customer.lastInvoiceDate.replace(/'/g, "''")}', '${customer.company.replace(/'/g, "''")}', '${customer.contact.replace(/'/g, "''")}', '${customer.email.replace(/'/g, "''")}', '${customer.phone.replace(/'/g, "''")}', '${customer.terms.replace(/'/g, "''")}', '${customer.type.replace(/'/g, "''")}', '${customer.addr1.replace(/'/g, "''")}', '${customer.addr2.replace(/'/g, "''")}')`).join(",\n");
        values += ';';
        await this.db.execute(sql + values);
        await this.loadData();
      } else {
        console.log(`Customers list empty, skipping save`);

      }

    }

    // Adds a list of invoice items
    async addInvoiceItems(items: InvoiceItem[]) {
      if (items.length > 0 ){
        const sql = `INSERT INTO invoiceitems (itemNo, numPerPack, orderNo, packs, partNo, quantity, returnsNo, price, vat, vatRate, discrepancies, discount, creditNotes)
        VALUES `;

        var values = items.map(item => `(${item.itemNo}, ${item.numPerPack}, ${item.orderNo}, ${item.packs}, '${item.partNo.replace(/'/g, "''")}', ${item.quantity}, ${item.returnsNo}, ${item.price}, ${item.vat}, ${item.vatRate}, ${item.discrepancies}, ${item.discount}, ${item.creditNotes})`).join(",\n");
        values += ';';
        await this.db.execute(sql + values);
        await this.loadData();
      }else {
        console.log(`InvoiceItems list empty, skipping save`);
      }

    }

    async addProductItems(products: Product[]){
      if (products.length > 0){
        const sql = `INSERT INTO products (description, partNo) VALUES `;

        var values = products.map(item => `( '${item.description.replace(/'/g, "''")}','${item.partNo.replace(/'/g, "''")}' )`).join(",\n");
        values += ';';

        await this.db.execute(sql + values);
        await this.loadData();
      }else {
        console.log(`Products list empty, skipping save`);
      }

    }

    // Adds a list of invoices
    async addInvoices(invoices: Invoice[]) {
      if (invoices.length > 0){
        const sql = `INSERT or IGNORE INTO invoices (invoiceNo, orderNo, custNo, routeNo, standingDay, invoiceDate, generate, generalNote, custDiscount, taxRate, terms,
        totalDiscount, totalDiscount_adjdown, totalDiscount_adjup, totalItems, totalItems_adjdown, totalItems_adjup, totalVat, totalVat_adjdown, totalVat_adjup)
        VALUES `;

        var values = invoices.map(invoice => `(${invoice.invoiceNo}, ${invoice.orderNo}, ${invoice.custNo}, '${invoice.routeNo.replace(/'/g, "''")}', '${invoice.standingDay.replace(/'/g, "''")}', '${invoice.invoiceDate.replace(/'/g, "''")}', '${invoice.generate.replace(/'/g, "''")}', '${invoice.generalNote.replace(/'/g, "''")}', ${invoice.custDiscount}, ${invoice.taxRate}, '${invoice.terms.replace(/'/g, "''")}', ${invoice.totalDiscount}, ${invoice.totalDiscount_adjdown}, ${invoice.totalDiscount_adjup}, ${invoice.totalItems}, ${invoice.totalItems_adjdown}, ${invoice.totalItems_adjup}, ${invoice.totalVat}, ${invoice.totalVat_adjdown}, ${invoice.totalVat_adjup})`).join(",\n");
        values += ';';

        await this.db.execute(sql + values);
        await this.loadData();
      } else {
        console.log(`Invoices list empty, skipping save`);

      }


}

    // Gets all items on an invoice by order number
    async getInvoiceItems(orderNo: number) {
        const result: InvoiceItem[] = (await this.db.query('SELECT * FROM invoiceitems WHERE orderNo = ?', [orderNo])).values as InvoiceItem[];
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    }

    // Get invoice item by orderNo and itemNo
    async getSingleInvoiceItem(itemNo: number, orderNo: number) {
        const result: InvoiceItem[] = (await this.db.query('SELECT * FROM invoiceitems WHERE itemNo = ? AND orderNo = ?', [itemNo, orderNo,])).values as InvoiceItem[];
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    }

    // Gets a customer by customer ID
    async getCustomer(custNo: number) {
        const result: Customer[] = (await this.db.query('SELECT * FROM customers WHERE id = ?', [custNo])).values as Customer[];
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    }

    // Gets a customer by invoice number
    async getCustomerbyInvoice(invoiceNo: number) {
        const result: Customer[] = (await this.db.query('SELECT c.* FROM customers c JOIN invoices i ON c.id = i.custNo WHERE i.invoiceNo = ?', [invoiceNo])).values as Customer[];
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    }

    // Gets invoices by invoice number
    async getInvoice(invoiceNo: number): Promise<Invoice | null> {
        const result: DBSQLiteValues = await this.db.query('SELECT * FROM invoices WHERE invoiceNo = ?', [invoiceNo]);
        if (result.values && result.values.length > 0) {
          return result.values[0] as Invoice;
        }
        return null;
    }

    // Gets invoice by order number
    async getInvoicebyOrderNo(orderNo: number) {
        const result: Invoice[] = (await this.db.query('SELECT * FROM invoices where orderNo = ?', [orderNo])).values as Invoice[];
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    }

    // Gets invoice by customer ID
    async getInvoicesbyCustNo(custNo: number) {
        const result: Invoice[] = (await this.db.query('SELECT * FROM invoices WHERE custNo = ?', [custNo])).values as Invoice[];
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    }

    // Log Return by ItemNo and OrderNo
    async logReturn(itemNo: number, orderNo: number, returnsNo: number, generalNote: string | null) {
        var invoice = await this.getInvoicebyOrderNo(orderNo);
        var item = await this.getSingleInvoiceItem(itemNo, orderNo);
        if (item != null && invoice != null) {
            await this.db.run('UPDATE invoiceitems SET returnsNo = ? WHERE orderNo = ?', [returnsNo, orderNo]);
            if (generalNote != null) {
                await this.db.run('UPDATE invoices SET generalNote = ? WHERE orderNo = ?', [generalNote, orderNo]);
            }
            await this.loadData();
        } else {
            await Toast.show({
                text: 'Error logging return!',
                duration: 'short',
                position: 'bottom'
            });
        }
    }

    async logReturns( items: { partNo: string, invoiceNo: number, qtyadj: number, returntype: string, returndate:string, route:string, routeuser:string,  generalNote: string}[]) {
        try {
            //await this.db.execute('BEGIN TRANSACTION;');

          const sql = `INSERT OR IGNORE INTO invoicereturns (partNo, invoiceNo, qtyadj, returntype, returndate, route, routeuser, generalNote, control) VALUES `;

           var values = items.map(item => `('${item.partNo.replace(/'/g, "''")}', ${item.invoiceNo}, ${item.qtyadj}, '${item.returntype}', '${item.returndate}', '${item.route.replace(/'/g, "''")}', '${item.route.replace(/'/g, "''")}', '${item.generalNote.replace(/'/g, "''")}', 0)`).join(",\n");
           values += ';';
           await this.db.execute(sql + values);

            //await this.db.execute('COMMIT');
            await this.loadData();
          await Toast.show({
            text: 'Return Logged Successfully!',
            duration: 'short',
            position: 'bottom',
          });

        } catch (error) {
            await this.db.execute('ROLLBACK');
            await Toast.show({
                text: 'Error logging returns!',
                duration: 'short',
                position: 'bottom',
            });
        }
    }

    // Log Discrepency by ItemNo and OrderNo
    async logDiscrepency(itemNo: number, orderNo: number, discrepencies: number, generalNote: string | null) {
        var invoice = await this.getInvoicebyOrderNo(orderNo);
        var item = await this.getSingleInvoiceItem(itemNo, orderNo);
        if (item != null && invoice != null) {
            await this.db.run('UPDATE invoiceitems SET discrepancies = ? WHERE orderNo = ?', [discrepencies, orderNo]);
            if (generalNote != null) {
                await this.db.run('UPDATE invoices SET generalNote = ? WHERE orderNo = ?', [generalNote, orderNo]);
            }
            await this.loadData();
        } else {
            await Toast.show({
                text: 'Error logging discrepancy!',
                duration: 'short',
                position: 'bottom'
            });
        }
    }

    // Log Credit Notes
    async logCreditNote(itemNo: number, orderNo: number, creditNotes: number, generalNote: string | null) {
        var invoice = this.getInvoicebyOrderNo(orderNo);
        var item = this.getSingleInvoiceItem(itemNo, orderNo);
        if (item != null && invoice != null) {
            await this.db.run('UPDATE invoiceitems SET creditNotes = ? WHERE orderNo = ?', [creditNotes, orderNo]);
            if (generalNote != null) {
                await this.db.run('UPDATE invoices SET generalNote = ? WHERE orderNo = ?', [generalNote, orderNo]);
            }
            await this.loadData();
        } else {
            await Toast.show({
                text: 'Error logging credit note!',
                duration: 'short',
                position: 'bottom'
            });
        }
    }

    // Mark Invoice Delivered
    async updateInvoiceStatus(invoiceNo: number, status: string) {
        var invoice = await this.getInvoice(invoiceNo);
        if ((invoice != null) && (invoice.generate != status)) {
            await this.db.run('UPDATE invoices SET generate = ? WHERE invoiceNo = ?', [status, invoiceNo])
            await this.loadData();
        } else {
            await Toast.show({
                text: 'Error updating delivery status!',
                duration: 'short',
                position: 'bottom'
            });
        }
    }

    // Loads Invoices Data into homePageList
    async loadHomePageData() {
        const result = await this.db.query(`SELECT i.*, c.company FROM invoices i JOIN customers c ON i.custNo = c.id;`);
        this.homePageList.next(result.values || []);
    }

    // Loads Returns Data into returnsList
    async loadReturnsData() {
        const result = (await this.db.query('SELECT inv.*, inv_item.* FROM invoices inv JOIN invoiceitems inv_item ON inv.orderNo = inv_item.orderNo WHERE inv_item.returnsNo > 0'))
        const results = result.values
        if (results != null) {
            const grouped: any = {};

            results.forEach(row => {
                const orderNo = row.orderNo;
                if (!grouped[orderNo]) {
                    grouped[orderNo] = {
                        ...row,
                        items: []
                    };
                }
                grouped[orderNo].items.push({
                    'itemNo': row.itemNo,
                    'returnsNo': row.returnsNo,
                    'discrepancies': row.discrepancies,
                });
            });

            const groupedArr = Object.values(grouped);
            this.returnsList.next(groupedArr);
        } else {
            this.returnsList.next([]);
        }
    }

    async getAllData() {
        const result: any[] = (await this.db.query('SELECT * FROM invoices JOIN invoiceitems ON invoiceitems.orderNo = invoices.orderNo')).values as any[];
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    }

    async getAllInvoices() {
        const result: Invoice[] = (await this.db.query('SELECT * FROM invoices')).values as Invoice[];
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    }

    async getAllInvoiceItems() {
        const result: InvoiceItem[] = (await this.db.query('SELECT * FROM invoiceitems')).values as InvoiceItem[];
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    }

    // Refreshes All Data
    async loadData() {
        await Promise.all([this.loadHomePageData(), this.loadReturnsData()]);
        this.isDatabaseReady.next(true);
    }

  async getAllProducts() {
    const result: Product[] = (await this.db.query('SELECT * FROM products')).values as Product[];
    if (result.length > 0) {
      return result;
    } else {
      return null;
    }
  }

  async getAllUnsyncedReturns() {
    const result: InvoiceReturn[] = (await this.db.query('SELECT * FROM invoicereturns where control = 0;')).values as InvoiceReturn[];
    if (result.length > 0) {
      return result;
    } else {
      return null;
    }
  }

  async setControlId(controlId: number, ids: number[]) {
    await this.db.run(`UPDATE invoicereturns SET control = ? WHERE id in (${ids.join(",")})`, [controlId])

  }
}
