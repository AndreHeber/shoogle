var map = {
  instance: {},
  geolocationPosition: {},
  markers: [],
  settings: {
    center: {lat: 49.446, lng: 11.088},
    zoom: 16
  },
  initMap: function () {
    this.instance = new google.maps.Map(document.getElementById('map'), this.settings);
  },
  addMarker: function () {
    var marker = new google.maps.Marker({
      position: map.instance.getCenter(),
      title: 'Hi!',
      map: map.instance,
      draggable: true,
      animation: google.maps.Animation.DROP,
      label: 'A'
    });
    this.markers.push(marker);
  },
  setGeolocationPosition: function() {
    map.instance.setCenter(this.geolocationPosition);
  }
};

// Get current position from browser (Geolocation) and save it to map
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(function (position) {
    map.geolocationPosition = {lat: position.coords.latitude, lng: position.coords.longitude};
  });
} else {
  error('Geo Location is not supported');
}