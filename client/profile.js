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
        itemprice: '',
        roles: ['user', 'admin'],
        userRoles: ['admin'],
        checked: false
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
                // socket.emit('add location', {token: token.token, name: 'somewhere', latitude: 42.0, longitude: 42.0})
            });
            // this.status = 'bla';
        },
        setGeolocation: function () {
            console.log('set geolocation');
            map.setGeolocationPosition();
        },
        getRolesAndLocations: function (user) {
            this.currentUser = user.id;
            this.currentLocation = '';
            this.locations = [];
            this.items = [];
            db.getToken(function (err, token) {
                socket.emit('get all roles', {token: token.token});
                socket.emit('get roles', {token: token.token, user_id: user.id});
                socket.emit('get locations', {token: token.token, user_id: user.id});
            });
        },
        editRoles: function () {
            var self = this;
            db.getToken(function (err, token) {
                socket.emit('edit roles as admin', {token: token.token, user_id: self.currentUser, role_ids: self.userRoles});
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
            db.getToken(function (err, token) {
                socket.emit('edit user as admin', {
                    token: token.token,
                    user: {
                        id: user.id,
                        name: user.newName,
                        password: user.password
                    }
                });
            });
        },
        deleteUser: function (user) {
            db.getToken(function (err, token) {
                socket.emit('delete user as admin', {token: token.token, id: user.id});
            });
        },
        addUser: function () {
            socket.emit('register user', { username: this.username, password: this.password });
        },
        editLocation: function (location) {
            console.log('edit location:');
            console.log(location);
            db.getToken(function (err, token) {
                socket.emit('edit location as admin', {token: token.token, location: location});
            });
        },
        deleteLocation: function (location) {
            console.log('delete location:');
            console.log(location);
            db.getToken(function (err, token) {
                socket.emit('delete location as admin', {token: token.token, id: location.id});
            });
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
            db.getToken(function (err, token) {
                socket.emit('edit item as admin', {token: token.token, item: item});
            });
        },
        deleteItem: function (item) {
            console.log('delete item:');
            console.log(item);
            db.getToken(function (err, token) {
                socket.emit('delete item as admin', {token: token.token, id: item.id});
            });
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
        console.log('login roles');
        console.log(data);
        if (data[i].role == 'admin') {
            vmProfile.showAdmin = true;
            db.getToken(function (err, token) {
                socket.emit('get users', token.token);
                console.log('get users from server');
            });
        } else if (data[i].role == 'user') {
            db.getToken(function (err, token) {
                socket.emit('get userdata', token.token);
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

socket.on('get all roles', function (roles) {
    console.log('all roles: ');
    console.log(roles);

    vmProfile.roles = roles;
});

socket.on('get roles', function (roles) {
    console.log('user roles: ');
    console.log(roles);

    vmProfile.userRoles = [];
    for (i=0; i<roles.length; i++)
        vmProfile.userRoles.push(JSON.stringify(roles[i].id));
});

socket.on('get userdata', function (data) {
    console.log('userdata: ');
    console.log(data);
});
