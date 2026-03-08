import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-general',
  templateUrl: './home-general.component.html',
  styleUrls: ['./home-general.component.scss']
})
export class HomeGeneralComponent {


  constructor(private router: Router) {}


   goSaisonnier() {
    this.router.navigate(['/home']);
  }


  goRH() {
    this.router.navigate(['/login'], { queryParams: { role: 'RH_REGIONAL' }});
  }

}
