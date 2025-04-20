import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { SQLiteConnection, SQLiteDBConnection, CapacitorSQLitePlugin, capSQLiteResult, CapacitorSQLite, capSQLiteUpgradeOptions } from '@capacitor-community/sqlite';
import { SQLiteService } from './sqlite.service';

// Mock SQLiteDBConnection
class MockSQLiteDBConnection {
  async open(): Promise<void> {
    return Promise.resolve();
  }
}

describe('SQLiteService', () => {
  let service: SQLiteService;
  let platformSpy: jasmine.Spy;
  let sqliteConnectionSpy: jasmine.SpyObj<SQLiteConnection>;
  let sqlitePluginSpy: jasmine.SpyObj<CapacitorSQLitePlugin>;

  beforeEach(() => {
    // Create spies for SQLiteConnection and CapacitorSQLitePlugin
    sqliteConnectionSpy = jasmine.createSpyObj('SQLiteConnection', [
      'checkConnectionsConsistency',
      'isConnection',
      'retrieveConnection',
      'createConnection',
      'saveToStore',
      'closeConnection',
      'initWebStore'
    ]);
    sqlitePluginSpy = jasmine.createSpyObj('CapacitorSQLitePlugin', ['addUpgradeStatement']);

    TestBed.configureTestingModule({
      providers: [SQLiteService]
    });

    service = TestBed.inject(SQLiteService);

    // Set up platform spy
    platformSpy = spyOn(Capacitor, 'getPlatform').and.returnValue('ios');
  });

  describe('initializePlugin', () => {
    beforeEach(() => {
      // Mock CapacitorSQLite plugin before initializePlugin
      (service as any).sqlitePlugin = sqlitePluginSpy;
    });

    it('should initialize the plugin successfully', async () => {
      // Act
      const result = await service.initializePlugin();

      // Assert
      expect(result).toBe(true);
      expect(service.isService).toBe(true);
      expect(service.sqlitePlugin).toEqual(sqlitePluginSpy);
      expect(service.sqliteConnection).toBeDefined();
    });

    it('should set platform correctly for ios', async () => {
      await service.initializePlugin();
      expect(service.platform).toBe('ios');
      expect(service.native).toBe(true);
    });

    it('should set platform correctly for android', async () => {
      platformSpy.and.returnValue('android');
      await service.initializePlugin();
      expect(service.platform).toBe('android');
      expect(service.native).toBe(true);
    });

    it('should set native to false for web platform', async () => {
      platformSpy.and.returnValue('web');
      await service.initializePlugin();
      expect(service.platform).toBe('web');
      expect(service.native).toBe(false);
    });

    it('should create SQLiteConnection instance', async () => {
      await service.initializePlugin();
      expect(service.sqliteConnection).toBeDefined();
      expect(service.sqliteConnection instanceof SQLiteConnection).toBe(true);
    });
  });

  describe('initWebStore', () => {
    beforeEach(async () => {
      (service as any).sqlitePlugin = sqlitePluginSpy;
      await service.initializePlugin();
      (service as any).sqliteConnection = sqliteConnectionSpy;
    });

    it('should initialize web store successfully', async () => {
      // Arrange
      sqliteConnectionSpy.initWebStore.and.returnValue(Promise.resolve());

      // Act
      await service.initWebStore();

      // Assert
      expect(sqliteConnectionSpy.initWebStore).toHaveBeenCalled();
    });

    it('should reject with error message when initWebStore fails', async () => {
      // Arrange
      const error = new Error('Error');
      sqliteConnectionSpy.initWebStore.and.returnValue(Promise.reject(error));

      // Act & Assert
      await expectAsync(service.initWebStore()).toBeRejectedWith(`initWebStore: ${error.message}`);
      expect(sqliteConnectionSpy.initWebStore).toHaveBeenCalled();
    });

    it('should reject with string error when initWebStore fails without message', async () => {
      // Arrange
      const error = 'Unknown error';
      sqliteConnectionSpy.initWebStore.and.returnValue(Promise.reject(error));

      // Act & Assert
      await expectAsync(service.initWebStore()).toBeRejectedWith(`initWebStore: ${error}`);
      expect(sqliteConnectionSpy.initWebStore).toHaveBeenCalled();
    });
  });

  describe('openDatabase', () => {
    const dbName = 'testDB';
    const encrypted = false;
    const mode = 'no-encryption';
    const version = 1;
    const readonly = false;

    beforeEach(async () => {
      // Initialize plugin and mock sqliteConnection for openDatabase tests
      (service as any).sqlitePlugin = sqlitePluginSpy;
      await service.initializePlugin();
      (service as any).sqliteConnection = sqliteConnectionSpy;
    });

    it('should retrieve existing connection if consistent and exists', async () => {
      // Arrange
      const mockConnection = new MockSQLiteDBConnection() as unknown as SQLiteDBConnection;
      sqliteConnectionSpy.checkConnectionsConsistency.and.returnValue(Promise.resolve({ result: true } as capSQLiteResult));
      sqliteConnectionSpy.isConnection.and.returnValue(Promise.resolve({ result: true } as capSQLiteResult));
      sqliteConnectionSpy.retrieveConnection.and.returnValue(Promise.resolve(mockConnection));
      const openSpy = spyOn(mockConnection, 'open').and.callThrough();

      // Act
      const result = await service.openDatabase(dbName, encrypted, mode, version, readonly);

      // Assert
      expect(sqliteConnectionSpy.checkConnectionsConsistency).toHaveBeenCalled();
      expect(sqliteConnectionSpy.isConnection).toHaveBeenCalledWith(dbName, readonly);
      expect(sqliteConnectionSpy.retrieveConnection).toHaveBeenCalledWith(dbName, readonly);
      expect(sqliteConnectionSpy.createConnection).not.toHaveBeenCalled();
      expect(openSpy).toHaveBeenCalled();
      expect(result).toBe(mockConnection);
    });

    it('should create new connection if no existing connection', async () => {
      // Arrange
      const mockConnection = new MockSQLiteDBConnection() as unknown as SQLiteDBConnection;
      sqliteConnectionSpy.checkConnectionsConsistency.and.returnValue(Promise.resolve({ result: false } as capSQLiteResult));
      sqliteConnectionSpy.isConnection.and.returnValue(Promise.resolve({ result: false } as capSQLiteResult));
      sqliteConnectionSpy.createConnection.and.returnValue(Promise.resolve(mockConnection));
      const openSpy = spyOn(mockConnection, 'open').and.callThrough();

      // Act
      const result = await service.openDatabase(dbName, encrypted, mode, version, readonly);

      // Assert
      expect(sqliteConnectionSpy.checkConnectionsConsistency).toHaveBeenCalled();
      expect(sqliteConnectionSpy.isConnection).toHaveBeenCalledWith(dbName, readonly);
      expect(sqliteConnectionSpy.createConnection).toHaveBeenCalledWith(dbName, encrypted, mode, version, readonly);
      expect(sqliteConnectionSpy.retrieveConnection).not.toHaveBeenCalled();
      expect(openSpy).toHaveBeenCalled();
      expect(result).toBe(mockConnection);
    });

    it('should create new connection if connections are inconsistent', async () => {
      // Arrange
      const mockConnection = new MockSQLiteDBConnection() as unknown as SQLiteDBConnection;
      sqliteConnectionSpy.checkConnectionsConsistency.and.returnValue(Promise.resolve({ result: false } as capSQLiteResult));
      sqliteConnectionSpy.isConnection.and.returnValue(Promise.resolve({ result: true } as capSQLiteResult));
      sqliteConnectionSpy.createConnection.and.returnValue(Promise.resolve(mockConnection));
      const openSpy = spyOn(mockConnection, 'open').and.callThrough();

      // Act
      const result = await service.openDatabase(dbName, encrypted, mode, version, readonly);

      // Assert
      expect(sqliteConnectionSpy.checkConnectionsConsistency).toHaveBeenCalled();
      expect(sqliteConnectionSpy.isConnection).toHaveBeenCalledWith(dbName, readonly);
      expect(sqliteConnectionSpy.createConnection).toHaveBeenCalledWith(dbName, encrypted, mode, version, readonly);
      expect(sqliteConnectionSpy.retrieveConnection).not.toHaveBeenCalled();
      expect(openSpy).toHaveBeenCalled();
      expect(result).toBe(mockConnection);
    });

    it('should handle errors during connection retrieval', async () => {
      // Arrange
      const error = new Error('Connection retrieval failed');
      sqliteConnectionSpy.checkConnectionsConsistency.and.returnValue(Promise.resolve({ result: true } as capSQLiteResult));
      sqliteConnectionSpy.isConnection.and.returnValue(Promise.resolve({ result: true } as capSQLiteResult));
      sqliteConnectionSpy.retrieveConnection.and.returnValue(Promise.reject(error));

      // Act & Assert
      await expectAsync(service.openDatabase(dbName, encrypted, mode, version, readonly)).toBeRejectedWith(error);
      expect(sqliteConnectionSpy.checkConnectionsConsistency).toHaveBeenCalled();
      expect(sqliteConnectionSpy.isConnection).toHaveBeenCalledWith(dbName, readonly);
      expect(sqliteConnectionSpy.retrieveConnection).toHaveBeenCalledWith(dbName, readonly);
      expect(sqliteConnectionSpy.createConnection).not.toHaveBeenCalled();
    });

    it('should handle errors during connection creation', async () => {
      // Arrange
      const error = new Error('Connection creation failed');
      sqliteConnectionSpy.checkConnectionsConsistency.and.returnValue(Promise.resolve({ result: false } as capSQLiteResult));
      sqliteConnectionSpy.isConnection.and.returnValue(Promise.resolve({ result: false } as capSQLiteResult));
      sqliteConnectionSpy.createConnection.and.returnValue(Promise.reject(error));

      // Act & Assert
      await expectAsync(service.openDatabase(dbName, encrypted, mode, version, readonly)).toBeRejectedWith(error);
      expect(sqliteConnectionSpy.checkConnectionsConsistency).toHaveBeenCalled();
      expect(sqliteConnectionSpy.isConnection).toHaveBeenCalledWith(dbName, readonly);
      expect(sqliteConnectionSpy.createConnection).toHaveBeenCalledWith(dbName, encrypted, mode, version, readonly);
      expect(sqliteConnectionSpy.retrieveConnection).not.toHaveBeenCalled();
    });

    it('should handle errors during database open', async () => {
      // Arrange
      const mockConnection = new MockSQLiteDBConnection() as unknown as SQLiteDBConnection;
      const error = new Error('Database open failed');
      sqliteConnectionSpy.checkConnectionsConsistency.and.returnValue(Promise.resolve({ result: false } as capSQLiteResult));
      sqliteConnectionSpy.isConnection.and.returnValue(Promise.resolve({ result: false } as capSQLiteResult));
      sqliteConnectionSpy.createConnection.and.returnValue(Promise.resolve(mockConnection));
      spyOn(mockConnection, 'open').and.returnValue(Promise.reject(error));

      // Act & Assert
      await expectAsync(service.openDatabase(dbName, encrypted, mode, version, readonly)).toBeRejectedWith(error);
      expect(sqliteConnectionSpy.checkConnectionsConsistency).toHaveBeenCalled();
      expect(sqliteConnectionSpy.isConnection).toHaveBeenCalledWith(dbName, readonly);
      expect(sqliteConnectionSpy.createConnection).toHaveBeenCalledWith(dbName, encrypted, mode, version, readonly);
      expect(mockConnection.open).toHaveBeenCalled();
    });
  });

  describe('retrieveConnection', () => {
    beforeEach(async () => {
      (service as any).sqlitePlugin = sqlitePluginSpy;
      await service.initializePlugin();
      (service as any).sqliteConnection = sqliteConnectionSpy;
    });

    it('should retrieve connection successfully', async () => {
      // Arrange
      const dbName = 'testDB';
      const readonly = false;
      const mockConnection = new MockSQLiteDBConnection() as unknown as SQLiteDBConnection;
      sqliteConnectionSpy.retrieveConnection.and.returnValue(Promise.resolve(mockConnection));

      // Act
      const result = await service.retrieveConnection(dbName, readonly);

      // Assert
      expect(sqliteConnectionSpy.retrieveConnection).toHaveBeenCalledWith(dbName, readonly);
      expect(result).toBe(mockConnection);
    });

    it('should reject with error when retrieveConnection fails', async () => {
      // Arrange
      const dbName = 'testDB';
      const readonly = false;
      const error = new Error('Retrieve connection failed');
      sqliteConnectionSpy.retrieveConnection.and.returnValue(Promise.reject(error));

      // Act & Assert
      await expectAsync(service.retrieveConnection(dbName, readonly)).toBeRejectedWith(error);
      expect(sqliteConnectionSpy.retrieveConnection).toHaveBeenCalledWith(dbName, readonly);
    });
  });

  describe('closeConnection', () => {
    beforeEach(async () => {
      (service as any).sqlitePlugin = sqlitePluginSpy;
      await service.initializePlugin();
      (service as any).sqliteConnection = sqliteConnectionSpy;
    });

    it('should close connection successfully with default readonly', async () => {
      // Arrange
      const dbName = 'testDB';
      sqliteConnectionSpy.closeConnection.and.returnValue(Promise.resolve());

      // Act
      await service.closeConnection(dbName);

      // Assert
      expect(sqliteConnectionSpy.closeConnection).toHaveBeenCalledWith(dbName, false);
    });

    it('should close connection successfully with specified readonly', async () => {
      // Arrange
      const dbName = 'testDB';
      const readonly = true;
      sqliteConnectionSpy.closeConnection.and.returnValue(Promise.resolve());

      // Act
      await service.closeConnection(dbName, readonly);

      // Assert
      expect(sqliteConnectionSpy.closeConnection).toHaveBeenCalledWith(dbName, readonly);
    });

    it('should reject with error when closeConnection fails', async () => {
      // Arrange
      const dbName = 'testDB';
      const readonly = false;
      const error = new Error('Close connection failed');
      sqliteConnectionSpy.closeConnection.and.returnValue(Promise.reject(error));

      // Act & Assert
      await expectAsync(service.closeConnection(dbName, readonly)).toBeRejectedWith(error);
      expect(sqliteConnectionSpy.closeConnection).toHaveBeenCalledWith(dbName, readonly);
    });
  });

  describe('addUpgradeStatement', () => {
    beforeEach(() => {
      (service as any).sqlitePlugin = sqlitePluginSpy;
    });

    it('should add upgrade statement successfully', async () => {
      // Arrange
      const options: capSQLiteUpgradeOptions = {
        database: 'testDB',
        upgrade: [{ toVersion: 2, statements: ['ALTER TABLE test ADD COLUMN new_col INTEGER;'] }]
      };
      sqlitePluginSpy.addUpgradeStatement.and.returnValue(Promise.resolve());

      // Act
      await service.addUpgradeStatement(options);

      // Assert
      expect(sqlitePluginSpy.addUpgradeStatement).toHaveBeenCalledWith(options);
    });

    it('should reject with error when addUpgradeStatement fails', async () => {
      // Arrange
      const options: capSQLiteUpgradeOptions = {
        database: 'testDB',
        upgrade: [{ toVersion: 2, statements: ['ALTER TABLE test ADD COLUMN new_col INTEGER;'] }]
      };
      const error = new Error('Add upgrade statement failed');
      sqlitePluginSpy.addUpgradeStatement.and.returnValue(Promise.reject(error));

      // Act & Assert
      await expectAsync(service.addUpgradeStatement(options)).toBeRejectedWith(error);
      expect(sqlitePluginSpy.addUpgradeStatement).toHaveBeenCalledWith(options);
    });
  });

  describe('saveToStore', () => {
    beforeEach(async () => {
      (service as any).sqlitePlugin = sqlitePluginSpy;
      await service.initializePlugin();
      (service as any).sqliteConnection = sqliteConnectionSpy;
    });

    it('should save to store successfully', async () => {
      // Arrange
      const dbName = 'testDB';
      sqliteConnectionSpy.saveToStore.and.returnValue(Promise.resolve());

      // Act
      await service.saveToStore(dbName);

      // Assert
      expect(sqliteConnectionSpy.saveToStore).toHaveBeenCalledWith(dbName);
    });

    it('should reject with error when saveToStore fails', async () => {
      // Arrange
      const dbName = 'testDB';
      const error = new Error('Save to store failed');
      sqliteConnectionSpy.saveToStore.and.returnValue(Promise.reject(error));

      // Act & Assert
      await expectAsync(service.saveToStore(dbName)).toBeRejectedWith(error);
      expect(sqliteConnectionSpy.saveToStore).toHaveBeenCalledWith(dbName);
    });
  });
});