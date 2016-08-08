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
};

initDb();
