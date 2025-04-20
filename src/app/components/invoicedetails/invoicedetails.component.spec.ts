import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvoicedetailsComponent } from './invoicedetails.component';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from 'src/app/services/database/storage.service';
import { NyxPrinter } from 'nyx-printer/src';
import { of } from 'rxjs';

// Mocking necessary services
class MockStorageService {
  updateInvoiceStatus(invoiceNo: number, status: string) {
    return Promise.resolve();
  }
}

describe('InvoicedetailsComponent', () => {
  let component: InvoicedetailsComponent;
  let fixture: ComponentFixture<InvoicedetailsComponent>;

  // Mock Data
  const mockInvoice = {
    invoiceNo: 12345,
    company: 'Test Company',
    routeNo: 'Route1',
    custNo: '123',
    invoiceDate: '2024-08-01T00:00:00',
    generalNote: 'Test Note',
    totalItems: 200.50
  };

  const mockItems = [
    { itemNo: 1, quantity: 2, price: 50, vat: 5 },
    { itemNo: 2, quantity: 3, price: 30, vat: 3 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), CommonModule, FormsModule],
      providers: [
        { provide: StorageService, useClass: MockStorageService },
        ModalController,
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoicedetailsComponent);
    component = fixture.componentInstance;

    // Set the input data
    component.invoice = mockInvoice;
    component.items = mockItems;

    fixture.detectChanges();  // Trigger change detection
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Additional test cases can be added here
  it('should generate the receipt', async () => {
    await component.generateReceipt();

    expect(component.receipt).toContain('Confirmation of Delivery');
    expect(component.receipt).toContain(mockInvoice.invoiceNo.toString());
    expect(component.receipt).toContain(mockInvoice.company);
    expect(component.receipt).toContain(mockItems[0].itemNo.toString());
  });

  it('should confirm delivery', async () => {
    const spy = spyOn(component, 'generateReceipt').and.callThrough();
    await component.confirmDelivery();

    expect(spy).toHaveBeenCalled();
    // Add more checks for the NyxPrinter here if needed
  });

});
