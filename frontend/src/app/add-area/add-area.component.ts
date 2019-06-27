import { MapService } from './../services/map.service';
import { Component, OnInit } from '@angular/core';
import { StoreService } from '../services/store.service';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-add-area',
  templateUrl: './add-area.component.html',
  styleUrls: ['./add-area.component.scss']
})
export class AddAreaComponent implements OnInit {
  newAreaName = '';

  surface = undefined;
  pbfUrl = '';

  constructor(public store: StoreService,
    public dataService: DataService,
    public mapService: MapService) { }

  ngOnInit() {
  }


  dlOsmDataFromCurrentBbox(areaName) {
    const bbox = this.store.newAreaBbox;
    if (bbox.length !== 4) {
      return;
    }
    // loading
    this.dataService.newOsmData$(areaName, bbox.join(','))
      .subscribe(data => {
        this.store.mode = 'consult';

      });
  }

  dlOsmDataFromPbfUrl(areaName, pbfUrl) {
    this.dataService.newOsmDataFromPbf$(areaName, pbfUrl)
      .subscribe(data => {
        this.store.mode = 'consult';

      });
  }

  cancel() {
    this.store.newAreaBbox = [];
    this.store.mapPointsNewArea = [];
    this.mapService.removeNewBbox();
    this.store.mode = 'consult';
    if (this.store.mode === 'consult') {
      this.mapService.drawMetaBboxs(this.store.meta);
    }

  }
}
