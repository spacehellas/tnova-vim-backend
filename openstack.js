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
var rp      = require('request-promise');
var winston = require('winston');

moment().format();

var getToken = function() {

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
    var token = {};
    winston.log('debug', data);
    token.id = data.access.token.id;
    token.expiresAt = data.access.token.expires;
    return token;
  };

  return rp(options);
};

var getMeasurement = function(tokenId, measurementType) {

  var ceilometerHostname = config.get('ceilometer.host');
  var ceilometerPort = config.get('ceilometer.port');
  var instanceId = config.get('monitoring.instanceIds')[0];

  // OpenStack polls every 10 minutes for measurements by default
  // This is to ensure Ceilometer has a measurement available
  var currentTime = moment();
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
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': tokenId
    }
  };

  options.transform = function(data) {
    var measurement = {};
    winston.log('debug', data);
    return measurement;
  };

  return rp(options);
};

exports.getToken       = getToken;
exports.getMeasurement = getMeasurement;
