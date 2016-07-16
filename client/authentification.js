socket.on('login user', function(data) {
  console.log('data: ' + data);
  if (data == 'login ok') {
    vmLogin.status = 'logged in';
    vmLogin.loginButtonValue = 'Log out';
    vmLogin.showForm = false;
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
    vmLogin.showForm = false;
  } else if (data == 'username assigned') {
    vmLogin.status = 'user is already registered';
    vmLogin.loginButtonValue = 'Login';
  } else {}
});

var token = db.getToken(function (err, token) {
  if ( token ) {
    socket.emit('login token', token);
    console.log('transmit token');
  } else {
    console.log('no token');
  }
});

socket.on('login token', function(data) {
  if (data == 'login ok') {
    vmLogin.status = 'logged in';
    vmLogin.loginButtonValue = 'Log out';
    vmLogin.showForm = false;
  }else if (data == 'token invalid') {
    vmLogin.status = 'logged out';
    vmLogin.loginButtonValue = 'Login';
  } else {
    console.log(data);
    vmLogin.status = 'wrong token';
    vmLogin.loginButtonValue = 'Login';
  }
});

socket.on('store token', function(data) {
  db.addToken(data);
  console.log('store token');
});

var vmLogin = new Vue({
  el: '#login',
  data: {
    username: '',
    password: '',
    status: 'logged out',
    loginButtonValue: 'Login',
    showForm: true
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
        db.deleteToken();
        this.loginButtonValue = 'Login';
        vmLogin.showForm = true;
      }
    }
  }
});
