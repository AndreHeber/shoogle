var map;

var mapSettings = {
  center: {lat: 49.446, lng: 11.088},
  zoom: 16
};

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), mapSettings);
}
