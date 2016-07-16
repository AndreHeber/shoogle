var vmProfile = new Vue({
  el: '#profile',
  data: {
    btnText: 'Set Location',
    status: 'Status'
  },
  methods: {
    setLocation: function() {
      // just for testing
      console.log('add location');
      var self = this;
      db.getToken( function (err, token) {
        console.log(err);
        console.log(token);
        if (err) self.status = 'You must be logged in!';
        else
        {
          self.status = 'Save Location';
          map.addMarker();
        } 
        // socket.emit('add location', {token: token, name: 'somewhere', latitude: 42.0, longitude: 42.0})
      });
      // this.status = 'bla';
    },
    setGeolocation: function () {
      console.log('set geolocation');
      map.setGeolocationPosition();
    }
  }
});
