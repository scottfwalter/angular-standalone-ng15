import './polyfills';

import { Component, inject, Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { bootstrapApplication } from '@angular/platform-browser';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import {
  provideRouter,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  Routes,
} from '@angular/router';

@Injectable({ providedIn: 'root' })
export class StateService {
  #state$ = new BehaviorSubject<{ loggedIn: boolean }>({ loggedIn: false });
  loggedIn$ = this.#state$.pipe(map((x) => x.loggedIn));

  login = () => this.#state$.next({ loggedIn: true });
  logout = () => this.#state$.next({ loggedIn: false });
}

@Component({
  selector: 'my-app',
  template: `
    <ul class="nav">
      <li><a routerLink="/home" routerLinkActive="active">Home</a></li>
      <li><a routerLink="/login" routerLinkActive="active">Login</a></li>
      <li><a routerLink="/test" routerLinkActive="active">Test</a></li>
      <li *ngIf="loggedIn$ | async" routerLink="/admin" routerLinkActive="active">
        Admin
      </li>
      <li *ngIf="(loggedIn$ | async) === false" routerLinkActive="active">
        <a routerLink="/admin"> Admin (not logged in) </a>
      </li>
    </ul>
    <router-outlet></router-outlet>
  `,
  standalone: true,
  imports: [NgIf, AsyncPipe, RouterOutlet, RouterLink, RouterLinkActive],
})
export class AppComponent {
  loggedIn$ = inject(StateService).loggedIn$;
}

@Component({
  template: `
    <h3>Homepage</h3>
    <ul>
      <li *ngFor="let todo of todos$ | async">{{ todo.title }}</li>
    </ul>
  `,
  standalone: true,
  imports: [AsyncPipe, NgFor],
})
export class HomepageComponent {
  #http = inject(HttpClient);
  todos$ = this.#http.get<any[]>('https://jsonplaceholder.typicode.com/todos');
}

@Component({
  template: `
      <h3>Login page</h3>
      <button (click)="stateService.login()">Login</button>
  `,
  standalone: true,
})
export class LoginComponent {
  stateService = inject(StateService);
}

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomepageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'test', component: ngHtml('Test page!') },
  {
    path: 'admin',
    canActivate: [
      () => {
        const stateService = inject(StateService);
        const router = inject(Router);
        setTimeout(() => {
          stateService.logout();
          router.navigateByUrl('/');
        }, 4000);
        return stateService.loggedIn$;
      },
    ],
    component: ngHtml('Admin page!'),
  },
];

//export function ngHtml(html: string) {
function ngHtml(html: string) {
  @Component({ template: `<div [innerHTML]="_html"></div>` })
  class _NgHtml {
    _html = html;
  }
  return _NgHtml;
}

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(), provideRouter(routes)],
});
