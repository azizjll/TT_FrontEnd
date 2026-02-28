import { Component, AfterViewInit, OnInit } from '@angular/core';
import { AuthService, SignupRequest, SigninRequest, Region } from 'src/app/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements AfterViewInit, OnInit {

  signinData: SigninRequest = { email: '', password: '' };
  signupData: SignupRequest = { nom: '', prenom: '', email: '', password: '', cin: '', telephone: '', role: '', regionId: undefined };
  message: string = '';

  roles: string[] = [];
  regions: Region[] = [];

  forgotMode: boolean = false;
forgotEmail: string = '';

resetMode: boolean = false;
resetToken: string = '';
newPassword: string = '';

constructor(private authService: AuthService,
            private route: ActivatedRoute,
            private router: Router) {}

  ngOnInit(): void {
  this.authService.getRoles().subscribe(res => this.roles = res);
  this.authService.getRegions().subscribe(res => this.regions = res);

  // Vérifier si l'utilisateur vient d'un lien reset password
  this.route.queryParams.subscribe(params => {
    const token = params['token'];
    if (token) {
      this.resetMode = true;
      this.resetToken = token;
      this.forgotMode = false; // cacher le formulaire email
      // basculer la vue login vers reset
      const container = document.getElementById('container');
      container?.classList.remove("right-panel-active");
    }
  });
}

  ngAfterViewInit(): void {
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.getElementById('container');

    signUpButton?.addEventListener('click', () => {
      container?.classList.add("right-panel-active");
    });

    signInButton?.addEventListener('click', () => {
      container?.classList.remove("right-panel-active");
    });
  }

  toggleForgot() {
  this.forgotMode = !this.forgotMode;
  this.message = '';
}

onForgotPassword() {
  if (!this.forgotEmail) {
    this.message = 'Veuillez saisir votre email';
    return;
  }

  this.authService.forgotPassword({ email: this.forgotEmail }).subscribe({
    next: () => {
      this.message = 'Un email de réinitialisation a été envoyé.';
      this.forgotMode = false;
    },
    error: (err) => {
      this.message = 'Erreur lors de l\'envoi';
      console.error(err);
    }
  });
}



  onSignin() {
    this.authService.signin(this.signinData).subscribe({
      next: (res) => {
  localStorage.setItem('token', res.token);
  this.message = 'Connexion réussie !';
      },
      error: (err) => {
        this.message = 'Email ou mot de passe incorrect';
        console.error(err);
      }
    });
  }

  onSignup() {
    this.authService.signup(this.signupData).subscribe({
      next: (res) => this.message = 'Inscription réussie ! Vérifiez votre email.',
      error: (err) => {
        this.message = 'Erreur lors de l\'inscription';
        console.error(err);
      }
    });
  }
  onResetPassword() {
  if (!this.newPassword) {
    this.message = 'Veuillez saisir un nouveau mot de passe';
    return;
  }

  this.authService.resetPassword({ token: this.resetToken, newPassword: this.newPassword })
    .subscribe({
      next: () => {
        this.message = 'Mot de passe réinitialisé ! Redirection vers login...';
        setTimeout(() => {
          this.resetMode = false;
          this.resetToken = '';
          this.newPassword = '';
          this.router.navigate(['/login']); // redirige vers login
        }, 2000);
      },
      error: err => {
        this.message = 'Erreur lors de la réinitialisation';
        console.error(err);
      }
    });
}
}