var bcrypt = require('bcrypt-nodejs');
var readline = require('readline');
var crypto = require('crypto');
var nJwt = require('njwt');

module.exports = function (io, pool, logger) {
  var serverUnderDevelopment = true;
  var signingKey;

  if (serverUnderDevelopment)
    generatePassword('development');
  else
    promptForPassword();

  io.on('connection', (socket) => {
    socket.on('register user', function(data) {
      pool.connect(function(err, client, done) {
        client.query('select count(*) from users where name = $1;', [data.username], function(err, result) {
          if (result.rows[0].count == "1") {
            logger.log('info', 'user tries to register with already assigned username');
            socket.emit('register user', 'username assigned');
          } else {
            logger.log('info', 'reqister new user');
            socket.emit('register user', 'register ok');
            bcrypt.genSalt(10, function(err, salt) {
              bcrypt.hash(data.password, salt, null, function(err, hash) {
                client.query('INSERT INTO users (name, password) VALUES ($1, $2);', [data.username, hash], function(err, result) {
                  done();
                });
              });
            });
          }
        });
      });
    });

    socket.on('login user', function(data) {
      pool.connect(function(err, client, done) {
        client.query('select count(*) from users where name = $1;', [data.username], function(err, result) {
          if (result.rows[0].count == "1") {
            client.query('select password from users where name = $1',  [data.username], function(err, result) {
              bcrypt.compare(data.password, result.rows[0].password, function(err, result) {
                if (result) {
                  logger.log('info', 'registered user is logging in');
                  socket.emit('login user', 'login ok');
                } else {
                  logger.log('info', 'registered user has wrong password');
                  socket.emit('login user', 'wrong password');
                }
              });
            });
          } else {
            logger.log('info', 'unregistered user tries to login');
            socket.emit('login user', 'unknown user');
          }
          done();
        });
      });
    });
  })

  function generatePassword(secret) {
    crypto.pbkdf2(secret, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1', 100000, 32, 'sha512', (err, key) => {
      if (err) throw err;
      console.log(key.toString('hex'));
    });
  }

  function promptForPassword() {
    console.log('Please enter the password: >');
    var pwPrompt = readline.createInterface(process.stdin, process.stdout);
    pwPrompt.prompt();
    pwPrompt.on('line', (password) => { generatePassword(password); });
  }

  function createJWT(user, key) {
    var claims = {
      iss: "http://shoogle.com/",  // The URL of your service
      sub: user,    // The UID of the user in your system
      scope: "self",    // the user rights
    };
    var jwt = nJwt.create(claims, key);
    var oneWeek = new Date().getTime() + (1000*60*60*24*7);
    jwt.setExpiration(oneWeek);
    var token = jwt.compact();
    // hash JWT
    // store JWT
  }

  function verifyJWT(user, key, token) {
    // verify token
    nJwt.verify(token, signingKey, function(err, verifiedJwt) {
      if(err) throw err;
      // hash verifiedJwt
      // get hashed user JWT
      // must be equal
    });
  }

  function generateBcryptHash(value) {}
}
