var pg = require('pg');

module.exports = function (logger, ready) {
  var databaseConfig = {
    user: 'vagrant', //env var: PGUSER
    database: 'test', //env var: PGDATABASE
    password: 'vagrant', //env var: PGPASSWORD
    port: 5432, //env var: PGPORT
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  };
  var pool = new pg.Pool(databaseConfig);

  var createDatabaseTables = [
  'create table if not exists chat (' +
    'id serial primary key,' +
    'text text not null' +
  ');',
  'create table if not exists users (' +
    'id serial primary key,' +
    'name text not null,' +
    'password text not null' +
  ');'];

  function runQuery(client, i) {
    if (i < createDatabaseTables.length) {
      client.query(createDatabaseTables[i], [], (err, result) => { if(err) throw err; });
      runQuery(client, i+1);
    }
    else
      ready();
  }

  pool.connect(function(err, client, done) {
    runQuery(client, 0);
  });

  return pool;
}

// full database example
    // pool.connect(function(err, client, done) {
    //   if(err) {
    //     return console.error('error fetching client from pool', err);
    //   }
    //   console.log('start insert');
    //   client.query('INSERT INTO chat (text) VALUES ($1);', [message], function(err, result) {
    //     //call `done()` to release the client back to the pool
    //     console.log('inserted');
    //     done();

    //     if(err) {
    //       return console.error('error running query', err);
    //     }
    //     console.log('from db: ' + result.rows[0].text);
    //   });
    // });
