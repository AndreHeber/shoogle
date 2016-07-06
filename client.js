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

//////////////////////
// User Authentication
//////////////////////
socket.on('login user', function(data) {
  console.log('data: ' + data);
  if (data == 'login ok') {
    vmLogin.status = 'logged in';
    vmLogin.loginButtonValue = 'Log out';
  } else if (data == 'unknown user') {
    vmLogin.status = 'username incorrect';
    vmLogin.loginButtonValue = 'Login';
  } else if (data == 'wrong password') {
    vmLogin.status = 'password incorrect';
    vmLogin.loginButtonValue = 'Login';
  } else {}
});

socket.on('register user', function(data) {
  console.log('data: ' + data);
  if (data == 'register ok') {
    vmLogin.status = 'logged in';
    vmLogin.loginButtonValue = 'Log out';
  } else if (data == 'username assigned') {
    vmLogin.status = 'user is already registered';
    vmLogin.loginButtonValue = 'Login';
  } else {}
});

var vmLogin = new Vue({
  el: '#login',
  data: {
    username: '',
    password: '',
    status: 'logged out',
    loginButtonValue: 'Login',
    keep_logged_in: true
  },
  methods: {
    register: function() {
      socket.emit('register user', {username: this.username, password: this.password});
    },
    tryLogin: function() {
      if (this.loginButtonValue == 'Login') {
        socket.emit('login user', {username: this.username, password: this.password});
        this.status = 'try logging in';
        this.loginButtonValue = 'Please Wait';
      } else {
        socket.emit('logout user', {username: this.username});
        this.status = 'logged out';
        this.loginButtonValue = 'Login';
      }
    }
  }
});
