import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage implements OnInit {

  email = "";
  error_log = "";
  notification = "";

  constructor(private router: Router,
    public ngFireAuth: AngularFireAuth) { }

  ngOnInit() {
  }

  async initReset()
  {
    this.error_log = "";
    this.notification = "";
    await this.ngFireAuth.sendPasswordResetEmail(this.email).then(() =>
    {
      this.notification = "Email sent successfully.";
    }).catch((error) =>
    {
      this.error_log = error.message;
    });
  }

  initReturn()
  {
    this.router.navigate(['/login']);
  }
}
