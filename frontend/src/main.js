import '../style.css';
import { Map, View, Overlay } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Circle, Fill, Stroke, Style, Icon, Text } from 'ol/style';
import { useGeographic } from 'ol/proj';

useGeographic();

const $ = id => document.getElementById(id);
const parkBtn = $('parkBtn');
const rollbackBtn = $('rollbackBtn');
const carBtn = $('carBtn');
const carName = $('carName');
const sheet = $('sheet');
const sheetBg = $('sheetBg');
const carList = $('carList');
const status = $('status');
const popupContainer = $('popup');
const popupContent = $('popup-content');
const popupCloser = $('popup-closer');
const userBtn = $('userBtn');
const userSheet = $('userSheet');
const userSheetBg = $('userSheetBg');
const userName = $('userName');
const userIp = $('userIp');
const userAvatar = $('userAvatar');

const setupSheet = $('setupSheet');
const setupSheetBg = $('setupSheetBg');
const userRegisterForm = $('userRegistrationForm');
const registerName = $('registerName');
const registerBtn = $('registerBtn');
const setupError = $('setupError');

const addCarSheet = $('addCarSheet');
const addCarSheetBg = $('addCarSheetBg');
const addCarForm = $('addCarForm');
const newCarName = $('newCarName');
const addCarBtn = $('addCarBtn');
const addCarError = $('addCarError');
const addNewCarBtn = $('addNewCarBtn');

let currentUser = null;

const overlay = new Overlay({
  element: popupContainer,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});

popupCloser.onclick = function () {
  overlay.setPosition(undefined);
  popupCloser.blur();
  return false;
};

const CAR_SVG = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="17" fill="#222222" stroke="#ffffff" stroke-width="2"/><path fill="#ffffff" transform="translate(6,6)" d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>')}`;

let selectedCar = JSON.parse(localStorage.getItem('selectedCar'));
let cars = [];

const marker = new Feature();
const carSource = new VectorSource();
const map = new Map({
  target: 'map',
  overlays: [overlay],
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
      style: feature => new Style({
        image: new Icon({
          src: CAR_SVG,
          scale: 1.5,
          anchor: [0.5, 0.5]
        }),
        text: new Text({
          text: feature.get('name') ? feature.get('name').toUpperCase() : '',
          offsetY: 28,
          font: 'bold 12px sans-serif',
          fill: new Fill({ color: '#222' }),
          stroke: new Stroke({ color: '#fff', width: 3 }),
          backgroundFill: new Fill({ color: 'rgba(255, 255, 255, 0.7)' }),
          padding: [2, 5, 2, 5]
        })
      })
    })
  ],
  view: new View({ center: [0, 0], zoom: 2 })
});

map.on('singleclick', function (evt) {
  const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
    return feature;
  });

  if (feature && feature.get('carId')) {
    const coordinates = feature.getGeometry().getCoordinates();
    const name = feature.get('name').toUpperCase();
    const parkedBy = feature.get('parkedBy') || 'Unknown';
    const parkedAt = feature.get('parkedAt') ? new Date(feature.get('parkedAt')).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'Unknown';
    
    popupContent.innerHTML = `<h3>${name}</h3><p>Parked by: ${parkedBy}</p><p>Time: ${parkedAt}</p>`;
    overlay.setPosition(coordinates);
  } else {
    overlay.setPosition(undefined);
  }
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
      carId: c.id,
      name: c.name,
      parkedBy: c.parked_by,
      parkedAt: c.parked_at
    }));
  carSource.clear();
  carSource.addFeatures(features);
}
  
function updateSelectedCar(car) {
  selectedCar = car;
  localStorage.setItem('selectedCar', JSON.stringify(car));
  carName.textContent = car.name.toUpperCase();
  parkBtn.disabled = false;
  rollbackBtn.disabled = false;
  renderCarList();
}

function toggleMenu(show) {
  if (show) {
    sheet.classList.remove('hidden');
    parkBtn.classList.add('hidden');
    rollbackBtn.classList.add('hidden');
    userBtn.classList.add('hidden');
  } else {
    sheet.classList.add('hidden');
    parkBtn.classList.remove('hidden');
    rollbackBtn.classList.remove('hidden');
    userBtn.classList.remove('hidden');
  }
}

function toggleUserSheet(show) {
  if (show) {
    userSheet.classList.remove('hidden');
    parkBtn.classList.add('hidden');
    rollbackBtn.classList.add('hidden');
    carBtn.classList.add('hidden');
  } else {
    userSheet.classList.add('hidden');
    parkBtn.classList.remove('hidden');
    rollbackBtn.classList.remove('hidden');
    carBtn.classList.remove('hidden');
  }
}

function showSetupSheet() {
  setupSheet.classList.remove('hidden');
  parkBtn.classList.add('hidden');
  rollbackBtn.classList.add('hidden');
  carBtn.classList.add('hidden');
  userBtn.classList.add('hidden');
}

function showAddCarSheet() {
  addCarSheet.classList.remove('hidden');
}

function hideSetupSheet() {
  setupSheet.classList.add('hidden');
  parkBtn.classList.remove('hidden');
  rollbackBtn.classList.remove('hidden');
  carBtn.classList.remove('hidden');
  userBtn.classList.remove('hidden');
}

function hideAddCarSheet() {
  addCarSheet.classList.add('hidden');
}

async function loadUser() {
  try {
    const resp = await fetch('api/whoami');
    if (resp.ok) {
      const data = await resp.json();
      if (data.known) {
        userName.textContent = data.name.charAt(0).toUpperCase() + data.name.slice(1);
        userAvatar.textContent = data.name.charAt(0).toUpperCase();
      } else {
        userName.textContent = 'Unknown User';
        userAvatar.textContent = '?';
      }
    } else {
      userName.textContent = 'Unknown User';
      userIp.textContent = 'Not authenticated';
      userAvatar.textContent = '?';
    }
  } catch {
    userName.textContent = 'Unknown User';
    userIp.textContent = 'Connection error';
    userAvatar.textContent = '?';
  }
}

async function checkUser() {
  try {
    const resp = await fetch("/api/whoami");
    return await resp.json();
  } catch {
    return {known: false, client_ip: null};
  }
}

carBtn.onclick = () => toggleMenu(true);
sheetBg.onclick = () => toggleMenu(false);

carList.onclick = e => {
  const li = e.target.closest('li');
  if (!li) return;
  const car = cars.find(c => c.id === +li.dataset.id);
  if (car) {
    updateSelectedCar(car);
    toggleMenu(false);
    if (car.latitude && car.longitude) {
      map.getView().animate({center: [car.longitude, car.latitude], zoom: 18, duration: 400})
    } else {
      navigator.geolocation.getCurrentPosition(
        pos => map.getView().animate({center: [pos.coords.longitude, pos.coords.latitude], zoom:17, duration: 400}),
        () => {},
        {enableHighAccuracy: true}
      );
    }
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
    if (resp.status === 403) throw new Error("Unknown user");
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

rollbackBtn.onclick = async () => {
  if (!selectedCar) return;
  rollbackBtn.classList.add('loading');
  status.textContent = '';

  try {
    const resp = await fetch(`/api/cars/${selectedCar.id}/rollback`)
    if (!resp.ok) throw new Error("Rollback failed");

    await loadCars();

    const car = cars.find(c => c.id === selectedCar.id);
    if (car?.latitude && car?.longitude) {
      map.getView().animate({center: [car.longitude, car.latitude], zoom: 18, duration: 400});
    }
  } catch (e) {
    status.textContent = e.message || "Rollback failed";
  } finally {
    rollbackBtn.classList.remove('loading');
  }
};
userBtn.onclick = () => {
  loadUser();
  toggleUserSheet(true);
};

userSheetBg.onclick = () => toggleUserSheet(false);

userRegisterForm.onsubmit = async (e) => {
  e.preventDefault();
  setupError.textContent = '';
  registerBtn.disabled = true;

  try {
    const resp = await fetch('/api/users', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: registerName.value.trim()})
    });

    if (!resp.ok) {
      const data = await resp.json();
      throw new Error(data.detail || "Registration Failed");
    }

    currentUser = await checkUser();
    hideSetupSheet();
    await loadCars();
    await loadUser();

    if (cars.length === 0) {
      showAddCarSheet();
    }
  } catch (err) {
    setupError.textContent = err.message;
  } finally {
    registerBtn.disabled = false;
  }
};

addCarForm.onsubmit = async (e) => {
  e.preventDefault();
  addCarError.textContent = '';
  addCarBtn.disabled = true;

  try {
    const resp = await fetch('/api/cars', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: newCarName.value.trim()})
    });

    if (!resp.ok) {
      const data = await resp.json();
      throw new Error(data.detail || "Failed to add Vehicle");
    }

    await loadCars();
    hideAddCarSheet();
    newCarName.value = '';

    if (cars.length === 1) {
      updateSelectedCar(cars[0]);
    }
  } catch (err) {
    addCarError.textContent = err.message;
  } finally {
    addCarBtn.disabled = false;
  }
};

addNewCarBtn.onclick = () => {
  toggleMenu(false);
  showAddCarSheet();
}

addCarSheetBg.onclick = () => hideAddCarSheet();

async function init() {
  const whoami = await checkUser();

  if (!whoami.known) {
    showSetupSheet();
    return;
  }
  currentUser = whoami;
  await loadCars();
  await loadUser();

  if (cars.length === 0) {
    showAddCarSheet();
  }
}

init();
