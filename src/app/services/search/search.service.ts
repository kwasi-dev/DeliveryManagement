import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private _showSearch = new BehaviorSubject<boolean>(false);
  private _showToolbar = new BehaviorSubject<boolean>(false);
  showSearch$ = this._showSearch.asObservable();
  showToolbar$ = this._showToolbar.asObservable();

  toggle() {
    this._showSearch.next(true);
    this._showToolbar.next(false);
  }

  init() {
    this._showToolbar.next(true);
    this._showSearch.next(false);
  }
}
