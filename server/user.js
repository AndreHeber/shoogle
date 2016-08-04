var runInSeries = require('async-waterfall');

module.exports = function (io, db, logger, auth) {

    function listen(socket) {

        function addLocation(data) {
            var user_id, dbDone;

            function sendLocation(location_id, callback) {
                socket.emit('add location', location_id);
                callback();
            }

            logger.log('info', 'keks');

            runInSeries([
                (cb) => { auth.verifyUser(data.token, cb); },
                (_user_id, cb) => { user_id = _user_id; db.createConnection(cb); },
                (con, done, cb) => { dbDone = done; db.addLocation(user_id, data.location, con, cb); },
                sendLocation
            ], function (err, result) {
                if (err) throw err;
                dbDone();
            });
        }

        function addItem(data) {
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

        socket.on('add location', addLocation);
        socket.on('add item', addItem);
    }

    io.on('connection', listen);
};
