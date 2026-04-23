import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  title = 'TT_FrontEnd';
  showLayout = true;

  constructor(private router: Router) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe(event => {
        const url = event.urlAfterRedirects;

        this.showLayout = !(
          url.startsWith('/login') ||
          url.startsWith('/admin') ||
          url.startsWith('/home-ge')||
          url.startsWith('/dash')
        );
      });
  }
}