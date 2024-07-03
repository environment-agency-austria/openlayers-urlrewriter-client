import {Feature, Map, Overlay, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON.js';
import  proj4  from 'proj4/dist/proj4';
import { register } from 'ol/proj/proj4';
import { Circle } from 'ol/geom';
import TileSource from 'ol/source/Tile';
import XYZ from 'ol/source/XYZ';
import * as olProj from 'ol/proj'
import QRCode from 'qrcode'
import { Html5QrcodeScanner } from 'html5-qrcode';
import { openDB, deleteDB, wrap, unwrap } from 'idb';

proj4.defs("EPSG:31287","+proj=lcc +lat_0=47.5 +lon_0=13.3333333333333 +lat_1=49 +lat_2=46 +x_0=400000 +y_0=400000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs +type=crs");
proj4.defs("EPSG:3035","+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");
register(proj4); 

let vectorLayer = new VectorLayer();

const idb = await openDB('hofapp', 3, {
  upgrade(db, oldVersion, newVersion, transaction, event) {
    if(db.objectStore(imgs)) {
      db.deleteObjectStore('imgs');
    }
    const imgStore = db.createObjectStore('imgs',  { keyPath: 'url' });
    imgStore.createIndex("url", "url");
  }
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source : new XYZ({
        url : "https://mapproxy.rest-gdi.geo-data.space/tiles/osm/webmercator/{z}/{x}/{y}.png",
        maxZoom : 19,
        tileLoadFunction : async function(imageTile, src) {
          const img = imageTile.getImage();

          const imgStore = idb.transaction('imgs', 'readonly').objectStore('imgs');
          const imgUrlIdx = imgStore.index('url');
          const range = IDBKeyRange.only(src);

          const cursor = await imgUrlIdx.openCursor(range);
          if(cursor) {
            console.log("laoding cached tile: " + src)
            img.src = cursor.value.data;  
          } else {
            console.log("requesting tile: " + src)

            img.src = src;
            
            const response = await fetch(src);
            const blobResp = await response.blob();
            const reader = new FileReader();
            reader.onload = e => {
              const imgStore = idb.transaction('imgs', 'readwrite').objectStore('imgs');
              imgStore.put({url : src, data : reader.result});
            }
            reader.readAsDataURL(blobResp);
          }
        }
      })
    }),
    vectorLayer
  ],
  view: new View({
    center: [401306 , 423398],
    zoom: 8,
    projection: 'EPSG:31287'
  })
});

// In case a previous map state is found in localStorage, restore it
const center = localStorage.getItem('center');
const zoom = localStorage.getItem('zoom');
if(center) {
  map.getView().setCenter(JSON.parse(center));
}
if(zoom) {
  map.getView().setZoom(JSON.parse(zoom));
}

map.getView().on('change', e => {
  const center = map.getView().getCenter();
  const zoom = map.getView().getZoom();
  localStorage.setItem('center', JSON.stringify(center)); 
  localStorage.setItem('zoom', JSON.stringify(zoom)); 
  //const tx = idb.transaction(['toDoList'], 'readwrite');
})


const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

const scanBtn = document.getElementById("scanBtn");
const openBtn = document.getElementById("openBtn");
const idField = document.getElementById("identifierInput");

  const overlay = new Overlay({
    element: container,
    autoPan: {
      animation: {
        duration: 250,
      },
    },
  });
  map.addOverlay(overlay)


  map.on('click', async function(evt) {
    map.forEachFeatureAtPixel(evt.pixel,
      async function(feature, layer) {
        //if(layer === vectorLayer) 
        {
          const id = feature.getProperties()["identifier"].value;
          const codeImg = await QRCode.toDataURL(id);

          const coordinate = evt.coordinate;
          content.innerHTML = `<img src=${codeImg}></img>`;
          overlay.setPosition(coordinate);
        }
      })
  });


    /**
   * Add a click handler to hide the popup.
   * @return {boolean} Don't follow the href.
   */
    closer.onclick = function() {
      overlay.setPosition(undefined);
      closer.blur();
      return false;
    };
    
    function onScanFailure(error) {
      // handle scan failure, usually better to ignore and keep scanning.
      // for example:
      //console.warn(`Code scan error = ${error}`);
    }

    scanBtn.onclick = async function(e) {
      let html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: {width: 350, height: 350} },
        /* verbose= */ false);


      html5QrcodeScanner.render((decodedText, decodedResult) => {
        console.log(`Code matched = ${decodedText}`, decodedResult);

        html5QrcodeScanner.clear();
        idField.value = decodedText;
        openBtn.click();
      }, onScanFailure);
    }


openBtn.onclick = async function(e) {
  const identifier = document.getElementById("identifierInput").value;
  //const idParts = identifier.split(".");
  //const resultBody = await fetch("https://rewriter.rest-gdi.geo-data.space/" + idParts[1] + "/" + idParts[2] + "." + idParts[3] + "/" + idParts[4] + "/" + idParts[5] + "?outputFormat=application%2Fjson");
  let resultBody = null;
  try {
     resultBody = await fetch(identifier + "?outputFormat=application%2Fjson&srsName=epsg%3A31287");
  }catch(e) {
  }

  if(resultBody === null || !resultBody.ok) {
    alert("Fehler beim Auflösen des Identifiers");
    return;
  }

  const json = await resultBody.json();
  
  map.removeLayer(vectorLayer);

  let projection = {};
  try {
    const crsName = json["crs"]["properties"]["name"];
    projection = {dataProjection: crsName, featureProjection : 'EPSG:31287'};
  }catch(e){}


  const ft = new GeoJSON().readFeatures(json, projection)

  vectorLayer = new VectorLayer({
    source: new VectorSource({
      features : ft
    }),
    declutter : true
  });
  
  map.addLayer(vectorLayer);

  let bounds = [json.bbox[1], json.bbox[0],json.bbox[3], json.bbox[2]];
  if(projection.dataProjection) {
    bounds = olProj.transformExtent(bounds, projection.dataProjection, 'EPSG:31287');
  }
  map.getView().fit(bounds);
};