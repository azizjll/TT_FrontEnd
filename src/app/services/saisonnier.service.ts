// saisonnier.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SaisonnierDTO {
  id: number;
  nom: string;
  prenom: string;
  cin: number;
  rib: string;
}

@Injectable({ providedIn: 'root' })
export class SaisonnierService {
  private readonly API = 'http://localhost:8080/api/saisonniers';

  constructor(private http: HttpClient) {}

  getAll(): Observable<SaisonnierDTO[]> {
    return this.http.get<SaisonnierDTO[]>(this.API);
  }

  getById(id: number): Observable<SaisonnierDTO> {
    return this.http.get<SaisonnierDTO>(`${this.API}/${id}`);
  }
}