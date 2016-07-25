var runInSeries = require('async-waterfall');

module.exports = function (io, db, logger, auth) {

    function listen(socket) {

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
