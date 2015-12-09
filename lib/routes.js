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

var CronJob = require('cron').CronJob;
var Joi     = require('joi');
var Promise = require('bluebird');
var rp      = require('request-promise');
var winston = require('winston');
var db      = require('./db.js');

var measurementTypes = [
  {endPoint:"cpuidle", description:"Get the latest value of idle CPU usage on a specific instance"},
  {endPoint:"cpu_util", description:"Get the latest value of CPU utilisation on a specific instance"},
  {endPoint:"fsfree", description:"Get the latest root filesystem status on a specific instance"},
  {endPoint:"memfree", description:"Get the latest value of free memory on a specific instance"},
  {endPoint:"network_incoming", description:"Get the latest value of rate of incoming bytes on a specific instance"},
  {endPoint:"network_outgoing", description:"Get the latest value of rate of outgoing bytes on a specific instance"},
  {endPoint:"load_shortterm", description:"Get the latest value of load average of the past one minute"},
  {endPoint:"load_midterm", description:"Get the latest value of load average of the past five minutes"},
  {endPoint:"load_longterm", description:"Get the latest value of load average of the past fifteen minutes"},
  {endPoint:"processes_blocked", description:"Get the latest value of blocked processes"},
  {endPoint:"processes_paging", description:"Get the latest value of paging processes"},
  {endPoint:"processes_running", description:"Get the latest value of running processes"},
  {endPoint:"processes_sleeping", description:"Get the latest value of sleeping processes"},
  {endPoint:"processes_stopped", description:"Get the latest value of stopped processes"},
  {endPoint:"processes_zombie", description:"Get the latest value of zombie processes"}
];

var generateSingleMeasurementRoute = function(measurementType) {
  return {
    method: 'GET',
    path: '/api/measurements/{instance}.' + measurementType.endPoint,
    config: {
      tags: ['api'],
      description: measurementType.description,
      validate: {
        params: {
          instance: Joi.string().required().description('Instance ID')
        }
      },
      handler: function(request, reply) {
        db.readLastMeasurement(request.params.instance, measurementType.endPoint)
          .then(reply)
          .catch(function(reason) {
            reply(reason.message).code(404);
          });
      }
    }
  };
};

var generateMultipleMeasurementRoutes = function(measurementTypes) {
  return measurementTypes.map(generateSingleMeasurementRoute);
};

var routes = [{
  path: '/',
  method: 'GET',
  handler: function(request, reply) {
    reply.redirect('/docs');
  }
}, {
  method: 'GET',
  path: '/api/measurementTypes',
  config: {
    tags: ['api'],
    description: 'Get the available measurement types',
    handler: function(request, reply) {
      reply(measurementTypes);
    }
  }
}, {
  method: 'POST',
  path: '/api/measurements',
  config: {
    tags: ['api'],
    description: 'Show a last measurement event',
    validate: {
      payload: Joi.object().keys({
        types: Joi.array().items(Joi.string().required()).
        description('measurement types'),
        instances: Joi.array().items(Joi.string().required()).
        description('instances')
      })
    },
    handler: function(request, reply) {
      Promise.all(request.payload.instances.map(function(x) {
          var args = request.payload.types.slice();
          args.unshift(x);
          return db.readLastMeasurementsWithHostAndTypes.apply(this, args);
        }))
        .then(reply);
    }
  }
}, {
  method: 'POST',
  path: '/api/subscribe',
  config: {
    tags: ['api'],
    description: 'Subscribe to a measurement event',
    validate: {
      payload: Joi.object().keys({
        types: Joi.array().items(Joi.string().required()).
        description('measurement types'),
        instances: Joi.array().items(Joi.string().required()).
        description('instances'),
        interval: Joi.number().integer().required().
        description('interval in minutes'),
        callbackUrl: Joi.string().uri().required().
        description('callback URL')
      })
    },
    handler: function(request, reply) {
      new CronJob('0 */' + parseInt(request.payload.interval) +
        ' * * * *', function() {
        Promise.all(request.payload.instances.map(function(x) {
            var args = request.payload.types.slice();
            args.unshift(x);
            return db.readLastMeasurementsWithHostAndTypes.apply(this, args);
          }))
          .then(function(result) {
            var options = {
              uri: request.payload.callbackUrl,
              method: 'POST',
              json: true,
              simple: true,
              body: result
            };
            return rp(options);
          })
          .catch(function(reason) {
            winston.log('error', reason.message);
          });
        winston.log('info', 'subscription request was recorded');
      }, null, true, 'Europe/Athens');
      reply('Your request has been registered successfully. ' +
        'Information shall be sent every ' +
        request.payload.interval + ' minute(s)');
    }
  }
}].concat(generateMultipleMeasurementRoutes(measurementTypes));

exports.routes = routes;
