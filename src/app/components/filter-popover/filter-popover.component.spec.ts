import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterPopoverComponent } from './filter-popover.component';
import { IonicModule } from '@ionic/angular';  // Import IonicModule
import { CommonModule } from '@angular/common';  // If using common Angular functionalities
import { FormsModule } from '@angular/forms';  // Import FormsModule
import { PopoverController } from '@ionic/angular';  // Import PopoverController

describe('FilterPopoverComponent', () => {
  let component: FilterPopoverComponent;
  let fixture: ComponentFixture<FilterPopoverComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),  // Ensure IonicModule is imported
        CommonModule,           // CommonModule for Angular functionalities
        FormsModule             // FormsModule for form functionalities
      ],
      providers: [
        PopoverController       // Provide PopoverController
      ]
    });

    fixture = TestBed.createComponent(FilterPopoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();  // Trigger change detection
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Additional test cases for FilterPopoverComponent can go here
});
