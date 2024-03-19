import './style.css';
import {Feature, Map, View} from 'ol';
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

proj4.defs("EPSG:31287","+proj=lcc +lat_0=47.5 +lon_0=13.3333333333333 +lat_1=49 +lat_2=46 +x_0=400000 +y_0=400000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs +type=crs");
proj4.defs('EPSG:3035', '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +towgs84=565.04,49.91,465.84,1.9848,-1.7439,9.0587,4.0772 +units=m +no_defs +type=crs')
register(proj4); 

let vectorLayer = new VectorLayer();


const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      //source: new OSM(),
      source : new XYZ({
        url : "https://mapproxy.rest-gdi.geo-data.space/tiles/osm/webmercator/{z}/{x}/{y}.png",
        maxZoom : 19
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


document.getElementById("openBtn").onclick = async function(e) {
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