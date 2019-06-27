import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { DataService } from './services/data.service';
import { Component, ViewChild, OnInit } from '@angular/core';
import { MapService } from './services/map.service';
import { tileLayer, latLng, Map } from 'leaflet';
import { bboxPolygon } from '@turf/turf';
import { StoreService } from './services/store.service';
import { map } from 'rxjs/operators';
import { MatDialog } from '@angular/material';
import { LoginComponent } from './login/login.component';
import { CookieService } from 'ngx-cookie-service';
import * as jwt_decode from 'jwt-decode';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { AddUserComponent } from './add-user/add-user.component';


import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {


  constructor(
    public dataService: DataService,
    public mapService: MapService,
    public store: StoreService,
    public dialog: MatDialog,
    private cookie: CookieService,

  ) {




  }




  ngOnInit() {
    const token = this.cookie.get('OsrmAdmin');
    if (token) {
      const decodedToken = jwt_decode(token);
      this.store.user = decodedToken;
    }

    // this.socket.emit('connection', 'dada');


    this.dataService.wsNewData$().subscribe(meta => {
      this.store.meta = meta;
      if (this.store.mode === 'consult') {
              this.mapService.drawMetaBboxs(meta);
            }
    });


    this.dataService.wsIsProcessing$().subscribe(res => {
      this.store.processing = res;
    });

    this.dataService.wsIsDl$().subscribe(res => {

      this.store.isDl = res;
    });

  }

  logout() {
    this.cookie.delete('OsrmAdmin');
    this.store.user = { id: null, level: null, login: null, iat: null }

  }

  openOpenstreetmap() {
    const zoom = this.mapService.map.getZoom();
    const center = this.mapService.map.getCenter();
    const url = `https://www.openstreetmap.org/#map=${zoom}/${center.lat}/${center.lng}`;
    window.open(url, '_blank');
  }

  onMapReady($event) {
    this.mapService.onMapReady($event);
    // const meta = this.getMeta();
  }

  changeMode(newMode: string) {
    this.store.mode = newMode;
    this.mapService.removeAllLayerGroup();
    if (newMode === 'consult') {
      this.mapService.drawMetaBboxs(this.store.meta);
    }

  }

  // getMeta() {
  //   this.dataService.getMeta$().subscribe(meta => {
  //     if (this.store.mode === 'consult') {
  //       this.mapService.drawMetaBboxs(meta);
  //     }
  //   });
  // }




  updateData(areaName) {
    const currentMeta = this.store.meta.filter(m => m.id === areaName)[0];

    this.dataService.updateOsmData$(areaName)
      .subscribe(data => {
        // console.log(data);
        // this.getMeta();
      });

  }

  deleteData(areaName) {
    this.dataService.deleteOsmData$(areaName)
      .subscribe(data => {

        // this.getMeta();
      });
  }
  deleteProfil(areaName, profil) {
    this.dataService.deleteProfil$(areaName, profil)
      .subscribe(data => {

        // this.getMeta();
      });
  }

  testDlOsmData(areaName, strBbox) {
    // const strBbox = '45.179673,5.732910,45.180535,5.738371';
    // const areaName = 'test2';
    this.dataService.newOsmData$(areaName, strBbox)
      .subscribe(data => {
        console.log(data);
      });
  }


  testRoutingMode(areaName: string, profil: string) {
    this.store.mode = 'routing';
    this.store.routing = {
      areaName: areaName,
      profil: profil,
      coords: [],
      result: undefined
    };
    // console.log(this.store.meta);
    const current = this.store.meta.filter(el => el.id === areaName)[0];
    console.log(current);
    this.mapService.removeAllLayerGroup();
    if (current.meta.type !== 'geofabrik'){
      this.zoomIn(current);

      this.mapService.drawNewBoox(current.meta.bbox)
    }
  }


  // testRouting() {
  //   this.dataService.routing$('test2', 'car', [[5.736247, 45.17814], [5.735071, 45.180550]])
  //     .subscribe(result => {
  //       console.log(result);
  //     });
  // }

  prepareData(areaName, profil) {

    this.dataService.prepareData$(areaName, profil).subscribe(result => {
      // console.log(result);
      // this.getMeta();
    });
  }


  zoomIn(e) {
    const b = e.meta.bbox;
    // e.meta.bbox
    this.mapService.map.fitBounds([[b[0], b[1]], [b[2], b[3]]]);
  }


  openLoginDialog() {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '250px',
      data: { name: 'dada' }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

  openChangePasswordDialog() {
    const dialogRef = this.dialog.open(ChangePasswordComponent, {
      width: '250px',
      data: { name: 'dada' }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

  openAddUserDialog() {
    const dialogRef = this.dialog.open(AddUserComponent, {
      width: '250px',
      data: { name: 'dada' }
    });
    dialogRef.afterClosed().subscribe(result => {

    });
  }

}
