var vmProfile = new Vue({
    el: '#profile',
    data: {
        btnText: 'Set Location',
        status: 'Status',
        users: [
            {oldUsername: 'a', newUsername: '', newPassword: ''},
            {oldUsername: 'b', newUsername: '', newPassword: ''},
            {oldUsername: 'c', newUsername: '', newPassword: ''}
        ],
        locations: {
            user: 'a', locations: ['a1', 'a2', 'a3']
        },
        showAdmin: true,
        username: '',
        password: ''
    },
    methods: {
        setLocation: function () {
            // just for testing
            console.log('add location');
            var self = this;
            db.getToken(function (err, token) {
                console.log(err);
                console.log(token);
                if (err) self.status = 'You must be logged in!';
                else {
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
        },
        editUser: function (user) {
            socket.emit('edit user', {oldUsername: user.oldUsername, newUsername: user.newUsername, password: user.newPassword})
        },
        deleteUser: function (user) {
            socket.emit('delete user', user);
        },
        addUser: function () {
            socket.emit('register user', { username: this.username, password: this.password });
        }
    }
});

socket.on('roles', function (data) {
    for (var i = 0; i < data.length; i++) {
        if (data[i] == 'admin') {
            db.getToken(function (err, token) {
                socket.emit('get users', token);
            });
        } else if (data[i] == 'user') {
            db.getToken(function (err, token) {
                socket.emit('get userdata', token);
            });
        }
    }
});

socket.on('get users', function (users) {
    console.log('users: ');
    console.log(data);
    vmProfile.users = users;
});

socket.on('get userdata', function (data) {
    console.log('userdata: ');
    console.log(data);
});
