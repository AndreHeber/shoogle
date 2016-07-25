var auth = {}

function initAuth(self) {
    self.vm = {};

    function loginOk() {
        self.vm.status = 'logged in';
        self.vm.loginButtonValue = 'Log out';
        self.vm.showForm = false;
    }

    function unknownUser() {
        self.vm.status = 'username incorrect';
        self.vm.loginButtonValue = 'Login';
        self.vm.showForm = true;
    }

    function wrongPassword() {
        self.vm.status = 'password incorrect';
        self.vm.loginButtonValue = 'Login';
        self.vm.showForm = true;
    }

    function usernameAssigned() {
        self.vm.status = 'user is already registered';
        self.vm.loginButtonValue = 'Login';
        self.vm.showForm = true;
    }

    function tokenInvalid() {
        self.vm.status = 'logged out';
        self.vm.loginButtonValue = 'Login';
        self.vm.showForm = true;
    }

    function wrongToken() {
        self.vm.status = 'wrong token';
        self.vm.loginButtonValue = 'Login';
        self.vm.showForm = true;
    }

    self.loginUser = function (data) {
        console.log('data: ' + data);
        if (data == 'login ok') loginOk();
        else if (data == 'unknown user') unknownUser();
        else if (data == 'wrong password') wrongPassword();
    }

    self.registerUser = function (data) {
        console.log('data: ' + data);
        if (data == 'register ok') loginOk();
        else if (data == 'username assigned') usernameAssigned();
    }

    self.loginToken = function (data) {
        if (data == 'login ok') loginOk();
        else if (data == 'token invalid') tokenInvalid();
        else wrongToken();
    }

    self.getToken = function (err, token) {
        if (token) {
            socket.emit('login token', token);
            console.log('transmit token');
        } else {
            console.log('no token');
        }
    }

    self.storeToken = function (data) {
        db.addToken(data);
        console.log('store token');
        socket.removeListener('store token', self.storeToken);
    }

    self.login = function () {
        if (self.vm.loginButtonValue == 'Login') {
            socket.emit('login user', { username: self.vm.username, password: self.vm.password });
            self.vm.status = 'try logging in';
            self.vm.loginButtonValue = 'Please Wait';
        } else {
            socket.emit('logout user', { username: self.vm.username });
            self.vm.status = 'logged out';
            db.deleteToken();
            self.vm.loginButtonValue = 'Login';
            self.vm.showForm = self.vm;
            socket.on('store token', self.storeToken);
        }
    }

    self.register = function () {
        socket.emit('register user', { username: self.vm.username, password: self.vm.password });
    }
 
    socket.on('login user', self.loginUser);
    socket.on('register user', self.registerUser);
    socket.on('login token', self.loginToken);
    socket.on('store token', self.storeToken);
    
    db.getToken(auth.getToken);
}

initAuth(auth);

auth.vm = new Vue({
    el: '#login',
    data: {
        username: '',
        password: '',
        status: 'logged out',
        loginButtonValue: 'Login',
        showForm: true
    },
    methods: {
        register: auth.register,
        tryLogin: auth.login
    }
});
