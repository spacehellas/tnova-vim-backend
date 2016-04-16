/*
   Copyright (C) 2015-2016 Space Hellas S.A.

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

var winston  = require('winston');
var Hapi     = require('hapi');
var http     = require('http');

// Configuration variables
var config       = require('config');
var loggingLevel = config.get('loggingLevel');
var dbHost       = config.get('database.host');
var dbPortTemp   = config.get('database.port');
if (typeof dbPortTemp === 'string' || dbPortTemp instanceof String) {
  var dbPort = parseInt(dbPortTemp);
} else {
  var dbPort = dbPortTemp;
}

winston.level = loggingLevel;
winston.log('info', 'T-NOVA VIM monitoring system');

var openstack = require('./lib/openstack.js');
openstack.getMeasurements();

const alrm = require('./lib/alarms.js');
alrm.checkAlarms();

var server = new Hapi.Server();
server.connection({
  port: 3000,
  labels: ['api']
});

server.register([
  require('inert'),
  require('vision'),
  {
    register: require('hapi-swaggered'),
    options: {
      stripPrefix: '/api',
      info: {
        title: 'T-NOVA VIM Monitoring API',
        description: 'Powered by node, hapi, joi, hapi-swaggered,' +
          'hapi-swaggered-ui and swagger-ui',
        version: '0.1.4'
      },
      tagging: {
        mode: 'tags'
      },
      tags: {
        'measurement/generic': 'Demo of generic measurements',
        'measurement/proxy': 'Demo of vProxy-specific measurements',
        'measurement/sbc': 'Demo of vSBC-specific measurements',
        'measurement/tc': 'Demo of vTC-specific measurements',
        'subscription': 'Manage subscriptions'
      }
    }
  },
  {
    register: require('hapi-swaggered-ui'),
    options: {
      title: 'T-NOVA VIM Monitoring API',
      path: '/docs',
      swaggerOptions: {
        validatorUrl: null
      }
    }
  }], {
  select: 'api'
}, function(err) {
  if (err) {
    throw err;
  }
});

var Routes = require('./lib/routes.js');

// add routes
server.route(Routes.routes);

server.start(function() {
  winston.log('info', 'Server running at: ' + server.info.uri);
  winston.log('info', 'Configured to listen database host ' +
    dbHost + ' at port ' + dbPort);
});
