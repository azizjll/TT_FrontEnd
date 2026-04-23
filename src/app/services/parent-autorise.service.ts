import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ParentAutorise {
  id: number ;
  nomPrenom: string;
  matricule: string;
  utilise: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ParentAutoriseService {

  private apiUrl = 'http://localhost:8080/api/parents';

  constructor(private http: HttpClient) {}

  // 📋 GET ALL
  getAllParents(): Observable<ParentAutorise[]> {
    return this.http.get<ParentAutorise[]>(this.apiUrl);
  }

  // 🔍 GET BY ID
  getParentById(id: number): Observable<ParentAutorise> {
    return this.http.get<ParentAutorise>(`${this.apiUrl}/${id}`);
  }

  // ➕ ADD
  addParent(nomPrenom: string, matricule: string): Observable<any> {
    const params = new HttpParams()
      .set('nomPrenom', nomPrenom)
      .set('matricule', matricule);

    return this.http.post(this.apiUrl, params);
  }

  // ✏️ UPDATE
  updateParent(id: number, nomPrenom: string, matricule: string, utilise: boolean) {

  const params = new HttpParams()
    .set('nomPrenom', nomPrenom)
    .set('matricule', matricule)
    .set('utilise', utilise);

  return this.http.put(`${this.apiUrl}/${id}`, params);
}

  // ❌ DELETE
  deleteParent(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}