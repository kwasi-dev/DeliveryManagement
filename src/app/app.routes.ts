import { Routes } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'router',
    pathMatch: 'full',
  },
  {
    path: 'router',
    component: NavbarComponent,
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'upload',
        loadComponent: () => import('./pages/sync/sync.page').then((m)=> m.SyncPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.page').then( m => m.SettingsPage)
      }
    ],
  },
];
