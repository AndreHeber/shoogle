db = {};

function initDb() {
  var dexie = new Dexie('Shoogle');

  dexie.version(1).stores({
    login: ", token"
  });

  db.addToken = function(token) {
    dexie.login.put({token: token}, 1);
  }

  db.getToken = function(callback) {
    var token = dexie.login.get(1, callback);
  }

  db.deleteToken = function() {
    dexie.login.delete(1);
  }
};
initDb();
