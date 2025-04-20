import { DbnameVersionService } from './dbname-version.service';

describe('DbnameVersionService', () => {
  let service: DbnameVersionService;

  beforeEach(() => {
    service = new DbnameVersionService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set database name and version', () => {
    // Arrange
    const dbName = 'testDB';
    const version = 1;

    // Act
    service.set(dbName, version);

    // Assert
    expect(service['getVersion'](dbName)).toBe(version);
  });

  it('should return correct version for known database', () => {
    // Arrange
    const dbName = 'testDB';
    const version = 2;
    service.set(dbName, version);

    // Act
    const result = service.getVersion(dbName);

    // Assert
    expect(result).toBe(version);
  });

  it('should return -1 for unknown database', () => {
    // Arrange
    const dbName = 'unknownDB';

    // Act
    const result = service.getVersion(dbName);

    // Assert
    expect(result).toBe(-1);
  });

  it('should overwrite version for existing database', () => {
    // Arrange
    const dbName = 'testDB';
    const version1 = 1;
    const version2 = 3;
    service.set(dbName, version1);

    // Act
    service.set(dbName, version2);
    const result = service.getVersion(dbName);

    // Assert
    expect(result).toBe(version2);
  });
});