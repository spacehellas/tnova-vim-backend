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

var config  = require('config');
var moment  = require('moment');
var Promise = require('bluebird');
var rp      = require('request-promise');
var winston = require('winston');
var db      = require('./db.js');

moment().format();

var pollingInterval = config.get('ceilometer.pollingInterval');

var token = {};

var refreshToken = function(currentToken) {

  if (typeof currentToken !== 'undefined') {
    if (currentToken.expiresAt > moment.utc().subtract(2, 'minutes')) {
      return new Promise(function(resolve, reject) {
        resolve(currentToken);
      });
    }
  }

  var identityHost     = config.get('identity.host');
  var identityPort     = config.get('identity.port');
  var tenantName       = config.get('identity.tenantName');
  var identityUsername = config.get('identity.username');
  var identityPassword = config.get('identity.password');

  var options = {
    uri: 'http://' + identityHost + ':' + identityPort + '/v2.0/tokens',
    method: 'POST',
    json: true,
    simple: true,
    body: {
      auth: {
        tenantName: tenantName,
        passwordCredentials: {
          username: identityUsername,
          password: identityPassword
        }
      }
    }
  };

  options.transform = function(data) {
    var newToken = {};
    winston.log('debug', data);
    newToken.id = data.access.token.id;
    newToken.expiresAt = Date.parse(data.access.token.expires);
    newToken.tenantId = data.access.token.tenant.id;
    token = newToken;
    return newToken;
  };

  return rp(options)
    .catch(function(data) {
      winston.log('error', 'Error getting a new token.');
    });
};

var getMeasurement = function(tokenId, measurementType) {

  var ceilometerHostname = config.get('ceilometer.host');
  var ceilometerPort = config.get('ceilometer.port');
  var instanceId = config.get('monitoring.instanceIds')[0];

  // OpenStack polls every 10 minutes for measurements by default
  // This is to ensure Ceilometer has a measurement available
  var currentTime = moment.utc();
  currentTime.seconds(0);
  currentTime.subtract(10, 'minutes');

  var measurementUrl = measurementType +
    '/statistics?aggregate.func=avg&' +
    'q.field=timestamp&q.op=gt&q.value=' +
    currentTime.format('YYYY-MM-DDTHH:mm:ss') + '&' +
    'q.field=resource_id&q.op=eq&q.value=' + instanceId;

  var options = {
    uri: 'http://' + ceilometerHostname + ':' +
      ceilometerPort + '/v2/meters/' + measurementUrl,
    method: 'GET',
    simple: true,
    json: true,
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': tokenId
    }
  };

  options.transform = function(data) {
    return data[0].avg;
  };

  return rp(options)
    .then(function(data) {
      // FIXME The current time is stored as the measurement's timestamp
      db.writeMeasurement('cpu_util', instanceId, data, currentTime);
    });
};

var getActiveInstances = function(currentToken) {

  var novaHost  = config.get('nova.host');
  var novaPort  = config.get('nova.port');

  var options = {
    uri: 'http://' + novaHost + ':' + novaPort + '/v2/' +
    currentToken.tenantId + '/servers?all_tenants=1',
    method: 'GET',
    simple: true,
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': currentToken.id
    }
  };

  options.transform = function(data) {
    return JSON.parse(data).servers.map(function(instance) {
      var rObj = instance;
      delete rObj.links;
      return rObj;
    });
  };

  return rp(options);
};

var getMeasurements = function() {
  refreshToken(token)
    .then(function(token) {
      getMeasurement(token.id, 'cpu_util');
    });
  setTimeout(getMeasurements, pollingInterval);
};

exports.getMeasurements = getMeasurements;
