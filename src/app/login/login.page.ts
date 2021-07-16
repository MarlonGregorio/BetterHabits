import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  user = {
    email: "",
    password: "",
    error_log: "",
  }

  constructor(
    private router: Router,
    public ngFireAuth: AngularFireAuth,
    ) { }

  ngOnInit() {
  }

  async initLogin()
  {
    await this.ngFireAuth.signInWithEmailAndPassword(this.user.email, this.user.password).then((user) =>
    {
      if(user.user.email)
      {
        this.router.navigate(['/home/tab1']);
      }
      else
      {
        alert('login failed!');
      }
    }).catch((error) =>
    {
      this.user.error_log = error.message;
    });
  }

  async initRegister()
  {
    await this.ngFireAuth.createUserWithEmailAndPassword(this.user.email, this.user.password).then((user) =>
    {
      if(user.user.email)
      {
        this.router.navigate(['/home']);
      }
      else
      {
        alert('registration failed');
      }
    }).catch((error) =>
    {
      this.user.error_log = error.message;
    });
  }

  initForgot()
  {
    this.router.navigate(['/forgot-password']);
  }
}
