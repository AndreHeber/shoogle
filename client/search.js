var vmSearch = new Vue({
  el: '#search',
  data: {
    search: '',
  },
  methods: {
    searchItem: function() {
      console.log('looking for: ' + this.search);
      socket.emit('search item', this.search);
    }
  }
});
