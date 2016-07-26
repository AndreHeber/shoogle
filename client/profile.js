var vmProfile = new Vue({
    el: '#profile',
    data: {
        btnText: 'Set Location',
        status: 'Status',
        users: [],
        locations: [],
        items: [],
        showAdmin: false,
        currentUser: '',
        currentLocation: '',
        username: '',
        password: '',
        locationname: '',
        latitude: '',
        longitude: '',
        itemname: '',
        itemdescription: '',
        itemprice: ''
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
            this.currentUser = user.id;
            this.currentLocation = '';
            this.locations = [];
            this.items = [];
            db.getToken(function (err, token) {
                socket.emit('get locations', {token: token.token, user_id: user.id});
            });
        },
        getItems: function (location) {
            this.currentLocation = location.id;
            this.items = [];
            db.getToken(function (err, token) {
                socket.emit('get items', {token: token.token, location_id: location.id});
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
        addLocation: function () {
            var self = this;
            db.getToken(function (err, token) {
                socket.emit('add location as admin', {
                    token: token.token,
                    user_id: self.currentUser,
                    location: {
                        name: self.locationname,
                        latitude: self.latitude,
                        longitude: self.longitude
                    }
                });
            });
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
        },
        addItem: function () {
            var self = this;
            db.getToken(function (err, token) {
                socket.emit('add item as admin', {
                    token: token.token,
                    user_id: self.currentUser,
                    location_id: self.currentLocation,
                    item: {
                        name: self.itemname,
                        description: self.itemdescription,
                        price: self.itemprice
                    }
                });
            });
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
        vmProfile.users.push({id: users[i].id, name: users[i].name, newUsername: '', newPassword: ''});
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
