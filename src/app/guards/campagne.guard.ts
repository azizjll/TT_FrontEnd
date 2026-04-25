import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { CampagneService } from '../services/campagne.service';

@Injectable({
  providedIn: 'root'
})
export class CampagneGuard implements CanActivate {

  constructor(
    private router: Router,
    private campagneService: CampagneService
  ) {}

  canActivate(): Observable<boolean> {

    return this.campagneService.getCampagnesActives().pipe(

      map(campagnes => {

        const activeCampagne = campagnes.find(c => new Date(c.dateFin).getTime() > Date.now());

        if (!activeCampagne) {
          this.router.navigate(['/campagne-expiree']);
          return false;
        }

        const now = Date.now();
        const fin = new Date(activeCampagne.dateFin + 'T23:59:59').getTime();

        console.log('NOW:', now);
        console.log('FIN:', fin);

        if (now > fin) {
          this.router.navigate(['/campagne-expiree']);
          return false;
        }

        return true;
      })

    );
  }
}