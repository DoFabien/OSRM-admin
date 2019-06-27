import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StoreService {

  meta = undefined;
  mode = 'consult';
  PROFILES = ['car', 'bus', 'foot', 'bicycle'];

  user =  {id: null, level: null, login: null, iat: null};

  mapPointsNewArea = [];
  newAreaBbox = [];
  processing = {isProcessing: false, areaName: undefined, profil: undefined};
  isDl =  { isDl: false, areaName: undefined};

  routing = {
    areaName: undefined,
    profil: undefined,
    coords: [],
    result: undefined
  };

  constructor() { }
}
