import '../style.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Circle, Fill, Stroke, Style, Icon } from 'ol/style';
import { useGeographic } from 'ol/proj';

useGeographic();

const $ = id => document.getElementById(id);
const parkBtn = $('parkBtn');
const carBtn = $('carBtn');
const carName = $('carName');
const sheet = $('sheet');
const sheetBg = $('sheetBg');
const carList = $('carList');
const status = $('status');
const CAR_SVG = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="#ffffff" stroke="#2B2A2A" stroke-width="2"/><path fill="#2B2A2A" transform="translate(6,6)" d="M6 19v1q0 .425-.288.713T5 21H4q-.425 0-.712-.288T3 20v-8l2.1-6q.15-.45.538-.725T6.5 5h11q.475 0 .863.275T18.9 6l2.1 6v8q0 .425-.287.713T20 21h-1q-.425 0-.712-.288T18 20v-1zm-.2-9h12.4l-1.05-3H6.85zm1.7 6q.625 0 1.063-.437T9 14.5t-.437-1.062T7.5 13t-1.062.438T6 14.5t.438 1.063T7.5 16m9 0q.625 0 1.063-.437T18 14.5t-.437-1.062T16.5 13t-1.062.438T15 14.5t.438 1.063T16.5 16"/></svg>')}`;

let selectedCar = JSON.parse(localStorage.getItem('selectedCar'));
let cars = [];

const marker = new Feature();
const carSource = new VectorSource();
const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({ source: new OSM() }),
    new VectorLayer({
      source: new VectorSource({ features: [marker] }),
      style: new Style({
        image: new Circle({
          radius: 10,
          fill: new Fill({ color: '#e84545' }),
          stroke: new Stroke({ color: '#fff', width: 3 })
        })
      })
    }),
    new VectorLayer({
      source: carSource,
      style: new Style({
        image: new Icon({
          src: CAR_SVG,
          scale: 1.5,
          anchor: [0.5, 0.5]
        })
      })
    })
  ],
  view: new View({ center: [0, 0], zoom: 2 })
});

navigator.geolocation.getCurrentPosition(
  pos => map.getView().animate({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 17, duration: 500 }),
  () => {},
  { enableHighAccuracy: true }
);

async function loadCars() {
  try {
    const resp = await fetch('/api/cars');
    cars = await resp.json();
    renderCarList();
    renderCarMarkers();
    if (selectedCar && cars.find(c => c.id === selectedCar.id)) {
      updateSelectedCar(selectedCar);
    }
  } catch {
    status.textContent = 'Failed to load vehicles';
  }
}

function renderCarList() {
  carList.innerHTML = cars.map(c =>
    `<li data-id="${c.id}" class="${selectedCar?.id === c.id ? 'selected' : ''}">${c.name.toUpperCase()}</li>`
  ).join('');
}

function renderCarMarkers() {
  const features = cars
    .filter(c => c.latitude && c.longitude)
    .map(c => new Feature({
      geometry: new Point([c.longitude, c.latitude]),
      carId: c.id
    }));
  carSource.clear();
  carSource.addFeatures(features);
}

function updateSelectedCar(car) {
  selectedCar = car;
  localStorage.setItem('selectedCar', JSON.stringify(car));
  carName.textContent = car.name.toUpperCase();
  parkBtn.disabled = false;
  renderCarList();
}

carBtn.onclick = () => sheet.classList.remove('hidden');
sheetBg.onclick = () => sheet.classList.add('hidden');

carList.onclick = e => {
  const li = e.target.closest('li');
  if (!li) return;
  const car = cars.find(c => c.id === +li.dataset.id);
  if (car) {
    updateSelectedCar(car);
    sheet.classList.add('hidden');
  }
};

parkBtn.onclick = async () => {
  if (!selectedCar) return;

  parkBtn.classList.add('loading');
  parkBtn.classList.remove('done');
  status.textContent = '';

  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true })
    );

    const { latitude, longitude } = pos.coords;

    const resp = await fetch('/api/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ car_id: selectedCar.id, latitude, longitude })
    });

    if (!resp.ok) throw new Error('Save failed');

    marker.setGeometry(new Point([longitude, latitude]));
    const idx = cars.findIndex(c => c.id === selectedCar.id);
    if (idx != -1) {
      cars[idx].latitude = latitude;
      cars[idx].longitude = longitude;
      renderCarMarkers();
    }
    map.getView().animate({ center: [longitude, latitude], zoom: 18, duration: 400 });

    parkBtn.classList.add('done');
    status.textContent = `${selectedCar.name.toUpperCase()} parked`;
  } catch (e) {
    status.textContent = e.message || 'Location unavailable';
  } finally {
    parkBtn.classList.remove('loading');
  }
};

loadCars();
