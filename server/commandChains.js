var runInSeries = require("async-waterfall");

module.exports = function (io, db, logger, auth) {
    "use strict";
    var commandChains = {};

    // a standard command chain:
    // var std_chain = {
    //     command: undefined,
    //     verifyUser: auth.verifyUser,
    //     isAllowed: undefined,
    //     checkData: undefined,
    //     prepareDataForDb: undefined,
    //     dbCommand: undefined,
    //     prepareDataForTransmit: undefined
    // }

    commandChains.add = function (chain) {
        var dbDone;
        var dataForDb;

        chain.logger = logger;
        chain.auth = auth;

        io.on("connection", function (socket) {
            socket.on(chain.command, function (data) {
                runInSeries([
                    function (cb) {
                        chain.verifyUser(data.token, cb);
                    },
                    function (id, cb) {
                        chain.isAllowed(id, data.user_id, cb);
                    },
                    function (ignore, cb) {
                        chain.checkData(data, cb);
                    },
                    function (ignore, cb) {
                        chain.prepareDataForDb(data, cb);
                    },
                    function (result, cb) {
                        dataForDb = result;
                        db.createConnection(cb);
                    },
                    function (con, done, cb) {
                        dbDone = done;
                        chain.dbCommand(con, dataForDb, cb);
                    },
                    function (result, cb) {
                        chain.prepareDataForTransmit(result, cb);
                    }
                ], function (err, result) {
                    if (dbDone) {
                        dbDone();
                    }
                    socket.emit(chain.command, {err: err, result: result});
                });
            });
        });
    };

    return commandChains;
};
