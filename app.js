/*
   Copyright (C) 2015  Space Hellas S.A.

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>.
   */
var winston = require('winston');
var influent = require("influent");
var http = require('http');
var CronJob = require('cron').CronJob;

// Configuration variables
var config = require('config');
var loggingLevel       = config.get('loggingLevel');
var dbHost             = config.get('database.host');
var dbPort             = config.get('database.port');
var dbUsername         = config.get('database.username');
var dbPassword         = config.get('database.password');
var dbName             = config.get('database.name');
var pollingInterval    = config.get('ceilometer.pollingInterval');

winston.level = loggingLevel;
winston.log('info', 'T-NOVA VIM monitoring system');

// Database connection instantiation
var dbInflux = influent.createClient(
  {username : dbUsername,	password : dbPassword,
    database : dbName, server: [{ protocol : "http", host : dbHost, port : dbPort}]}
);

// Delete data older than 2 days at 3:05 every day
new CronJob('5 3 * * * *', function() {
  winston.log('verbose', 'Erasing old data from 2 days...');
  dbInflux.query('delete from cpu_util where time < now() - 2d');
  dbInflux.query('delete from disk.read.requests.rate where time < now() - 2d');
  dbInflux.query('delete from /^space-2.*/ where time < now() - 2d');
dbInflux.query('delete from /^ubuntu-amd64.*/ where time < now() - 2d');
}, null, true, 'Europe/Athens');

var writeMeasurement = function (name, value, timestamp) {
  winston.log('verbose', name + ': ' + value + ' recorded at: ' + timestamp.toDate());
  dbInflux.then(function (client) {
    client.writeOne({
      key: name,
      fields: {
        value: value
      },
      timestamp: timestamp.toDate()
    });
  });
};

// TODO Do not issue new token if the previous one is not expired

var openStack = require('./openstack.js'),
  getToken = openStack.getToken,
    getMeasurement = openStack.getMeasurement;

    getMeasurements = function () {
      getToken()
      .then(function (token) {
        getMeasurement(token.id, 'cpu_util');
      })
      .catch(function (data) {
        winston.log('error', 'Error getting a new token.');
      });
      setTimeout(getMeasurements, pollingInterval);
    };

    getMeasurements();
