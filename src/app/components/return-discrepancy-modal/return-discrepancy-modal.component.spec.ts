import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReturnDiscrepancyModalComponent } from './return-discrepancy-modal.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { StorageService } from 'src/app/services/database/storage.service';
import { SQLiteService } from 'src/app/services/database/sqlite.service';  // Import SQLiteService
import { DbnameVersionService } from 'src/app/services/database/dbname-version.service';  // Import DbnameVersionService
import { of } from 'rxjs';

// Mock SQLiteService
class MockSQLiteService {
  getInvoiceItems(orderNo: number) {
    return of([{ itemNo: 1, orderNo, quantity: 5 }]);
  }
}

// Mock DbnameVersionService (you can mock its methods as needed)
class MockDbnameVersionService {
  set(database: string, version: number) {}
  // Add other methods if needed for testing
}

describe('ReturnDiscrepancyModalComponent', () => {
  let component: ReturnDiscrepancyModalComponent;
  let fixture: ComponentFixture<ReturnDiscrepancyModalComponent>;

  const mockInvoice = {
    invoiceNo: 12345,
    orderNo: 67890,
    generalNote: 'Test Invoice Note',
    generate: 'Y'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        CommonModule,
        FormsModule
      ],
      providers: [
        ModalController,
        { provide: StorageService, useClass: StorageService },
        { provide: SQLiteService, useClass: MockSQLiteService },
        { provide: DbnameVersionService, useClass: MockDbnameVersionService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnDiscrepancyModalComponent);
    component = fixture.componentInstance;
    
    // Provide the invoice mock data here
    component.invoice = mockInvoice;
    
    fixture.detectChanges();  // Trigger change detection
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Additional tests for other functionalities can go here
});
