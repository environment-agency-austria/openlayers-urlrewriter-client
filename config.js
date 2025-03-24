const urlParams = new URLSearchParams(window.location.search);

// export const geoserver_address = urlParams.get("geoserver_address"); //"https://geoserver-admin.rest-gdi.geo-data.space";
// export const namespace = urlParams.get("namespace"); //"invekos";
// export const feature_wfs_name = namespace + ":" + urlParams.get("wfs_feature_name"); //"FT_INVEKOS_Schlaege_public_files";
// export const file_wfs_name = namespace + ":" + urlParams.get("wfs_files_view"); //wfs_files_view
// export const feature_id_property = urlParams.get("id_property"); //gml_identifier_public

// export const popupAttributes = JSON.parse(urlParams.get("info_attrs"));

export const geoserver_address = urlParams.get("geoserver_address"); //"https://geoserver-admin.rest-gdi.geo-data.space";
export const namespace = urlParams.get("namespace"); //"invekos";
export const feature_wfs_name = namespace + ":" + urlParams.get("wfs_feature_name"); //"FT_INVEKOS_Schlaege_public_files";
export const file_wfs_name = namespace + ":" + urlParams.get("wfs_files_view"); //wfs_files_view
export const feature_id_property = urlParams.get("id_property"); //gml_identifier_public

export const popupAttributes = JSON.parse(urlParams.get("info_attrs"));