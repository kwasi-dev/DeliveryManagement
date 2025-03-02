export class UserUpgradeStatements {
    userUpgrades = [
        {
        toVersion: 3
        ,
        statements: [
            `CREATE TABLE IF NOT EXISTS customers(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            areaNo INTEGER,
            lastInvoiceDate,
            company TEXT,
            contact TEXT,
            email TEXT,
            phone TEXT,
            terms TEXT,
            type TEXT,
            addr1 TEXT,
            addr2 TEXT
            );`,
            `CREATE TABLE IF NOT EXISTS products(
            itemNo INTEGER PRIMARY KEY,
            numPerPack INTEGER,
            orderNo INTEGER,
            packs INTEGER,
            partNo TEXT,
            quantity INTEGER,
            returnsNo INTEGER,
            price REAL,
            vat REAL,
            vatRate REAL,
            discrepancies INTEGER,
            discount REAL,
            creditNotes INTEGER
            );`,
            `CREATE TABLE IF NOT EXISTS invoices(
            invoiceNo INTEGER PRIMARY KEY,
            orderNo INTEGER,
            custNo INTEGER,
            routeNo TEXT,
            standingDay TEXT,
            invoiceDate TEXT,
            generate TEXT,
            generalNote TEXT,
            custDiscount REAL,
            taxRate REAL,
            terms TEXT,
            totalDiscount REAL,
            totalDiscount_adjdown REAL,
            totalDiscount_adjup REAL,
            totalItems REAL,
            totalItems_adjdown REAL,
            totalItems_adjup REAL,
            totalVat REAL,
            totalVat_adjdown REAL,
            totalVat_adjup REAL
            );`
        ]
        },
        /* add new statements below for next database version when required*/
        /*
        {
        toVersion: 2,
        statements: [
            `ALTER TABLE users ADD COLUMN email TEXT;`,
        ]
        },
        */
    ]
}    