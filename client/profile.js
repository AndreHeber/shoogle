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
        locations: [
            {name: 'loc a', latitude: 1.00, longitude: 2.00},
            {name: 'loc b', latitude: 3.00, longitude: 4.00},
            {name: 'loc c', latitude: 5.00, longitude: 6.00}
        ],
        items: [
            {name: 'item a',  description: 'description a', price: 500},
            {name: 'item b',  description: 'description b', price: 700},
            {name: 'item c',  description: 'description c', price: 900},
        ],
        showAdmin: false,
        currentUser: '',
        currentLocation: '',
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
        getLocations: function (user) {
            this.currentUser = user.oldUsername;
            db.getToken(function (err, token) {
                socket.emit('get locations', {token: token.token, user: user.oldUsername});
            });
        },
        getItems: function (location) {
            this.currentLocation = location.locationname;
            var self = this;
            db.getToken(function (err, token) {
                console.log('get items');
                console.log(self.currentUser);
                console.log(self.currentLocation);
                socket.emit('get items', {token: token.token, user: self.currentUser, location: self.currentLocation});
            });
        },
        editUser: function (user) {
            socket.emit('edit user', {oldUsername: user.oldUsername, newUsername: user.newUsername, password: user.newPassword});
        },
        deleteUser: function (user) {
            socket.emit('delete user', user);
        },
        addUser: function () {
            socket.emit('register user', { username: this.username, password: this.password });
        },
        editLocation: function (location) {
            console.log('edit location:');
            console.log(location);
            socket.emit('edit location', location);
        },
        deleteLocation: function (location) {
            console.log('delete location:');
            console.log(location);
            socket.emit('delete location', location);
        },
        editItem: function (item) {
            console.log('edit item:');
            console.log(item);
            socket.emit('edit item', item);
        },
        deleteItem: function (item) {
            console.log('delete item:');
            console.log(item);
            socket.emit('delete item', item);
        }
    }
});

// get roles from server
socket.on('roles', function (data) {
    for (var i = 0; i < data.length; i++) {
        if (data[i] == 'admin') {
            vmProfile.showAdmin = true;
            db.getToken(function (err, token) {
                socket.emit('get users', token);
                console.log('get users from server');
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
    console.log(users);

    vmProfile.users = [];
    for (i=0; i<users.length; i++)
        vmProfile.users.push({oldUsername: users[i], newUsername: '', newPassword: ''});
});

socket.on('get locations', function (locations) {
    console.log('locations: ');
    console.log(locations);

    vmProfile.locations = locations;
});

socket.on('get items', function (items) {
    console.log('items: ');
    console.log(items);

    vmProfile.items = items;
});

socket.on('get userdata', function (data) {
    console.log('userdata: ');
    console.log(data);
});
