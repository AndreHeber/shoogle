var map = {}

function initMap(self) {
    self.instance = {};
    self.geolocationPosition = {};
    self.markers = [];

    self.settings = {
        center: { lat: 49.446, lng: 11.088 },
        zoom: 16,
        streetViewControl: false
    }

    self.initMap = function () {
        self.instance = new google.maps.Map(document.getElementById('map'), self.settings);
    }

    self.addMarker = function () {
        var marker = new google.maps.Marker({
            position: map.instance.getCenter(),
            title: 'Hi!',
            map: map.instance,
            draggable: true,
            animation: google.maps.Animation.DROP,
            label: 'A'
        });
        self.markers.push(marker);
    }

    self.setGeolocationPosition = function() {
        map.instance.setCenter(self.geolocationPosition);
    }

    // Get current position from browser (Geolocation) and save it to map
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            self.geolocationPosition = { lat: position.coords.latitude, lng: position.coords.longitude };
        });
    } else {
        error('Geo Location is not supported');
    }
}

initMap(map);
