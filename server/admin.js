var runInSeries = require('async-waterfall');

module.exports = function (io, db, logger, auth) {

    function listen(socket) {

        function getUsers(token) {
            var dbConnection, dbDone;

            runInSeries([
                (cb) => { auth.verifyAdmin(token, cb); },
                (username, cb) => { db.createConnection(cb); },
                (con, done, cb) => { dbConnection = con; dbDone = done; cb(); },
                (cb) => { db.getUsers(dbConnection, cb); }
            ], function (err, users) {
                dbDone();
                if (err) throw err;
                socket.emit('get users', {err: err, result: users});
            });
        }

        function getLocations(data) {
            var dbCon, dbDone;

            runInSeries([
                (cb) => { auth.verifyAdmin(data.token, cb); },
                (isAdmin, cb) => { db.createConnection(cb); },
                (con, done, cb) => { dbCon = con; dbDone = done; db.getLocations(data.user_id, con, cb); },
            ], function (err, locations) {
                dbDone();
                if (err) throw err;
                socket.emit('get locations', {err: err, result: locations});
            });
        }

        function getItems(data) {
            var dbDone;

            runInSeries([
                (cb) => { auth.verifyAdmin(data.token, cb); },
                (isAdmin, cb) => { db.createConnection(cb); },
                (con, done, cb) => { dbDone = done; db.getItems(data.location_id, con, cb); }
            ], function (err, items) {
                dbDone();
                if (err) throw err;
                socket.emit('get items', {err: err, result: items});
            });
        }

        function addLocation(data) {
            var dbDone;

            runInSeries([
                (cb) => { auth.verifyAdmin(data.token, cb); },
                (isAdmin, cb) => { db.createConnection(cb); },
                (con, done, cb) => { dbDone = done; db.addLocation(data.user_id, data.location, con, cb); }
            ], function (err, location_id) {
                dbDone();
                if (err) throw err;
                socket.emit('add location as admin', {err: err, result: location_id});
            });
        }

        function addItem(data) {
            var dbDone;

            runInSeries([
                (cb) => { auth.verifyAdmin(data.token, cb); },
                (isAdmin, cb) => { db.createConnection(cb); },
                (con, done, cb) => { dbDone = done; db.addItem(data.user_id, data.location_id, data.item, con, cb); }
            ], function (err, item_id) {
                dbDone();
                if (err) throw err;
                socket.emit('add item as admin', {err: err, result: item_id});
            });
        }

        function editUser(data) {
            var dbDone;
            var hashedPassword;

            function createHashedPassword(callback) {
                auth.hashPassword(data.user.password, (err, hashedPassword) => {
                    data.user.password = hashedPassword;
                    callback(err);
                });
            }

            runInSeries([
                (cb) => { auth.verifyAdmin(data.token, cb); },
                (isAdmin, cb) => { createHashedPassword(cb); },
                db.createConnection,
                (con, done, cb) => { dbDone = done; db.editUser(data.user, con, cb); }
            ], function (err, result) {
                dbDone();
                if (err) throw err;
                socket.emit('edit user as admin', {err: err, result: result});
            });
        }

        function editLocation(data) {
            var dbDone;

            runInSeries([
                (cb) => { auth.verifyAdmin(data.token, cb); },
                (isAdmin, cb) => { db.createConnection(cb); },
                (con, done, cb) => { dbDone = done; db.editLocation(data.location, con, cb); },
            ], function (err, result) {
                dbDone();
                if (err) throw err;
                socket.emit('edit location as admin', {err: err, result: result});
            });
        }

        function editItem(data) {
            var dbDone;

            runInSeries([
                (cb) => { auth.verifyAdmin(data.token, cb); },
                (isAdmin, cb) => { db.createConnection(cb); },
                (con, done, cb) => { dbDone = done; db.editItem(data.item, con, cb); },
            ], function (err, result) {
                dbDone();
                if (err) throw err;
                socket.emit('edit item as admin', {err: err, result: result});
            });
        }

        function deleteUser(data) {
            var dbDone;

            runInSeries([
                (cb) => { auth.verifyAdmin(data.token, cb); },
                (isAdmin, cb) => { db.createConnection(cb); },
                (con, done, cb) => { dbDone = done; db.deleteUser(data.id, con, cb); },
            ], function (err, result) {
                dbDone();
                socket.emit('delete user as admin', {err: err, result: result});
            });
        }

        function deleteLocation(data) {
            var dbDone;

            runInSeries([
                (cb) => { auth.verifyAdmin(data.token, cb); },
                (isAdmin, cb) => { db.createConnection(cb); },
                (con, done, cb) => { dbDone = done; db.deleteLocation(data.id, con, cb); },
            ], function (err, result) {
                dbDone();
                if (err) throw err;
                socket.emit('delete location as admin', {err: err, result: result});
            });
        }

        function deleteItem(data) {
            var dbDone;

            runInSeries([
                (cb) => { auth.verifyAdmin(data.token, cb); },
                (isAdmin, cb) => { db.createConnection(cb); },
                (con, done, cb) => { dbDone = done; db.deleteItem(data.id, con, cb); },
            ], function (err, result) {
                dbDone();
                if (err) throw err;
                socket.emit('delete item as admin', {err: err, result: result});
            });
        }

        function getAllRoles(data) {
            var dbDone;

            runInSeries([
                (cb) => { auth.verifyAdmin(data.token, cb); },
                (isAdmin, cb) => { db.createConnection(cb); },
                (con, done, cb) => { dbDone = done; db.getAllRoles(con, cb); },
            ], function (err, result) {
                dbDone();
                if (err) throw err;
                socket.emit('get all roles', {err: err, result: result});
            });
        }

        function getRoles(data) {
            var dbDone;

            runInSeries([
                (cb) => { auth.verifyAdmin(data.token, cb); },
                (isAdmin, cb) => { db.createConnection(cb); },
                (con, done, cb) => { dbDone = done; db.getUserRoles(data.user_id, con, cb); },
            ], function (err, result) {
                dbDone();
                if (err) throw err;
                socket.emit('get roles', {err: err, result: result});
            });
        }

        function editRoles(data) {
            var dbDone;

            runInSeries([
                (cb) => { auth.verifyAdmin(data.token, cb); },
                (isAdmin, cb) => { db.createConnection(cb); },
                (con, done, cb) => { dbDone = done; db.editRoles(data.user_id, data.role_ids, con, cb); },
            ], function (err, result) {
                dbDone();
                if (err) throw err;
                socket.emit('edit roles as admin', {err: err, result: result});
            });
        }

        socket.on('get users', getUsers);
        socket.on('get locations', getLocations);
        socket.on('get items', getItems);
        socket.on('add location as admin', addLocation);
        socket.on('add item as admin', addItem);
        socket.on('edit user as admin', editUser);
        socket.on('edit location as admin', editLocation);
        socket.on('edit item as admin', editItem);
        socket.on('delete user as admin', deleteUser);
        socket.on('delete location as admin', deleteLocation);
        socket.on('delete item as admin', deleteItem);
        socket.on('get all roles', getAllRoles);
        socket.on('get roles', getRoles);
        socket.on('edit roles as admin', editRoles);
    }

    io.on('connection', listen);
};