var vmAdmin = new Vue({
    el: '#admin-panel',
    data: {
        users: [],
        locations: [],
        items: [],
        showUI: false,
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
        roles: [],
        userRoles: [],
        checked: false
    },
    methods: {
        getRolesAndLocations: function (user) {
            this.currentUser = user.id;
            this.currentLocation = '';
            this.locations = [];
            this.items = [];
            sendAndListen('get all roles', {token: auth.token}, function (err, roles) {
                this.roles = roles;
            }.bind(this));
            sendAndListen('get roles', {token: auth.token, user_id: user.id}, function (err, roles) {
                this.userRoles = [];
                for (i=0; i<roles.length; i++)
                    this.userRoles.push(JSON.stringify(roles[i].id));
            }.bind(this));
            sendAndListen('get locations', {token: auth.token, user_id: user.id}, function (err, locations) {
                this.locations = locations;
            }.bind(this));
        },
        editRoles: function () {
            emit({
                command: 'edit roles',
                data: { token: auth.token, user_id: this.currentUser, role_ids: this.userRoles },
                nowRun: nothing,
                onSuccess: function () { showInfo('Roles saved'); },
                onError: function () { showProblem("Couldn't save roles!"); }
            });
        },
        getItems: function (location) {
            emit({
                command: 'get items',
                data: { token: auth.token, user_id: this.currentUser, location_id: location.id },
                nowRun: function () {
                    this.currentLocation = location.id;
                    this.items = [];
                }.bind(this),
                onSuccess: function (items) { this.items = items; }.bind(this),
                onError: function () { showProblem("Couldn't get items!"); }
            });
        },
        editUser: function (user) {
            emit({
                command: 'edit user',
                data: { token: auth.token, user_id: user.id, name: user.newName, password: user.password },
                nowRun: nothing,
                onSuccess: function () { showInfo('User editing saved.'); },
                onError: function () { showProblem("Couldn't save user!"); }
            });
        },
        deleteUser: function (user) {
            var index;
            emit({
                command: 'delete user',
                data: { token: auth.token, user_id: user.id },
                nowRun: function () {
                    index = findByIdIn(this.users, user);
                    this.users.splice(index, 1);
                    if (this.currentUser === user.id) this.currentUser = '';
                }.bind(this),
                onSuccess: function () { 
                    showInfo('User deleted!');
                },
                onError: function () {
                    showProblem('Deletion of user failed!');
                    this.users.splice(index, 0, user);
                }.bind(this)
            });
        },
        addUser: function () {
            var user = {id: 0, name: this.username};
            var index;
            emit({
                command: 'register user',
                data: {username: this.username, password: this.password},
                nowRun: function () {
                    var length = this.users.push(user);
                    index = length - 1;
                }.bind(this),
                onSuccess: function (user_id) {
                    user.id = user_id;
                    showInfo('User added!');
                },
                onError: function (err, result) {
                    showProblem("Couldn't register user!");
                    this.users.splice(index, 1);
                }.bind(this)
            });
        },
        editLocation: function (location) {
            emit({
                command: 'edit location',
                data: { token: auth.token, user_id: this.currentUser, location: location },
                nowRun: nothing,
                onSuccess: function () { showInfo('Location editing saved!'); },
                onError: function (err, result) { showProblem("Couldn't save location!"); }
            });
        },
        deleteLocation: function (location) {
            var index = 0;
            emit({
                command: 'delete location',
                data: {
                    token: auth.token,
                    user_id: this.currentUser,
                    location_id: location.id
                },
                nowRun: function () {
                    index = findByIdIn(this.locations, location);
                    this.locations.splice(index, 1);
                    if (this.currentLocation === location.id) this.currentLocation = '';
                }.bind(this),  
                onSuccess: function () {
                    showInfo('Location deleted.');
                },
                onError: function () {
                    showProblem('Deletion of location failed!');
                    this.locations.splice(index, 0, location);
                }.bind(this)
            });
        },
        addLocation: function () {
            var location = { name: this.locationname, latitude: this.latitude, longitude: this.longitude };
            emit({
                command: 'add location',
                data: { token: auth.token, user_id: this.currentUser, location: location },
                nowRun: function () {
                    this.locations.push(location);
                }.bind(this),
                onSuccess: function (location_id) {
                    showInfo('Location added.')
                    location.id = location_id;
                },
                onError: function () {
                    showProblem("Couldn't add Location!")
                    this.users.splice(index, 1);
                }.bind(this)
            });
        },
        editItem: function (item) {
            emit({
                command: 'edit item',
                data: { token: auth.token, user_id: this.currentUser, item: item },
                nowRun: nothing,
                onSuccess: function () { showInfo('Item editing saved!'); },
                onError: function () { showProblem("Couldn't save Item"); }
            });
        },
        deleteItem: function (item) {
            var index;
            emit({
                command: 'delete item',
                data: { token: auth.token, user_id: this.currentUser, id: item.id },
                nowRun: function () {
                    index = findByIdIn(this.items, item);
                    this.items.splice(index, 1);
                }.bind(this),
                onSuccess: function () { showInfo('Item deleted!'); },
                onError: function () {
                    this.items.splice(index, 0, item);
                }.bind(this)
            });
        },
        addItem: function () {
            var item = { name: this.itemname, description: this.itemdescription, price: this.itemprice };
            var index;
            emit({
                command: 'add item',
                data: { token: auth.token, user_id: this.currentUser, location_id: this.currentLocation, item: item },
                nowRun: function () {
                    var length = this.items.push(item);
                    index = length - 1;
                }.bind(this),
                onSuccess: function (item_id) {
                    showInfo('Item added.')
                    item.id = item_id;
                },
                onError: function () {
                    showProblem("Couldn't add Item!")
                    this.items.splice(index, 1);
                }.bind(this)
            });
        }
    }
});

auth.handleRole = function (role) {
    if (role == 'admin') {
        vmAdmin.showUI = true;
        auth.userLoggedOut = function() {
            vmAdmin.showUI = false;
        }
        emit({
            command: 'get all users',
            data: { token: auth.token },
            nowRun: nothing,
            onSuccess: function (users) {
                vmAdmin.users = [];
                for (i=0; i<users.length; i++)
                    vmAdmin.users.push({id: users[i].id, name: users[i].name, newUsername: '', newPassword: ''});
            },
            onError: function () { showProblem("Couldn't get available users!"); }
        });
    } else if (role == 'user') {
        emit({
            command: 'get userdata',
            data: { token: auth.token, user_id: auth.user_id },
            nowRun: nothing, // todo loading screen
            onSuccess: function (userdata) {}, // display data
            onError: function () { showProblem("Couldn't get userdata!"); }
        });
    }
}
