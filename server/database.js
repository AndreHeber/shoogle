var pg = require('pg');

module.exports = function (logger, ready) {
  var dbThreadPool;

  function init() {
    dbThreadPool = new pg.Pool({
      user: 'vagrant', //env var: PGUSER
      database: 'test', //env var: PGDATABASE
      password: 'vagrant', //env var: PGPASSWORD
      port: 5432, //env var: PGPORT
      max: 10, // max number of clients in the pool
      idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    });

    var createDatabaseTables = [
    'create table if not exists chat (' +
      'id serial primary key,' +
      'text text not null' +
    ');',
    'create table if not exists users (' +
      'id serial primary key,' +
      'name text not null,' +
      'password text not null,' +
      'token text not null' +
    ');',
    'create table if not exists locations (' +
      'id serial primary key,' +
      'user_id integer references users (id),' +
      'name text not null,' +
      'latitude double precision not null,' +
      'longitude double precision not null' +
    ');',
    'create table if not exists items (' +
      'id serial primary key,' +
      'location_id integer references locations (id),' +
      'name text not null,' +
      'description text not null' +
    ');'];

    function runQuery(client, i) {
      if (i < createDatabaseTables.length) {
        client.query(createDatabaseTables[i], [], (err, result) => { if(err) throw err; });
        runQuery(client, i+1);
      }
      else
        ready();
    }

    dbThreadPool.connect(function(err, client, done) {
      runQuery(client, 0);
    });
  }
  init();

  dbThreadPool.createConnection = function(callback) {
    dbThreadPool.connect((err, db, done) => {
      callback(err, db, done);
    });
  }

  dbThreadPool.addUser = function(user, hash, token, db, callback) {
    db.query('insert into users (name, password, token) values ($1, $2, $3) returning id;', [user, hash, token], (err, result) => {
      callback(err, result.rows[0]);
    });
  }

  dbThreadPool.getUser = function(username, db, callback) {
    db.query('select * from users where name = $1;', [username], (err, result) => {
      callback(err, result.rows[0]);
    });
  }

  dbThreadPool.userExists = function(user, db, callback) {
    db.query('select count(*) from users where name = $1;', [user], (err, result) => {
      var exists = parseInt(result.rows[0].count);
      callback(err, exists);
    });
  }

  dbThreadPool.getPassword = function(user, db, callback) {
    db.query('select password from users where name = $1;',  [user], (err, result) => {
      callback(err, result.rows[0].password);
    });
  }

  dbThreadPool.getToken = function(user, db, callback) {
    db.query('select token from users where name = $1;',  [user], (err, result) => {
      callback(err, result.rows[0].token);
    });
  }

  dbThreadPool.storeToken = function(user, token, db, callback) {
    db.query('update users set token = $1 where name = $2;',  [token, user], (err, result) => {
      callback(err, result.rowCount);
    });
  }

  dbThreadPool.addLocation = function(user_id, location, db, callback) {
    db.query('insert into locations (user_id, name, latitude, longitude) values ($1, $2, $3, $4) returning id;', [user_id, location.name, location.latitude, location.longitude], (err, result) => {
      callback(err, result.rows[0]);
    });
  }

  dbThreadPool.getLocation = function(user_id, location, db, callback) {
    db.query('select * from locations where user_id = $1 and name = $2;', [user_id, location.name], (err, result) => {
      callback(err, result.rows[0]);
    });
  }

  dbThreadPool.addItem = function(location_id, item, db, callback) {
    db.query('insert into items (location_id, name, description) values ($1, $2, $3) returning id;', [location_id, item.name, item.description], (err, result) => {
      callback(err, result.rows[0]);
    });
  }

  dbThreadPool.searchItem = function(item, db, callback) {
    //db.query('select *')
  }

  return dbThreadPool;
}
