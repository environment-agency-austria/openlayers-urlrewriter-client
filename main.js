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
import { Html5QrcodeScanner } from 'html5-qrcode';
import FileSaver from 'file-saver';
import { downloadFileFromWFS, fetchWfsFileMetadata } from './wfs_file_store';
import { feature_id_property, file_wfs_name, geoserver_address } from './config';
import { renderFeatureInfoPanel } from './info_panel';

proj4.defs("EPSG:31287","+proj=lcc +lat_0=47.5 +lon_0=13.3333333333333 +lat_1=49 +lat_2=46 +x_0=400000 +y_0=400000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs +type=crs");
proj4.defs("EPSG:3035","+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");
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
   // projection: 'EPSG:31287'
  })
});


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
          const coordinate = evt.coordinate;

          const rows = await renderFeatureInfoPanel(feature);
          content.innerHTML = "<table>" + rows + '</table><br><div id="filearea"/>';
          overlay.setPosition(coordinate);

          const fid = feature.get(feature_id_property);
          const fileTable = await createFileContents(fid,  document.getElementById("filearea"));
        }
      })
  });




  async function createFileContents(id, parentElement) {
    let files = await fetchWfsFileMetadata(geoserver_address, file_wfs_name, 'gast', 'gast', id);
   
    if(files.length > 0) {
      const content = document.createElement("div");
      parentElement.appendChild(content);

      content.innerHTML = `
      <div style="margin-top: 10px"><b>Dateien:</b></div>
      <table id="fileTable" class="fileTable"> 
      <tr>
      <th align=left>Dateiname</th>
      <th align=left></th>
      </tr>
      </table>`;
    
      const table = document.getElementById("fileTable");
      for(let file of files) {
        const trFile = document.createElement("tr");
        table.append(trFile);
    
        const tdLink = document.createElement("td");
        trFile.append(tdLink);
        const downloadLink = document.createElement("a");
        downloadLink.innerText = `${file.filename} (${file.filesize})`;
        downloadLink.setAttribute("href", "#");
        downloadLink.onclick = async e => { 
          const data = await downloadFileFromWFS(geoserver_address, file_wfs_name, 'gast', 'gast', file.filename); 
          // if(file.filename.endsWith(".jpg") || file.filename.endsWith(".jpeg")) {


          // } else {

          // }
          FileSaver.saveAs(data, file.filename, 'application/octet_stream');
          e.preventDefault(); 
        }
        tdLink.appendChild(downloadLink);
    
        const tdDelete = document.createElement("td");
        trFile.append(tdDelete);
      }
    }
  }


    /**
   * Add a click handler to hide the popup.
   * @return {boolean} Don't follow the href.
   */
    closer.onclick = function() {
      overlay.setPosition(undefined);
      closer.blur();
      return false;
    };

    document.getElementById("readerbase").style.visibility='hidden';
    scanBtn.onclick = async function(e) {
      document.getElementById("readerbase").style.visibility='visible';

      let html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: {width: 500, height: 500} },
        /* verbose= */ true);

      html5QrcodeScanner.render((decodedText, decodedResult) => {
        console.log(`Code matched = ${decodedText}`, decodedResult);

        document.getElementById("readerbase").style.visibility='hidden';
        html5QrcodeScanner.clear();
        idField.value = decodedText;
        openBtn.click();
      }, e => {
        document.getElementById("html5-qrcode-button-camera-stop").onclick = e => {
          html5QrcodeScanner.clear();
          document.getElementById("readerbase").style.visibility='hidden';}
      });
    }

   // scanBtn.click();


openBtn.onclick = async function(e) {
  const identifier = document.getElementById("identifierInput").value;
  //const idParts = identifier.split(".");
  //const resultBody = await fetch("https://rewriter.rest-gdi.geo-data.space/" + idParts[1] + "/" + idParts[2] + "." + idParts[3] + "/" + idParts[4] + "/" + idParts[5] + "?outputFormat=application%2Fjson");
  let resultBody = null;
  try {
    const headers = new Headers();
    //headers.set('Authorization', 'Basic ' + btoa('gast:gast'));
    resultBody = await fetch(identifier + "?outputFormat=application%2Fjson", headers); //&srsName=epsg%3A31287");
  }catch(e) {
  }

  if(resultBody === null || !resultBody.ok) {
    alert("Fehler beim Auflösen des Identifiers");
    return;
  }

  const json = await resultBody.json();
  
  map.removeLayer(vectorLayer);

  // let projection = {};
  // try {
  //   const crsName = json["crs"]["properties"]["name"];
  //   projection = {dataProjection: crsName, featureProjection : 'EPSG:31287'};
  // }catch(e){}


  const ft = new GeoJSON().readFeatures(json, {featureProjection : map.getView().getProjection()})

  vectorLayer = new VectorLayer({
    source: new VectorSource({
      features : ft
    }),
    declutter : true
  });
  
  map.addLayer(vectorLayer);

  //let bounds = [json.bbox[1], json.bbox[0],json.bbox[3], json.bbox[2]];
  //  if(projection.dataProjection) {
  //    bounds = olProj.transformExtent(bounds, projection.dataProjection, 'EPSG:31287');
  //  }
  map.getView().fit(vectorLayer.getSource().getExtent(), {
    padding: [50, 50, 50, 50]
  });
};