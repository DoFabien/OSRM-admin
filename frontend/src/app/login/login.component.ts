import { StoreService } from './../services/store.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Component, OnInit, Inject } from '@angular/core';
import { DataService } from '../services/data.service';
import { CookieService } from 'ngx-cookie-service';
import * as jwt_decode from 'jwt-decode';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  login = '';
  password = '';
  errorMessage = undefined;

  constructor(
    public store: StoreService,
    private cookie: CookieService,
    public dataService: DataService,
    public dialogRef: MatDialogRef<LoginComponent>,
    ) { }

  ngOnInit() {
  }

  signIn(login, password) {
    this.dataService.login$(login, password)
      .subscribe(data => {
        if (!data['jwtToken']) {
          this.errorMessage = data['error']
        } else {
          this.errorMessage = undefined;
          const token = data['jwtToken'];
          const decodedToken = jwt_decode(token);
          this.cookie.set('OsrmAdmin', token);
          this.store.user = decodedToken;
          this.dialogRef.close();
        }
      });

  }

}
