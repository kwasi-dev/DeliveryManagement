import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SyncPage } from './sync.page';

describe('SyncPage', () => {
  let component: SyncPage;
  let fixture: ComponentFixture<SyncPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SyncPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
