export class UserUpgradeStatements {
    userUpgrades = [
        {
        toVersion: 1,
        statements: [
            `PRAGMA foreign_keys = ON;`,
            `CREATE TABLE IF NOT EXISTS customers(
            id INTEGER PRIMARY KEY,
            areaNo INTEGER NOT NULL,
            lastInvoiceDate,
            company TEXT NOT NULL,
            contact TEXT,
            email TEXT,
            phone TEXT,
            terms TEXT,
            type TEXT,
            addr1 TEXT,
            addr2 TEXT
            );`,
            `CREATE TABLE IF NOT EXISTS invoices(
            invoiceNo INTEGER PRIMARY KEY,
            orderNo INTEGER UNIQUE NOT NULL,
            custNo INTEGER NOT NULL,
            routeNo TEXT NOT NULL,
            standingDay TEXT NOT NULL,
            invoiceDate TEXT NOT NULL,
            generate TEXT NOT NULL,
            generalNote TEXT,
            custDiscount,
            taxRate REAL,
            terms TEXT,
            totalDiscount REAL,
            totalDiscount_adjdown REAL,
            totalDiscount_adjup REAL,
            totalItems REAL,
            totalItems_adjdown REAL,
            totalItems_adjup,
            totalVat REAL,
            totalVat_adjdown REAL,
            totalVat_adjup REAL,
            FOREIGN KEY (custNo) REFERENCES customers(id) ON DELETE CASCADE
            );`,
            `CREATE TABLE IF NOT EXISTS invoiceitems(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            itemNo INTEGER NOT NULL,
            numPerPack REAL,
            orderNo INTEGER NOT NULL,
            packs REAL,
            partNo TEXT NOT NULL,
            quantity REAL NOT NULL,
            returnsNo REAL,
            price REAL NOT NULL,
            vat REAL,
            vatRate REAL,
            discrepancies REAL,
            discount REAL,
            creditNotes INTEGER,
            FOREIGN KEY (orderNo) REFERENCES invoices(orderNo) ON DELETE CASCADE
            );`,
          `CREATE TABLE IF NOT EXISTS products(
            description TEXT NOT NULL,
            partNo TEXT NOT NULL
          );`,
          `CREATE TABLE IF NOT EXISTS invoicereturns(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            partNo TEXT NOT NULL,
            invoiceNo INTEGER,
            qtyadj REAL NOT NULL,
            returntype TEXT NOT NULL,
            returndate TEXT NOT NULL,
            route TEXT NOT NULL,
            routeuser TEXT NOT NULL,
            generalNote TEXT,
            control INTEGER
          );`,
          `CREATE TABLE IF NOT EXISTS settings(
            id INTEGER PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            value TEXT
            );`,
          `INSERT INTO settings (name, value) VALUES ('baseurl', 'http://3.208.13.82:2078')`
        ]
        },
      {
        toVersion: 2,
        statements: [
          `ALTER TABLE invoicereturns ADD COLUMN timestamp INTEGER;`
        ]},
      {
        toVersion: 3,
        statements: [
          `ALTER TABLE invoicereturns ADD COLUMN itemNo INTEGER;`
        ]},
      {
        toVersion: 4,
        statements: [
          `DROP TABLE invoicereturns;`,
          `CREATE TABLE IF NOT EXISTS invoicereturns(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            route TEXT NOT NULL,
            routeuser TEXT NOT NULL,
            returndate TEXT NOT NULL,
            returnnote TEXT,
            returntype TEXT NOT NULL,
            control INTEGER
          );`,
          `CREATE TABLE IF NOT EXISTS invoicereturnitems(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoicereturnid INTEGER NOT NULL,
            qtyadj REAL NOT NULL,
            invoiceno INTEGER,
            partno TEXT NOT NULL,
            itemno INTEGER,
            FOREIGN KEY (invoicereturnid) REFERENCES invoicereturns(id) ON DELETE CASCADE
            );`,

        ]},
    ]
}
