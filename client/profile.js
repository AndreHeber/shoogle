function saveLocation() {
    socket.emit('')
}

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
            var self = this;
            db.getToken(function (err, token) {
                if (err) self.status = 'You must be logged in!';
                else {
                    self.status = 'Save Location';
                    map.addMarker(function(marker) {
                        console.log({
                            token: token,
                            location: {
                                name: marker.name,
                                latitude: marker.getPosition().lat(),
                                longitude: marker.getPosition().lng()
                            }
                        });
                        var location = {
                            name: marker.name,
                            latitude: marker.getPosition().lat(),
                            longitude: marker.getPosition().lng()
                        };
                        db.addLocation(location, function (err, data) {
                            console.log('location id:');
                            console.log(data);
                        });
                    });
                }
            });
        },
        setGeolocation: function () {
            map.setGeolocationPosition();
        },
        getRolesAndLocations: function (user) {
            this.currentUser = user.id;
            this.currentLocation = '';
            this.locations = [];
            this.items = [];
            db.getAllRoles(function (err, roles) {
                vmProfile.roles = roles;
            });
            db.getRoles(user.id, function (err, roles) {
                vmProfile.userRoles = [];
                for (i=0; i<roles.length; i++)
                    vmProfile.userRoles.push(JSON.stringify(roles[i].id));
            });
            db.getLocations(user.id, function (err, locations) {
                vmProfile.locations = locations;
            });
        },
        editRoles: function () {
            var self = this;
            db.editRolesAsAdmin(self.currentUser, self.userRoles);
        },
        getItems: function (location) {
            this.currentLocation = location.id;
            this.items = [];
            db.getItems(location.id, function (err, items) {
                vmProfile.items = items;
            });
        },
        editUser: function (user) {
            db.editUserAsAdmin(user.id, user.newName, user.password);
        },
        deleteUser: function (user) {
            var users = this.users;
            db.deleteUserAsAdmin(user.id, function (err, result) {
                if (err) {
                    notie.alert(3, 'Deletion of user failed!', 2);
                } else {
                    for (i=0; i<users.length; i++) {
                        if (users[i].id == user.id) {
                            users.splice(i, 1);
                        }
                    }
                    notie.alert(1, 'User deleted!', 2);
                }
            });
        },
        addUser: function () {
            var user = {id: 0, name: this.username};
            this.users.push(user);
            db.addUser(this.username, this.password, function (err, user_id) {
                user.id = user_id;
                notie.alert(1, 'User added!', 2);
            });
        },
        editLocation: function (location) {
            db.editLocationAsAdmin(location);
        },
        deleteLocation: function (location) {
            db.deleteLocationAsAdmin(location.id);
        },
        addLocation: function () {
            var location = {
                name: self.locationname,
                latitude: self.latitude,
                longitude: self.longitude
            };
            db.addLocationAsAdmin(this.currentUser, location);
            this.locations.push(location);
        },
        editItem: function (item) {
            db.editItemAdAdmin(item);
        },
        deleteItem: function (item) {
            db.deleteItemAdAdmin(item.id);
        },
        addItem: function () {
            var item = {
                name: self.itemname,
                description: self.itemdescription,
                price: self.itemprice
            };
            db.addItemAsAdmin(this.currentUser, this.currentLocation, item);
            this.items.push(item);
        }
    }
});

// get roles from server
socket.on('roles', function (data) {
    var err = data.err;
    var roles = data.result;
    for (var i = 0; i < roles.length; i++) {
        console.log('login roles');
        console.log(roles);
        if (roles[i].role == 'admin') {
            vmProfile.showAdmin = true;
            db.getUsers(function (err, users) {
                vmProfile.users = [];
                for (i=0; i<users.length; i++)
                    vmProfile.users.push({id: users[i].id, name: users[i].name, newUsername: '', newPassword: ''});
            })
        } else if (roles[i].role == 'user') {
            db.getUserdata(function (err, userdata) {
                console.log('userdata: ');
                console.log(userdata);
            });
        }
    }
});
