import { DataService } from './../services/data.service';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit {
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';

  errorMessage = undefined;

  constructor(
    public dataService: DataService,
    public dialogRef: MatDialogRef<ChangePasswordComponent>) { }

  ngOnInit() {
  }

  changePassword(oldPassword, newPassword, confirmPassword) {
    if (oldPassword === '' || newPassword === '') {
      this.errorMessage = 'Hey, il faut mettre un password';
      return;
    }
    if (newPassword !== confirmPassword) {
      this.errorMessage = 'Les passwords ne correspondent pas';
      return;
    }

    this.dataService.changePassword$(oldPassword, newPassword)
      .subscribe(data => {

      })


  }

}
