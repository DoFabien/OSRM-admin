import { StoreService } from './../services/store.service';
import { Component, OnInit } from '@angular/core';
import { MapService } from '../services/map.service';

@Component({
  selector: 'app-routing',
  templateUrl: './routing.component.html',
  styleUrls: ['./routing.component.scss']
})
export class RoutingComponent implements OnInit {


  constructor( public store: StoreService, public mapService:MapService) { }

  ngOnInit() {
  }



  cancel() {
    this.store.newAreaBbox = [];
    this.store.mapPointsNewArea = [];
    this.mapService.removeAllLayerGroup();
    this.store.mode = 'consult';
    if (this.store.mode === 'consult') {
      this.mapService.drawMetaBboxs(this.store.meta);
    }

  }
}
