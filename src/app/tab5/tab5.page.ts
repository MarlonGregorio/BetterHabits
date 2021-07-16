import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
})
export class Tab5Page implements OnInit {

  constructor(
    public ngFireAuth: AngularFireAuth,
  ) { }

  ngOnInit() {
  }

  initLogout()
  {
    this.ngFireAuth.signOut();
  }
}
