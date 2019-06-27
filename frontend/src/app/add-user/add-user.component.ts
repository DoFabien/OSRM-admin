import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit {

  login = '';
  level: number = undefined;
  password = '';
  errorMessage = '';

  constructor(public dataService : DataService) { }

  ngOnInit() {
  }

  addUser(login, level, password){
    this.dataService.addUser$(login, level, password)
      .subscribe(data => {
        console.log(data);
      });

  }

}
