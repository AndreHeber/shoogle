var vmProfile = new Vue({
    el: '#profile',
    data: {
        btnText: 'Set Location',
        status: 'Status'
    },
    methods: {
        setLocation: function () {
            if (!auth.user_id) this.status = 'You must be logged in!';
            else {
                this.status = 'Save Location';
                map.addMarker(function(marker) {
                    var data = {
                        token: auth.token,
                        user_id: auth.user_id,
                        location: {
                            name: marker.name,
                            latitude: marker.getPosition().lat(),
                            longitude: marker.getPosition().lng()
                        }
                    }
                    sendAndListen('add location', data, function (err, data) {
                        console.log('location id:');
                        console.log(data);
                    });
                });
            }
        },
        setGeolocation: function () {
            map.setGeolocationPosition();
        }
    }
});
