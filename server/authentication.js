// TODO
// email verification
// password reset with email
// test with valid but wrong JWT
// renew JWT after one day

var bcrypt = require('bcrypt-nodejs');
var readline = require('readline');
var crypto = require('crypto');
var nJwt = require('njwt');
var runInSeries = require('async-waterfall');

module.exports = function (io, db, logger) {
    var serverUnderDevelopment = true;
    var signingKey;
    var auth = {};

    auth.tokenCache = {};

    if (serverUnderDevelopment)
        generatePassword('development');
    else
        promptForPassword();

    function generatePassword(secret) {
        crypto.pbkdf2(secret, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1', 100000, 32, 'sha512', (err, key) => {
            if (err) throw err;
            logger.log('info', 'Signing key is ' + key.toString('hex'));
            signingKey = key;
        });
    }

    function promptForPassword() {
        console.log('Please enter the password: >');
        var pwPrompt = readline.createInterface(process.stdin, process.stdout);
        pwPrompt.prompt();
        pwPrompt.on('line', (password) => { generatePassword(password); });
    }


    auth.hashPassword = function (value, callback) {
        bcrypt.genSalt(10, (err, salt) => {
            if (err) throw err;
            bcrypt.hash(value, salt, null, (err, hash) => {
                callback(err, hash);
            });
        });
    }

    function listen(socket) {

        function generateToken(user_id, callback) {

            function createJWT(user_id, key) {
                var claims = {
                    iss: "http://shoogle.com/",  // The URL of your service
                    sub: user_id,    // The UID of the user in your system
                    scope: "self",    // the user rights
                };
                var jwt = nJwt.create(claims, key);
                var oneWeek = new Date().getTime() + (1000 * 60 * 60 * 24 * 7);
                jwt.setExpiration(oneWeek);
                return jwt.compact();
            }

            var token = createJWT(user_id, signingKey);
            socket.emit('store token', token);
            auth.tokenCache[token] = user_id;
            auth.hashPassword(token, (err, hashedToken) => {
                callback(err, hashedToken);
            });
        }

        function getAndSendUserRoles(user_id, db, dbCon, callback) {
            db.getUserRoles(user_id, dbCon, function (err, roles) {
                socket.emit('roles', roles);
            });
        }

        function registerUser(data) {
            var dbConnection, dbDone;
            var user_id;

            function userExistsInDb(callback) {
                db.userExists(data.username, dbConnection, callback);
            }

            function checkUserExistsInDb(userExists, callback) {
                if (userExists) {
                    logger.log('info', 'User ' + data.username + ' tries to register with already assigned username');
                    socket.emit('register user', 'username assigned');
                    callback('user exists');
                } else {
                    logger.log('info', 'reqister new user ' + data.username);
                    socket.emit('register user', 'register ok');
                    callback();
                }
            }

            function createUserInDb(callback) {
                auth.hashPassword(data.password, (err, hashedPw) => {
                    db.addUser(data.username, hashedPw, dbConnection, (err, user_id) => {
                        callback(err, user_id);
                    });
                });
            }

            runInSeries([
                db.createConnection,
                (con, done, cb) => { dbConnection = con; dbDone = done; cb(); },
                userExistsInDb,
                checkUserExistsInDb,
                createUserInDb,
                (_user_id, cb) => { user_id = _user_id; generateToken(_user_id, cb); },
                (token, cb) => { db.storeToken(user_id, token, cb); }
            ], function (err, added) {
                if (err == 'user exists') err = '';
                if (err) throw err;
                dbDone();
            });
        }

        function loginUser(data) {
            var dbConnection, dbDone;
            var user_id;

            function userExistsInDb(callback) {
                db.userExists(data.username, dbConnection, (err, user_id) => {
                    if (user_id == 0) {
                        callback('user not exists');
                        logger.log('info', 'unregistered user tries to login');
                        socket.emit('login user', 'unknown user');
                    } else {
                        callback(err, user_id);
                    }
                });
            }

            function comparePasswords(hashedPwFromDb, callback) {
                bcrypt.compare(data.password, hashedPwFromDb, (err, result) => {
                    if (result) {
                        logger.log('info', 'user ' + data.username + ' is logging in');
                        socket.emit('login user', 'login ok');
                        callback();
                    } else {
                        logger.log('info', 'user ' + data.username + ' has wrong password');
                        socket.emit('login user', 'wrong password');
                        callback('wrong password');
                    }
                });
            }

            runInSeries([
                db.createConnection,
                (con, done, cb) => { dbConnection = con; dbDone = done; cb(); },
                userExistsInDb,
                (_user_id, cb) => { user_id = _user_id; db.getPassword(_user_id, dbConnection, cb); },
                comparePasswords,
                (cb) => { generateToken(user_id, cb); },
                (hashedToken, cb) => { db.storeToken(user_id, hashedToken, dbConnection, cb); },
                (cb) => { getAndSendUserRoles(user_id, db, dbConnection, cb); }
            ], (err, login) => {
                if (err == 'user not exists') err = '';
                if (err == 'wrong password') err = '';
                if (err) throw err;
                dbDone();
            });
        }

        function loginToken(data) {
            var dbConnection, dbDone;
            var user_id;

            function checkVerification(verifiedJWT, callback) {
                user_id = verifiedJWT.body.sub;
                callback();
            }

            function compareTokens(hashedToken, callback) {
                bcrypt.compare(data.token, hashedToken, (err, result) => {
                    if (result) {
                        logger.log('info', 'User with id ' + user_id + ' logging in with token');
                        socket.emit('login token', 'login ok');
                    } else {
                        logger.log('warning', 'token mismatch');
                        socket.emit('login token', 'token mismatch');
                    }
                    callback(err);
                });
            }

            runInSeries([
                (cb) => { nJwt.verify(data.token, signingKey, cb); },
                checkVerification,
                db.createConnection,
                (con, done, cb) => { dbConnection = con; dbDone = done; cb(); },
                (cb) => { db.getToken(user_id, dbConnection, cb); },
                compareTokens,
                (cb) => { generateToken(user_id, cb); },
                (hashedToken, cb) => { db.storeToken(user_id, hashedToken, dbConnection, cb); },
                (cb) => { getAndSendUserRoles(user_id, db, dbConnection, cb); }
            ], (err, login) => {
                if (err == 'token invalid') err = '';
                else if (err == 'token not found') {
                    logger.log('warn', err);
                    socket.emit('login token', 'token invalid');
                    err = '';
                } else if (err == 'JwtParseError: Jwt cannot be parsed') {
                    logger.log('warn', err);
                    socket.emit('login token', 'token invalid');
                    err = '';
                } else {
                    if (err) throw err;
                    dbDone();
                }
            });
        }

        socket.on('register user', registerUser);
        socket.on('login user', loginUser);
        socket.on('login token', loginToken);
    }

    auth.verifyUser = function (token, callback) {
        var user;
        var error = 'user not verified';

        function checkVerification(verifiedJWT, callback) {
            user = verifiedJWT.body.sub;
            callback();
        }

        function compareTokens(hashedToken, callback) {
            bcrypt.compare(token, hashedToken, (err, result) => {
                if (result) {
                    logger.log('info', 'User ' + user + ' verified');
                    callback(err);
                } else {
                    logger.log('warning', 'token mismatch');
                    if (err) callback(err);
                    else callback('token mismatch');
                }
            });
        }

        var cached_user_id = auth.tokenCache[token];
        if (typeof cached_user_id === 'undefined') {
            runInSeries([
                (cb) => { nJwt.verify(token, signingKey, cb); },
                checkVerification,
                db.createConnection,
                (con, done, cb) => { dbConnection = con; dbDone = done; cb(); },
                (cb) => { db.getToken(user, dbConnection, cb); },
                compareTokens
            ], function (err, result) {
                if (err == 'token mismatch') err = '';
                else if (err == 'token not found') {
                    logger.log('warn', err);
                    socket.emit('login token', 'token invalid');
                    err = '';
                } else if (err) throw err;
                else error = '';
                dbDone();
                callback(error, user);
            });
        } else {
            callback(false, cached_user_id);
        }
    }

    // verify that user exists and it has the role 'admin'
    auth.verifyAdmin = function (token, callback) {
        var user_id;
        var dbDone;
        var err = true;
        var isAdmin = false;

        runInSeries([
            (cb) =>  { auth.verifyUser(token, cb); },
            (_user_id, cb) => { user_id = _user_id; db.createConnection(cb); },
            (con, done, cb) => { dbDone = done; db.getUserRoles(user_id, con, cb); }
        ], function (err, roles) {
            if (err) throw err;
            for (i=0; i<roles.length; i++) {
                if (roles[i] == 'admin') {
                    err = false;
                    isAdmin = true;
                    break;
                }
            }
            callback(err, isAdmin);
        });
    }

    io.on('connection', listen);

    return auth;
}
