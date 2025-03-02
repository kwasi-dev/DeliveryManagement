import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Injectable } from '@angular/core';
import { SQLiteService } from './sqlite.service';
import { DbnameVersionService } from './dbname-version.service';
import { UserUpgradeStatements } from '../upgrades/user.upgrade.statements';
import { Customer } from '../models/customer';
import { Invoice } from '../models/invoice';
import { Product } from '../models/product';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class StorageService {
    public customerList: BehaviorSubject<Customer[]> = new BehaviorSubject<Customer[]>([]);
    public productList: BehaviorSubject<Product[]> = new BehaviorSubject<Product[]>([]);
    public invoiceList: BehaviorSubject<Invoice[]> = new BehaviorSubject<Invoice[]>([]);
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
        await this.sqliteService.addUpgradeStatement( { database: this.databaseName, upgrade: this.versionUpgrades } );
        this.db = await this.sqliteService.openDatabase( this.databaseName, false, 'no-encryption', this.loadToVersion, false );
        this.dbVerService.set(this.databaseName, this.loadToVersion);
        await this.loadAllData();
    }

    databaseState() {
        return this.isDatabaseReady.asObservable();
    }

    fetchCustomers(): Observable<Customer[]> {
        return this.customerList.asObservable();
    }

    fetchProducts(): Observable<Product[]> {
        return this.productList.asObservable();
    }

    fetchInvoices(): Observable<Invoice[]> {
        return this.invoiceList.asObservable();
    }

    async loadCustomers() {
        const customers: Customer[] = (await this.db.query('SELECT * FROM customers;')).values as Customer[];
        this.customerList.next(customers);
    }

    async loadProducts() {
        const products: Product[] = (await this.db.query('SELECT * FROM products')).values as Product[];
        this.productList.next(products);
    }

    async loadInvoices() {
        const invoices: Invoice[] = (await this.db.query('SELECT * FROM invoices')).values as Invoice[];
        this.invoiceList.next(invoices);
    }
    
    async loadAllData() {
        await Promise.all( [ this.loadCustomers(), this.loadProducts(), this.loadInvoices() ] );
        this.isDatabaseReady.next(true);
    }

    async addCustomer(customer: Customer) {
        const sql = `INSERT INTO customers (areaNo, lastInvoiceDate, company, contact, email, phone, terms, type, addr1, addr2)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
        await this.db.run(sql, [
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
        await this.loadCustomers();
    }

    async addCustomers(sql: string, values: any[]): Promise<void> {
        if (!this.db) throw new Error("Database not initialized");
        try {
            await this.db.run(sql, values);
            console.log("Batch insert completed");
        } catch (error) {
            console.error("Batch insert failed: ", error);
            throw error;
        }
    }

    async addProduct(product: Product) {
        const sql = `INSERT INTO products (itemNo, numPerPack, orderNo, packs, partNo, quantity, returnsNo, price, vat, vatRate, discrepancies, discount, creditNotes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
        await this.db.run(sql, [
            product.itemNo,
            product.numPerPack,
            product.orderNo,
            product.packs,
            product.partNo,
            product.quantity,
            product.returnsNo,
            product.price,
            product.price,
            product.vat,
            product.vatRate,
            product.discrepancies,
            product.discount,
            product.creditNotes
        ]);
        await this.loadAllData();
    }

    async addInvoice(invoice: Invoice) {
        const sql = `INSERT INTO invoices (invoiceNo, orderNo, custNo, routeNo, standingDay, invoiceDate, generate, generalNote, custDiscount, taxRate, terms,
                    totalDiscount, totalDiscount_adjdown, totalDiscount_adjup, totalItems, totalItems_adjdown, totalItems_adjup, totalVat, totalVat_adjdown, totalVat_adjup)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
        await this.db.run(sql, [
            invoice.invoiceNo,
            invoice.orderNo,
            invoice.custNo,
            invoice.routeNo,
            invoice.standingDay,
            invoice.invoiceDate,
            invoice.generate,
            invoice.generalNote || null,
            invoice.custDiscount,
            invoice.taxRate,
            invoice.terms || null,
            invoice.totalDiscount,
            invoice.totalDiscount_adjdown,
            invoice.totalDiscount_adjup,
            invoice.totalItems,
            invoice.totalItems_adjdown,
            invoice.totalItems_adjup,
            invoice.totalVat,
            invoice.totalVat_adjdown,
            invoice.totalVat_adjup
        ]);
        await this.loadAllData();
    }

    async dropDatabase(): Promise<void> {
        try {
            if (!this.db) {
                throw new Error("Database not init...");
            }

            const clear = [
                'DELETE FROM customers;',
                'DELETE FROM products;',
                'DELETE FROM invoices;'
            ];

            for (const statement of clear) {
                await this.db.execute(statement);
            }

            console.log("All data cleared from database");
            this.customerList.next([]);
            this.productList.next([]);
            this.invoiceList.next([]);
            this.isDatabaseReady.next(true);
        } catch (error) {
            console.error("Error clearing data...", error);
            throw error;
        }
    }
}