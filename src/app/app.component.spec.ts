import { TestBed, ComponentFixture, tick, fakeAsync } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicModule } from '@ionic/angular'; // To use Ionic components
import { routes } from './app.routes';
import { delay, timeout } from 'rxjs';
import { StorageService } from './services/database/storage.service';  // Import StorageService

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        AppComponent,
      ],
      providers: [
        provideRouter(routes),
        { provide: StorageService, useValue: {} },
         { provide: StorageService, 
          useValue: { 
            get: jasmine.createSpy('get').and.returnValue('mocked data'),
            set: jasmine.createSpy('set') 
          }
        },
        
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create the AppComponent', async () => {
    expect(component).toBeTruthy();
  });

  it('should contain a router-outlet', () => {
    const routerOutlet = fixture.nativeElement.querySelector('ion-router-outlet');
    expect(routerOutlet).toBeTruthy();
  });

});
