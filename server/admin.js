var runInSeries = require('async-waterfall');

module.exports = function (io, db, logger, auth) {

    function listen(socket) {

        function getUsers(token) {
            var dbConnection, dbDone;

            function sendUsers(users, callback) {
                socket.emit('get users', users);
                logger.log('info', 'search for: ' + users);
                callback();
            }

            runInSeries([
                (cb) => { auth.verifyAdmin(token.token, cb); },
                (username, cb) => { db.createConnection(cb); },
                (con, done, cb) => { dbConnection = con; dbDone = done; cb(); },
                (cb) => { db.getUsers(dbConnection, cb); },
                sendUsers
            ], function (err, result) {
                if (err) throw err;
                dbDone();
            });
        }

        function getLocations(data) {
            var dbDone;

            function sendLocations(locations, callback) {
                socket.emit('get locations', locations);
                logger.log('info', 'search for: ' + locations);
                callback();
            }

            runInSeries([
                (cb) => { auth.verifyAdmin(data.token, cb); },
                (isAdmin, cb) => { db.createConnection(cb); },
                (con, done, cb) => { dbDone = done; db.getLocations(data.user, con, cb); },
                sendLocations
            ], function (err, result) {
                if (err) throw err;
                dbDone();
            });
        }

        function getItems(data) {
            var dbDone;

            function sendItems(items, callback) {
                socket.emit('get items', items);
                logger.log('info', 'search for: ' + items);
                callback();
            }

            runInSeries([
                (cb) => { auth.verifyAdmin(data.token, cb); },
                (isAdmin, cb) => { db.createConnection(cb); },
                (con, done, cb) => { dbDone = done; db.getItems(data.user, data.location, con, cb); },
                sendItems
            ], function (err, result) {
                if (err) throw err;
                dbDone();
            });
        }

        function addLocation(data) {
            var dbDone;

            runInSeries([
                (cb) => { auth.verifyAdmin(data.token, cb); },
                (isAdmin, cb) => { db.createConnection(cb); },
                (con, done, cb) => { dbDone = done; db.addLocation(data.user, data.location, con, cb); }
            ], function (err, result) {
                if (err) throw err;
                dbDone();
            });
        }

        function addItem(data) {
            var dbDone;

            runInSeries([
                (cb) => { auth.verifyAdmin(data.token, cb); },
                (isAdmin, cb) => { db.createConnection(cb); },
                (con, done, cb) => { dbDone = done; db.addItem(data.user, data.location, data.item, con, cb); }
            ], function (err, result) {
                if (err) throw err;
                dbDone();
            });
        }

        socket.on('get users', getUsers);
        socket.on('get locations', getLocations);
        socket.on('get items', getItems);
        socket.on('add location as admin', addLocation);
        socket.on('add item as admin', addItem);
    }

    io.on('connection', listen);
};