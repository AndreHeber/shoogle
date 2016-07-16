

sudo -u postgres createuser --superuser $USER
sudo -u postgres psql
postgres=# \password $USER

createdb test

npm install
https://docs.npmjs.com/getting-started/fixing-npm-permissions

[![Build Status](https://travis-ci.org/AndreHeber/shoogle.svg?branch=master)](https://travis-ci.org/AndreHeber/shoogle)