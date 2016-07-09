var vmSearch = new Vue({
  el: '#search',
  data: {
    search: '',
  },
  methods: {
    searchItem: function() {
      console.log('looking for: ' + this.search);
      socket.emit('search item', this.search);
      // just for testing
      console.log('add location');
      db.getToken( function (token) {
        socket.emit('add location', {token: token, name: 'somewhere', latitude: 42.0, longitude: 42.0})
      })
          }
  }
});
