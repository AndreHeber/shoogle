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

// show info 'connection problems' and 'reconnected' to user 
var toggleConnectionProblemMessage = false;
socket.on('reconnect_attempt', function () {
    if (toggleConnectionProblemMessage === false) {
        showProblem('Connection problems!');
        toggleConnectionProblemMessage = true;
    }
});
socket.on('connect', function () {
    if (toggleConnectionProblemMessage === true) {
        showInfo('Reconnected!');
        toggleConnectionProblemMessage = false;
    }
});