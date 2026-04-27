import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ParentAutorise {
  id: number;
  nomPrenom: string;
  matricule: string;
  autorises: number;  // ✅ int
  utilise: number;    // ✅ int (pas boolean)
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
  addParent(nomPrenom: string, matricule: string, autorises: number): Observable<any> {
  return this.http.post(`${this.apiUrl}?nomPrenom=${nomPrenom}&matricule=${matricule}&autorises=${autorises}`, {});
}

updateParent(id: number, nomPrenom: string, matricule: string, autorises: number, utilise: number): Observable<any> {
  return this.http.put(`${this.apiUrl}/${id}?nomPrenom=${nomPrenom}&matricule=${matricule}&autorises=${autorises}&utilise=${utilise}`, {});
}

  // ❌ DELETE
  deleteParent(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}