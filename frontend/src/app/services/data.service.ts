import { bboxPolygon } from '@turf/turf';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { StoreService } from './store.service';
import { map } from 'rxjs/operators';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private socket;

  constructor(private http: HttpClient, public store: StoreService) {
    this.socket = io( {
      secure: true,
      rejectUnauthorized: false,
      path: '/Osrm-admin/api/ws/'
    });
  }



  routing$(areaName: string, profil: string, _coords: any[]) {
    // http://localhost:3000/routing/test/car/5.736247,45.17814;5.735071,45.180550

    let params = new HttpParams();
    const coords: string = _coords.map(c => c.join(',')).join(';');

    params = params.append('geometries', 'geojson');
    params = params.append('annotations', 'true');
    params = params.append('overview', 'full');
    return this.http
      .get(`./api/routing/${areaName}/${profil}/${coords}`, { params: params })
      .pipe(data => {
        return data;
      });
  }

  /* DATA */
  newOsmData$(areaName: string, bbox: string) {
    let body = new HttpParams();
    body = body.set('areaName', areaName);
    body = body.set('bbox', bbox);

    return this.http
      .post(`./api/data`, body)
      .pipe(data => {
        return data;
      });
  }

  newOsmDataFromPbf$(areaName: string, pbfUrl: string) {
    let body = new HttpParams();
    body = body.set('areaName', areaName);
    body = body.set('pbfurl', pbfUrl);

    return this.http
      .post(`./api/data/pbf`, body)
      .pipe(data => {
        return data;
      });

  }
  updateOsmData$(areaName: string) {
    let body = new HttpParams();
    body = body.set('areaName', areaName);

    return this.http
      .put(`./api/data`, body)
      .pipe(data => {
        return data;
      });
  }

  deleteOsmData$(areaName: string) {
    // http://localhost:3000/osmData/delete/test
    return this.http
      .delete(`./api/data/${areaName}`)
      .pipe(data => {
        return data;
      });
  }

  /* Profils */
  // add / update
  prepareData$(areaName: string, profil: string) {
    let body = new HttpParams();
    body = body.set('areaName', areaName);
    body = body.set('profil', profil);

    return this.http
      .put(`./api/profil/`, body)
      .pipe(data => {
        return data;
      });
  }

  deleteProfil$(areaName: string, profil: string) {
    return this.http
      .delete(`./api/profil/${areaName}/${profil}`)
      .pipe(data => {
        return data;
      });
  }


  // auth
  login$(login: string, password: string) {
    let params = new HttpParams();
    params = params.append('login', login);
    params = params.append('password', password);
    return this.http
      .get(`./api/auth/login`, { params: params })
      .pipe(data => {
        return data;
      });
  }

  changePassword$(oldPassword: string, newPassword: string) {
    let body = new HttpParams();
    body = body.set('oldPassword', oldPassword);
    body = body.set('newPassword', newPassword);

    return this.http
      .put(`./api/auth/password`, body)
      .pipe(data => {
        return data;
      });
  }

  addUser$(login, level, password) {
    let body = new HttpParams();
    body = body.set('login', login);
    body = body.set('level', level);
    body = body.set('password', password);

    return this.http
      .post(`./api/user`, body)
      .pipe(data => {
        return data;
      });
  }


  // WS
  getMessages$ = () => {
    return Observable.create((observer) => {
      this.socket.on('new-message', (message) => {
        observer.next(message);
      });
    });
  }
  wsIsProcessing$ = () => {
    return Observable.create((observer) => {
      this.socket.on('isProcessing', (message) => {
        observer.next(message);
      });
    });
  }

  wsIsDl$ = () => {
    return Observable.create((observer) => {
      this.socket.on('dl', (message) => {
        observer.next(message);
      });
    });
  }

  wsNewData$ = () => {
    return Observable.create((observer) => {
      this.socket.on('newData', (message) => {
        observer.next(message);
      });
    })
      .pipe(
        map(meta => {
          const m = [];
          // tslint:disable-next-line:forin
          for (const areaName in meta) {
            // url => overpass api
            const bboxPol = meta[areaName].meta.url ? null : bboxPolygon(meta[areaName].meta.bbox);
            m.push({ id: areaName, bboxPolygon: bboxPol, ...meta[areaName] });
          }
          this.store.meta = m;
          return m.reverse();
        })
      );
  }

}
