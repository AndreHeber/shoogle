db = {};

function initDb() {
    var dexie = new Dexie('Shoogle');
    var token = '';

    dexie.version(1).stores({
        login: ", token"
    });

    db.addToken = function (_token) {
        dexie.login.put({ token: _token }, 1);
        token = _token;
    }

    db.getToken = function (callback) {
        if (typeof token === 'undefined' || token == '') {
            dexie.login.get(1, function (_token) {
                if (typeof _token === 'undefined') callback(1, undefined);
                else {
                    token = _token.token;
                    callback(0, token);
                }
            });
        } else callback(0, token);
    }

    db.deleteToken = function () {
        dexie.login.delete(1);
        token = '';
    }

    function sendAndListen(channel, data, callback) {
        socket.emit(channel, data);
        if (callback != null) {
            socket.on(channel, function (data) {
                callback(data.err, data.result);
            });
        }
    }

    db.getAllRoles = function (callback) {
        sendAndListen('get all roles', {token: token}, callback);
    }

    db.getRoles = function (user_id, callback) {
        sendAndListen('get roles', {token: token, user_id: user_id}, callback);
    }

    db.getLocations = function (user_id, callback) {
        sendAndListen('get locations', {token: token, user_id: user_id}, callback);
    }

    db.editRolesAsAdmin = function (user_id, user_roles, callback) {
        var data = {
            token: token,
            user_id: user_id,
            role_ids: user_roles
        };
        sendAndListen('edit roles as admin', data, callback);
    }

    db.getItems = function (location_id, callback) {
        sendAndListen('get items', {token: token, location_id: location_id}, callback);
    }

    db.editUserAsAdmin = function (user_id, name, password, callback) {
        var data = {
            token: token,
            user_id: user_id,
            role_ids: user_roles
        };
        sendAndListen('edit user as admin', data, callback);
    }

    db.deleteUserAsAdmin = function (user_id, callback) {
        sendAndListen('delete user as admin', {token: token, id: user_id}, callback);
    }

    db.addUser = function (username, password, callback) {
        sendAndListen('register user', { username: username, password: password}, callback);
    }

    db.editLocationAsAdmin = function (location, callback) {
        sendAndListen('edit location as admin', {token: token, location: location}, callback);
    }

    db.deleteLocationAsAdmin = function (location_id, callback) {
        sendAndListen('delete location as admin', {token: token, location_id: location_id}, callback);
    }

    db.addLocationAsAdmin = function (user_id, location, callback) {
        var data = {
            token: token,
            user_id: user_id,
            location: location
        }
        sendAndListen('add location as admin', data, callback);
    }

    db.addLocation = function (location, callback) {
        sendAndListen('add location', {token: token, location: location}, callback);
    }

    db.editItemAdAdmin = function (item, callback) {
        sendAndListen('edit item as admin', {token: token, item: item}, callback);
    }

    db.deleteItemAdAdmin = function (item_id, callback) {
        sendAndListen('delete item as admin', {token: token, id: item_id}, callback);
    }

    db.addItemAsAdmin = function (user_id, location_id, item, callback) {
        var data = {
            token: token,
            user_id: user_id,
            location_id: location_id,
            item: item
        };
        sendAndListen('add item as admin', data, callback);
    }

    db.getUsers = function (callback) {
        sendAndListen('get users', token, callback);
    }

    db.getUserdata = function (callback) {
        sendAndListen('get userdata', token, callback);
    }
};

initDb();
