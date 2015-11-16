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
var rp      = require('request-promise');
var winston = require('winston');
var db      = require('./db.js');

routes = [{
  path: '/',
  method: 'GET',
  handler: function(request, reply) {
    reply.redirect('/docs');
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
        instance: Joi.string().required().
        description('instance')
      })
    },
    handler: function(request, reply) {
      var args = request.payload.types;
      args.unshift(request.payload.instance);
      db.readLastMeasurementsWithHostAndTypes.apply(this, args)
          .then(function(result) {
            reply(result);
          })
          .catch(function(reason) {
            reply(reason.message).code(404);
          });
    }
  }
}, {
  method: 'GET',
  path: '/api/measurements/{host}.cpuidle',
  config: {
    tags: ['api'],
    description: 'Get the latest value of idle CPU usage on a specific host',
    validate: {
      params: {
        host: Joi.string().required().description('host name')
      }
    },
    handler: function(request, reply) {
      db.readLastMeasurement(request.params.host, 'cpuidle')
                .then(function(result) {
                  reply(result);
                })
                .catch(function(reason) {
                  reply(reason.message).code(404);
                });
    }
  }
}, {
  method: 'GET',
  path: '/api/measurements/{host}.fsfree',
  config: {
    tags: ['api'],
    description: 'Get the latest root filesystem status on a specific host',
    validate: {
      params: {
        host: Joi.string().required().description('host name')
      }
    },
    handler: function(request, reply) {
      db.readLastMeasurement(request.params.host, 'fsfree')
                .then(function(result) {
                  reply(result);
                })
                .catch(function(reason) {
                  reply(reason.message).code(404);
                });
    }
  }
}, {
  method: 'GET',
  path: '/api/measurements/{host}.memfree',
  config: {
    tags: ['api'],
    description: 'Get the latest value of free memory on a specific host',
    validate: {
      params: {
        host: Joi.string().required().description('host name')
      }
    },
    handler: function(request, reply) {
      db.readLastMeasurement(request.params.host, 'memfree')
                .then(function(result) {
                  reply(result);
                })
                .catch(function(reason) {
                  reply(reason.message).code(404);
                });
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
        instance: Joi.string().required().
        description('instance'),
        interval: Joi.number().integer().required().
        description('interval in minutes'),
        callbackUrl: Joi.string().uri().required().
        description('callback URL')
      })
    },
    handler: function(request, reply) {
      new CronJob('0 */' + parseInt(request.payload.interval) +
          ' * * * *', function() {
            var args = request.payload.types;
            args.unshift(request.payload.instance);
            db.readLastMeasurementsWithType.apply(this, args)
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
}];

exports.routes = routes;
