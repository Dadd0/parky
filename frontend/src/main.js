import '../style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import {useGeographic} from 'ol/proj.js';
import {getLocation} from "./location.js"

useGeographic();

const coords = [12.4829321, 41.8933203]

const markerFeature = new Feature({
  geometry: new Point(coords)
});

const markerLayer = new VectorLayer({
  source: new VectorSource({
    features: [markerFeature]
  }),
  style: new Style({
    image: new CircleStyle({
      radius: 9,
      fill: new Fill({ color: '#0078fc' }),
      stroke: new Stroke({ color: '#ffffff', width: 3 })
    })
  })
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    markerLayer
  ],
  view: new View({
    center: coords,
    zoom: 20
  })
});

getLocation().then((location) => {
  if (!location) return;

  map.getView().setCenter(location);
  markerFeature.getGeometry().setCoordinates(location);
})
