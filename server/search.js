// User shall not have two locations with same name

var runInSeries = require('async-waterfall');

module.exports = function (io, db, logger, auth) {

    function listen(socket) {

        function search(item) {
        var dbConnection, dbDone;

            function sendFindings(findings, callback) {
                socket.emit('search item', {err: 0, result: findings});
                callback();
            }

            runInSeries([
                db.createConnection,
                (con, done, cb) => { dbConnection = con; dbDone = done; cb(); },
                (cb) => { db.searchItem(item, dbConnection, cb) },
                sendFindings
            ], function (err, result) {
                dbDone();
                if (err) throw err;
            });
            logger.log('info', 'search for: ' + item);
        }
        
        function suggest(item) {
        var dbConnection, dbDone;

            function sendSuggestions(findings, callback) {
                logger.log('info', 'suggestions for: ' + item);
                logger.log('info', 'are ' + findings);
                socket.emit('search suggestions', {err: 0, result: findings});
                callback(false);
            }

            runInSeries([
                db.createConnection,
                (con, done, cb) => { dbConnection = con; dbDone = done; cb(); },
                (cb) => { db.suggestItems(item, dbConnection, cb); },
                sendSuggestions
            ], function (err, result) {
                if (err) throw err;
                dbDone();
            });
        }

        socket.on('search item', search);
        socket.on('search suggestions', suggest);
    }

    io.on('connection', listen);
}
