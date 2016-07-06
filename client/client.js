var socket = io();

var vm = new Vue({
  el: '#chat',
  data: {
    messages: [
      { text: 'a' },
      { text: 'b' },
      { text: 'c' }
    ],
    newMessage: ''
  },
  methods: {
    sendMessage: function () {
      socket.emit('new message', this.newMessage);
      this.newMessage = "";
    }
  }
});

socket.on('broadcast message', function(message) {
  vm.messages.push({text: message});
});
