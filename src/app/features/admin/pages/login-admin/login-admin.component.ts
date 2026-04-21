// login-admin.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  AuthService,
  SigninRequest,
  SignupRequest,
  PasswordResetRequest,
  NewPasswordRequest,
  Region
} from 'src/app/services/auth.service';
import { CampagneService } from 'src/app/services/campagne.service';

export type AuthView = 'login' | 'signup' | 'forgot' | 'reset' | 'verify';
export type VerifyResult = 'idle' | 'success' | 'error';

@Component({
  selector: 'app-login-admin',
  templateUrl: './login-admin.component.html',
  styleUrls: ['./login-admin.component.scss']
})
export class LoginAdminComponent implements OnInit {

  // ── Vue active ───────────────────────────────────────────────────
  currentView: AuthView = 'login';
  isAnimating = false;

  // ── Login ────────────────────────────────────────────────────────
  loginData: SigninRequest = { email: '', password: '' };
  showLoginPassword = false;
  rememberMe = false;



  // ── Signup ───────────────────────────────────────────────────────
  signupData: SignupRequest = {
    nom: '', prenom: '', email: '', password: '',
    cin: '', telephone: '', role: 'ADMIN', regionId: undefined
  };
  showSignupPassword = false;
  signupConfirmPassword = '';
  showConfirmPassword = false;
  regions: Region[] = [];
  roles: string[] = [];

  // ── Forgot Password ──────────────────────────────────────────────
  forgotData: PasswordResetRequest = { email: '' };
  forgotSent = false;

  // ── Reset Password ───────────────────────────────────────────────
  resetData: NewPasswordRequest = { token: '', newPassword: '' };
  showResetPassword = false;
  resetSuccess = false;

  // ── Verify Token ─────────────────────────────────────────────────
  verifyTokenValue = '';
  verifyResult: VerifyResult = 'idle';


  // ── États UI partagés ────────────────────────────────────────────
  isLoading = false;
  globalError = '';
  globalSuccess = '';
  errors: Record<string, string> = {};

  // ─────────────────────────────────────────────────────────────────

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private campagneService: CampagneService
  ) {}

  // ── Ajouter la propriété ─────────────────────────────────────
isRHContext = false;

// ── Dans ngOnInit, lire le paramètre context ─────────────────
ngOnInit(): void {
  this.route.queryParams.subscribe(params => {

     if (params['error'] === 'entreprise-inactive') {
      this.globalError = 'Votre entreprise n\'est pas encore activée. Contactez l\'administrateur.';
    }



    // ── Contexte RH ou Admin ──────────────────────────────────
    if (params['context'] === 'rh') {
      this.isRHContext = true;
      this.signupData.role = 'RH_REGIONAL';   // ← pré-remplir le rôle
    } else {
      this.isRHContext = false;
      this.signupData.role = 'ADMIN';          // ← rôle admin par défaut
    }

    // ── Token reset depuis URL ────────────────────────────────
    if (params['token']) {
      this.resetData.token = params['token'];
      this.switchView('reset');
    }
  });

  // Charger régions & rôles
  this.authService.getRegions().subscribe({ next: d => this.regions = d, error: () => {} });
  this.authService.getRoles().subscribe({ next: d => this.roles = d, error: () => {} });

  // Restaurer email si rememberMe
  const saved = localStorage.getItem('adminEmail');
  if (saved) { this.loginData.email = saved; this.rememberMe = true; }
}

  // ── Navigation entre vues avec animation ─────────────────────────
  switchView(view: AuthView): void {
    if (this.currentView === view || this.isAnimating) return;
    this.isAnimating = true;
    this.clearAll();
    setTimeout(() => { this.currentView = view; this.isAnimating = false; }, 300);
  }

  // ════════════════════════════════════════════════════════════════
  // SIGNIN
  // ════════════════════════════════════════════════════════════════
  onLogin(): void {
  this.clearAll();
  if (!this.validateLogin()) return;
  this.isLoading = true;

  this.authService.signin(this.loginData).subscribe({
    next: (res) => {
      this.authService.setToken(res.token);

      if (this.rememberMe) {
        localStorage.setItem('adminEmail', this.loginData.email);
      } else {
        localStorage.removeItem('adminEmail');
      }

      this.isLoading = false;
      this.redirectByRole(res.token);   // ← déléguer la redirection
    },
    error: (err) => { this.isLoading = false; this.handleError(err); }
  });
}

private redirectByRole(token: string): void {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role: string = payload.role || payload.roles?.[0] || '';

    if (role === 'ADMIN') {
      this.router.navigate(['/admin']);

    } else if (role === 'RH_REGIONAL') {
      this.campagneService.getCampagnesActives().subscribe({
        next: (campagnes) => {
          if (campagnes && campagnes.length > 0) {
            // ── Naviguer avec campagneId en queryParam ──────────
            this.router.navigate(['/entreprise/saisonniers'], {
              queryParams: { campagneId: campagnes[0].id }
            });
          } else {
            this.globalError = 'Aucune campagne active. Contactez l\'administrateur.';
          }
        },
        error: () => {
          this.globalError = 'Impossible de vérifier les campagnes.';
        }
      });

    } else {
      this.router.navigate(['/home-ge']);
    }

  } catch {
    this.globalError = 'Erreur lors de la lecture du token.';
  }
}

  private validateLogin(): boolean {
    let ok = true;
    if (!this.loginData.email?.trim()) {
      this.errors['email'] = 'L\'adresse e-mail est requise.'; ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.loginData.email)) {
      this.errors['email'] = 'Adresse e-mail invalide.'; ok = false;
    }
    if (!this.loginData.password?.trim()) {
      this.errors['password'] = 'Le mot de passe est requis.'; ok = false;
    }
    return ok;
  }

  // ════════════════════════════════════════════════════════════════
  // SIGNUP
  // ════════════════════════════════════════════════════════════════
  onSignup(): void {
  this.clearAll();
  if (!this.validateSignup()) return;
  this.isLoading = true;

  this.authService.signup(this.signupData).subscribe({
    next: () => {
      this.isLoading = false;
      // Rediriger vers login avec message
      this.switchView('login');
      setTimeout(() => {
        this.globalSuccess = '✅ Compte créé ! Vérifiez votre e-mail pour activer votre compte, puis connectez-vous.';
      }, 320); // après l'animation switchView (300ms)
    },
    error: (err) => { this.isLoading = false; this.handleError(err); }
  });
}

  private validateSignup(): boolean {
  let ok = true;
  if (!this.signupData.nom?.trim())    { this.errors['nom']    = 'Nom requis.'; ok = false; }
  if (!this.signupData.prenom?.trim()) { this.errors['prenom'] = 'Prénom requis.'; ok = false; }
  if (!this.signupData.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.signupData.email)) {
    this.errors['signupEmail'] = 'E-mail invalide.'; ok = false;
  }
  if (!this.signupData.password || this.signupData.password.length < 6) {
    this.errors['signupPassword'] = 'Minimum 6 caractères.'; ok = false;
  }
  if (this.signupData.password !== this.signupConfirmPassword) {
    this.errors['confirmPassword'] = 'Les mots de passe ne correspondent pas.'; ok = false;
  }

  // ── Validation direction obligatoire pour RH ────────────────
  if (this.isRHContext && !this.signupData.regionId) {
    this.errors['regionId'] = 'Veuillez choisir votre direction régionale.'; ok = false;
  }

  return ok;
}

  // ════════════════════════════════════════════════════════════════
  // FORGOT PASSWORD
  // ════════════════════════════════════════════════════════════════
  onForgotPassword(): void {
    this.clearAll();
    if (!this.forgotData.email?.trim()) {
      this.errors['forgotEmail'] = 'Veuillez saisir votre adresse e-mail.'; return;
    }
    this.isLoading = true;

    this.authService.forgotPassword(this.forgotData).subscribe({
      next: () => {
        this.isLoading = false;
        this.forgotSent = true;
        this.globalSuccess = 'E-mail envoyé ! Consultez votre boîte de réception.';
      },
      error: (err) => { this.isLoading = false; this.handleError(err); }
    });
  }

  // ════════════════════════════════════════════════════════════════
  // RESET PASSWORD
  // ════════════════════════════════════════════════════════════════
  onResetPassword(): void {
    this.clearAll();
    if (!this.resetData.token?.trim())  { this.errors['resetToken'] = 'Token requis.'; return; }
    if (!this.resetData.newPassword || this.resetData.newPassword.length < 6) {
      this.errors['newPassword'] = 'Minimum 6 caractères.'; return;
    }
    this.isLoading = true;

    this.authService.resetPassword(this.resetData).subscribe({
      next: () => {
        this.isLoading = false;
        this.resetSuccess = true;
        this.globalSuccess = 'Mot de passe réinitialisé ! Redirection...';
        setTimeout(() => this.switchView('login'), 2500);
      },
      error: (err) => { this.isLoading = false; this.handleError(err); }
    });
  }

  // ════════════════════════════════════════════════════════════════
  // VERIFY TOKEN
  // ════════════════════════════════════════════════════════════════
  onVerifyToken(): void {
    this.clearAll();
    const token = this.verifyTokenValue.trim();
    if (!token) { this.errors['verifyToken'] = 'Token requis.'; return; }
    this.isLoading = true;
    this.verifyResult = 'idle';

    this.authService.verifyToken(token).subscribe({
      next: () => {
        this.isLoading = false;
        this.verifyResult = 'success';
        this.globalSuccess = 'Compte vérifié ! Vous pouvez maintenant vous connecter.';
        setTimeout(() => this.switchView('login'), 2800);
      },
      error: () => {
        this.isLoading = false;
        this.verifyResult = 'error';
        this.globalError = 'Token invalide ou expiré.';
      }
    });
  }

  // ── Utilitaires ──────────────────────────────────────────────────
  clearAll(): void { this.globalError = ''; this.globalSuccess = ''; this.errors = {}; }
  clearField(key: string): void { delete this.errors[key]; this.globalError = ''; }

  private handleError(err: any): void {
    const s = err?.status;
    if (s === 401 || s === 403) this.globalError = 'Identifiants incorrects.';
    else if (s === 409)         this.globalError = 'Un compte avec cet e-mail existe déjà.';
    else if (s === 0)           this.globalError = 'Impossible de joindre le serveur.';
    else                        this.globalError = err?.error?.message || 'Erreur inattendue.';
  }

  // Getters UI
  get viewTitle(): string {
    return { login: 'Connexion Admin', signup: 'Créer un compte',
             forgot: 'Mot de passe oublié', reset: 'Nouveau mot de passe',
             verify: 'Vérification du compte' }[this.currentView];
  }
  get viewSubtitle(): string {
    return {
      login:  'Accès réservé aux administrateurs autorisés',
      signup: 'Remplissez le formulaire pour créer votre accès',
      forgot: 'Recevez un lien de réinitialisation par e-mail',
      reset:  'Choisissez un nouveau mot de passe sécurisé',
      verify: 'Collez le token reçu par e-mail'
    }[this.currentView];
  }
}