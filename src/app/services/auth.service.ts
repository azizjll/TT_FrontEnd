import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SignupRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  cin?: string;
  telephone?: string;
  role?: string;
  regionId?: number;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface NewPasswordRequest {
  token: string;
  newPassword: string;
}

export interface Region {
  id: number;
  nom: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = 'http://localhost:8080/auth'; // changer si besoin

  constructor(private http: HttpClient) { }

  signup(request: SignupRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/signup`, request);
  }

  verifyToken(token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/verify`, { params: { token } });
  }

  signin(request: SigninRequest): Observable<{ token: string }> {
  return this.http.post<{ token: string }>(`${this.baseUrl}/signin`, request);
}

  forgotPassword(request: PasswordResetRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/forgot-password`, request);
  }

  resetPassword(request: NewPasswordRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/reset-password`, request);
  }

   // Récupérer les régions
  getRegions(): Observable<Region[]> {
    return this.http.get<Region[]>(`${this.baseUrl}/regions`);
  }

  // Récupérer les rôles
  getRoles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/roles`);
  }

  // Sauvegarder le token
setToken(token: string): void {
  localStorage.setItem('token', token);
}

// Récupérer le token
getToken(): string | null {
  return localStorage.getItem('token');
}

// Supprimer le token
logout(): void {
  localStorage.removeItem('token');
}

// Construire headers avec Bearer
private authHeaders(): HttpHeaders {
  const token = this.getToken();

  return new HttpHeaders({
    Authorization: `Bearer ${token}`
  });
}

// Récupérer la région du RH connecté
getMyRegion(): Observable<Region> {
  const headers = this.authHeaders(); // ton header avec token
  return this.http.get<Region>(`${this.baseUrl}/my-region`, { headers });
}
}