import { DataService } from './data.service';
import { StoreService } from './store.service';
import { Injectable, NgZone } from '@angular/core';
import { tileLayer, polygon, layerGroup, latLng, Map, geoJSON, polyline } from 'leaflet';
import { bboxPolygon } from '@turf/turf';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  map = undefined;
  lg = undefined;
  lgNewBbox = undefined;
  lgRouting = undefined;



  mapOption = {
    layers: [
      tileLayer('//{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
    ],
    zoom: 5,
    center: latLng(45, 5)
  };

  constructor(public store: StoreService, private zone: NgZone, public dataService: DataService) { }


  toBox(coords) {
    const minx = (coords[0][1] < coords[1][1]) ? coords[0][1] : coords[1][1];
    const maxx = (coords[0][1] > coords[1][1]) ? coords[0][1] : coords[1][1];
    const miny = (coords[0][0] < coords[1][0]) ? coords[0][0] : coords[1][0];
    const maxy = (coords[0][0] > coords[1][0]) ? coords[0][0] : coords[1][0];
    return [minx, miny, maxx, maxy];
  }

  onMapReady(map: Map) {
    this.map = map;
    this.lg = layerGroup([]);
    this.lgNewBbox = layerGroup([]);
    this.lgRouting = layerGroup([]);

    this.lg.addTo(this.map);
    this.lgNewBbox.addTo(this.map);
    this.lgRouting.addTo(this.map)


    this.map.on('click', e => {
      const ll = e.latlng;
      if (this.store.mode === 'addArea') {
        if (this.store.mapPointsNewArea.length === 0) {
          this.store.newAreaBbox = [];
          this.store.mapPointsNewArea.push([ll.lng, ll.lat]);
        } else if (this.store.mapPointsNewArea.length === 1) {
          this.store.mapPointsNewArea.push([ll.lng, ll.lat]);
          this.zone.run(() => {
            this.store.newAreaBbox = [...this.toBox(this.store.mapPointsNewArea)];
          });

          this.drawNewBoox(this.store.newAreaBbox);
        } else {
          this.store.newAreaBbox = [];
          this.store.mapPointsNewArea = [[ll.lng, ll.lat]];
        }
      } else if (this.store.mode === 'routing') {
        const c = [ll.lng, ll.lat];
        if (this.store.routing.coords.length === 0) {
          this.store.routing.coords.push(c)
        } else if (this.store.routing.coords.length === 1) {
          this.store.routing.coords.push(c);
          this.dataService.routing$(this.store.routing.areaName,
            this.store.routing.profil,
            this.store.routing.coords
          ).subscribe(result => {
            this.zone.run(() => {
              this.store.routing.result = result['routes'][0];
              this.drawIti(this.store.routing.result.geometry);
            });

          })
          // draw line
        } else {
          this.store.routing.coords = [];
          this.store.routing.coords.push(c);
        }

      }
    });
  }

  drawNewBoox(bbox) {
    this.map.removeLayer(this.lgNewBbox);
    this.lgNewBbox = layerGroup([]);
    const bbox_polygon = bboxPolygon(bbox);
    const coords: any = bbox_polygon.geometry.coordinates;
    const pol = polygon(coords)
    pol.setStyle({ color: 'red', fillOpacity: 0 });
    pol.addTo(this.lgNewBbox);
    this.lgNewBbox.addTo(this.map);

  }

  drawIti(featureGeom) {
    this.map.removeLayer(this.lgRouting);
    this.lgRouting = layerGroup([]);
    const coords: any = featureGeom.coordinates.map(c => [c[1], c[0]]);
    polyline(coords).addTo(this.lgRouting);

    this.lgRouting.addTo(this.map);

  }

  removeConsultBbox() {
    this.map.removeLayer(this.lg);
    this.lg = layerGroup([]);
  }

  removeNewBbox() {
    this.map.removeLayer(this.lgNewBbox);
    this.lgNewBbox = layerGroup([]);
  }
  removeRouting() {
    this.map.removeLayer(this.lgRouting);
    this.lgRouting = layerGroup([]);
  }

  removeAllLayerGroup() {
    this.removeNewBbox();
    this.removeConsultBbox();
    this.removeRouting();


  }
  drawMetaBboxs(metas) {
    this.map.removeLayer(this.lg);
    this.lg = layerGroup([]);

    for (const m of metas) {
      // geoJSON(m.bboxPolygon.geometry).addTo(this.lg);
      if (m.bboxPolygon) {
        const coords = m.bboxPolygon.geometry.coordinates;
        polygon(coords).addTo(this.lg);
      }
    }
    this.lg.addTo(this.map);
  }
}
