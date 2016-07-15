var vmProfile = new Vue({
  el: '#profile',
  data: {
    btnText: 'Set Location',
    status: ''
  },
  methods: {
    setLocation: function() {
      // just for testing
      console.log('add location');
      db.getToken( function (err, token) {
        if (err) this.status = 'You must be logged in!';
        else this.btnText = 'Save Location';
        // socket.emit('add location', {token: token, name: 'somewhere', latitude: 42.0, longitude: 42.0})
      });
    }
  }
});
