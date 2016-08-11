var auth = {}

function initAuth(self) {
    self.vm = {};
    self.user_id = '';
    self.token = '';
    self.userLoggedIn = null;
    self.userLoggedOut = null;

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
        if (!data.err) {
            self.user_id = data.result;
            loginOk();
            if (self.userLoggedIn !== null)
                self.userLoggedIn();
        }
        else if (data.result === 'unknown user') unknownUser();
        else if (data.result === 'wrong password') wrongPassword();
    }

    self.registerUser = function (data) {
        if (!data.err) {
            self.user_id = data.result;
            loginOk();
            if (self.userLoggedIn !== null)
                self.userLoggedIn();
        }
        else if (data.result == 'username assigned') usernameAssigned();
    }

    self.loginToken = function (data) {
        if (!data.err) {
            self.user_id = data.result;
            loginOk();
            if (self.userLoggedIn !== null)
                self.userLoggedIn();
        }
        else if (data.result == 'token invalid') tokenInvalid();
        else wrongToken();
    }

    self.getToken = function (err, token) {
        if (token)
            socket.emit('login token', token);
    }

    self.storeToken = function (data) {
        if (!data.err) {
            self.token = data.result;
            db.addToken(data.result);
            socket.removeListener('store token', self.storeToken);
        }
    }

    function loginClicked() {
        socket.emit('login user', { username: self.vm.username, password: self.vm.password });
        self.vm.status = 'try logging in';
        self.vm.loginButtonValue = 'Please Wait';
    }

    function logoutClicked() {
        socket.emit('logout user', { username: self.vm.username });
        self.vm.status = 'logged out';
        db.deleteToken();
        self.vm.loginButtonValue = 'Login';
        self.vm.showForm = self.vm;
        socket.on('store token', self.storeToken);
        self.token = '';
        self.user_id = '';
        if (self.userLoggedOut !== null)
            self.userLoggedOut();
    }

    self.login = function () {
        if (self.vm.loginButtonValue == 'Login')
            loginClicked();
        else
            logoutClicked();
    }

    self.register = function () {
        socket.emit('register user', { username: self.vm.username, password: self.vm.password });
    }
 
    socket.on('login user', self.loginUser);
    socket.on('register user', self.registerUser);
    socket.on('login token', self.loginToken);
    socket.on('store token', self.storeToken);

    socket.on('roles', function (data) {
        if (!data.err) {
            for (var i = 0; i < data.result.length; i++) {
                if (auth.handleRole !== null)
                    auth.handleRole(data.result[i].role);
            }
        }
    });
    
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
