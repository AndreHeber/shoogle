function saveLocation() {
    socket.emit('')
}

function log(err, result) {
    console.log(err);
    console.log(result);
}

function sendAndListen(channel, data, callback) {
    function call_back(data) {
        callback(data.err, data.result);
        socket.removeListener(channel, call_back);
    }
    socket.emit(channel, data);
    if (callback != null) {
        socket.on(channel, call_back);
    }
}

var vmProfile = new Vue({
    el: '#profile',
    data: {
        btnText: 'Set Location',
        status: 'Status',
        users: [],
        locations: [],
        items: [],
        showUI: {
            admin: false,
            user: false
        },
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
                        var data = {
                            token: auth.token,
                            user_id: auth.user_id,
                            location: {
                                name: marker.name,
                                latitude: marker.getPosition().lat(),
                                longitude: marker.getPosition().lng()
                            }
                        }
                        sendAndListen('add location', data, function (err, data) {
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
            sendAndListen('get all roles', {token: auth.token}, function (err, roles) {
                vmProfile.roles = roles;
            });
            sendAndListen('get roles', {token: auth.token, user_id: user.id}, function (err, roles) {
                vmProfile.userRoles = [];
                for (i=0; i<roles.length; i++)
                    vmProfile.userRoles.push(JSON.stringify(roles[i].id));
            });
            sendAndListen('get locations', {token: auth.token, user_id: user.id}, function (err, locations) {
                vmProfile.locations = locations;
            });
        },
        editRoles: function () {
            var self = this;
            var data = {
                token: auth.token,
                user_id: this.currentUser,
                role_ids: this.userRoles
            };
            sendAndListen('edit roles', data);
        },
        getItems: function (location) {
            this.currentLocation = location.id;
            this.items = [];
            var data = {
                token: auth.token, 
                user_id: this.currentUser, 
                location_id: location.id
            };
            sendAndListen('get items', data, function (err, items) {
                vmProfile.items = items;
            });
        },
        editUser: function (user) {
            var data = {
                token: auth.token,
                user_id: user.id,
                name: user.newName,
                password: user.password
            };
            sendAndListen('edit user', data);
        },
        deleteUser: function (user) {
            var users = this.users;
            var index;

            function deleteUser() {
                for (i=0; i<users.length; i++) {
                    if (users[i].id == user.id) {
                        index = i;
                        users.splice(i, 1);
                    }
                }
            }

            function addUser() {
                users.splice(index, 0, user);
            }

            deleteUser();
            sendAndListen('delete user', {token: auth.token, user_id: user.id}, function (err, result) {
                if (err) {
                    notie.alert(3, 'Deletion of user failed!', 2);
                    addUser();
                } else {
                    notie.alert(1, 'User deleted!', 2);
                }
            });
        },
        addUser: function () {
            var user = {id: 0, name: this.username};
            this.users.push(user);
            sendAndListen('register user', { username: this.username, password: this.password}, function (err, user_id) {
                user.id = user_id;
                notie.alert(1, 'User added!', 2);
            });
        },
        editLocation: function (location) {
            var data = {
                token: auth.token, 
                user_id: this.currentUser, 
                location: location
            };
            sendAndListen('edit location', data);
        },
        deleteLocation: function (location) {
            var data = {
                token: auth.token, 
                user_id: this.currentUser, 
                location_id: location.id
            };
            sendAndListen('delete location', data);
        },
        addLocation: function () {
            var data = {
                token: auth.token,
                user_id: this.currentUser,
                location: {
                    name: this.locationname,
                    latitude: this.latitude,
                    longitude: this.longitude
                }
            }
            sendAndListen('add location', data);
            this.locations.push(location);
        },
        editItem: function (item) {
            sendAndListen('edit item', {token: auth.token, user_id: this.currentUser, item: item});
        },
        deleteItem: function (item) {
            sendAndListen('delete item', {token: auth.token, user_id: this.currentUser, id: item.id});
        },
        addItem: function () {
            var data = {
                token: auth.token,
                user_id: this.currentUser,
                location_id: this.currentLocation,
                item: {
                    name: this.itemname,
                    description: this.itemdescription,
                    price: this.itemprice
                }
            };
            sendAndListen('add item', data);
            this.items.push(item);
        }
    }
});

auth.handleRole = function (role) {
    console.log(role);
    if (role == 'admin') {
        vmProfile.showUI.admin = true;
        auth.userLoggedOut = function() {
            vmProfile.showUI.admin = false;
        }
        sendAndListen('get all users', {token: auth.token}, function (err, users) {
            if (err) console.log('Err: ' + users);
            vmProfile.users = [];
            for (i=0; i<users.length; i++)
                vmProfile.users.push({id: users[i].id, name: users[i].name, newUsername: '', newPassword: ''});
        })
    } else if (role == 'user') {
        sendAndListen('get userdata', {token: auth.token, user_id: auth.user_id}, function (err, userdata) {
            console.log('userdata: ');
            console.log(userdata);
        });
    }
}
