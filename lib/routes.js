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

var Joi     = require('joi');
var Promise = require('bluebird');
var db      = require('./db.js');
var subscr  = require('./subscription.js');
var alrm    = require('./alarms.js');

var genericMeasurements = {
  types: [
    {endPoint: 'cpuidle', description: 'Get the latest value of idle CPU ' +
      'usage on a specific instance'},
    {endPoint: 'cpu_util', description: 'Get the latest value of CPU ' +
      'utilisation on a specific instance'},
    {endPoint: 'fsfree', description: 'Get the latest root filesystem ' +
      'status on a specific instance'},
    {endPoint: 'memfree', description: 'Get the latest value of free memory ' +
      'on a specific instance'},
    {endPoint: 'network_incoming', description: 'Get the latest value of ' +
      'rate of incoming bytes on a specific instance'},
    {endPoint: 'network_outgoing', description: 'Get the latest value of ' +
      'rate of outgoing bytes on a specific instance'},
    {endPoint: 'load_shortterm', description: 'Get the latest value of load ' +
      'average of the past one minute'},
    {endPoint: 'load_midterm', description: 'Get the latest value of load ' +
      'average of the past five minutes'},
    {endPoint: 'load_longterm', description: 'Get the latest value of load ' +
      'average of the past fifteen minutes'},
    {endPoint: 'processes_blocked', description: 'Get the latest value of ' +
      'blocked processes'},
    {endPoint: 'processes_paging', description: 'Get the latest value of ' +
      'paging processes'},
    {endPoint: 'processes_running', description: 'Get the latest value of ' +
    'running processes'},
    {endPoint: 'processes_sleeping', description: 'Get the latest value of ' +
      'sleeping processes'},
    {endPoint: 'processes_stopped', description: 'Get the latest value of ' +
      'stopped processes'},
    {endPoint: 'processes_zombie', description: 'Get the latest value of ' +
      'zombie processes'}
  ],
  tag: 'measurement/generic'
};

var proxyMeasurements = {
  types: [
    {endPoint: 'cachediskutilization', description: 'Cache disk utilization'},
    {endPoint: 'cachememkutilization',
      description: 'Cache memory utilization'},
    {endPoint: 'cpuusage',
      description: 'CPU consumed by Squid for the last 5 minutes'},
    {endPoint: 'diskhits', description: 'Disk hits percentage for the last ' +
      '5 minutes (hits that are logged as TCP_HIT)'},
    {endPoint: 'hits', description: 'Cache hits percentage of all requests ' +
      'for the last 5 minutes'},
    {endPoint: 'hits_bytes', description: 'Cache hits percentage of bytes ' +
      'sent for the last 5 minutes'},
    {endPoint: 'httpnum', description: 'Number of HTTP requests received'},
    {endPoint: 'memoryhits', description: 'Memory hits percentage for the ' +
      'last 5 minutes (hits that are logged as TCP_MEM_HIT)'},
    {endPoint: 'usernum', description: 'Number of users accessing the proxy'}
  ],
  tag: 'measurement/proxy'
};

var sbcMeasurements = {
  types: [
    {endPoint: 'rtp_frame_loss', description: 'RTP frame loss'},
    {endPoint: 'rtp_pack_in', description: 'Number of incoming RTP packets'},
    {endPoint: 'rtp_pack_in_byte', description: 'Number of incoming RTP bytes'},
    {endPoint: 'rtp_pack_out', description: 'Number of outgoing RTP packets'},
    {endPoint: 'rtp_pack_out_byte', description: 'Number of outgoing RTP bytes'}
  ],
  tag: 'measurement/sbc'
};

var tcMeasurements = {
  types: [
    {endPoint: 'mbits_packets_all', description: 'Bandwidth for all ' +
      'allowed traffic'},
    {endPoint: 'mbits_packets_apple', description: 'Bandwidth for ' +
      'Apple-related traffic'},
    {endPoint: 'mbits_packets_bittorrent', description: 'Bandwidth for ' +
      'BitTorrent traffic'},
    {endPoint: 'mbits_packets_dns', description: 'Bandwidth for DNS traffic'},
    {endPoint: 'mbits_packets_dropbox', description: 'Bandwidth for ' +
      'Dropbox traffic'},
    {endPoint: 'mbits_packets_google', description: 'Bandwidth for ' +
      'Google-related traffic'},
    {endPoint: 'mbits_packets_http', description: 'Bandwidth for ' +
      'HTTP traffic'},
    {endPoint: 'mbits_packets_icloud', description: 'Bandwidth for ' +
      'iCloud traffic'},
    {endPoint: 'mbits_packets_skype', description: 'Bandwidth for ' +
      'Skype traffic'},
    {endPoint: 'mbits_packets_twitter', description: 'Bandwidth for ' +
      'Twitter traffic'},
    {endPoint: 'mbits_packets_viber', description: 'Bandwidth for ' +
      'Viber traffic'},
    {endPoint: 'mbits_packets_youtube', description: 'Bandwidth for ' +
      'Youtube traffic'}
  ],
  tag: 'measurement/tc'
};

var generateSingleMeasurementRoute = function(measurementType, tag) {
  return {
    method: 'GET',
    path: '/api/measurements/{instance}.' + measurementType.endPoint,
    config: {
      tags: ['api', tag],
      description: measurementType.description,
      validate: {
        params: {
          instance: Joi.string().required().description('Instance ID')
        }
      },
      handler: function(request, reply) {
        db.readLastMeasurement(request.params.instance,
                               measurementType.endPoint)
                               .then(reply)
                               .catch(function(reason) {
                                 reply(reason.message).code(404);
                               });
      }
    }
  };
};

var generateMultipleMeasurementRoutes = function(measurements) {
  return measurements.types.map(function(measurement) {
    return generateSingleMeasurementRoute(measurement, measurements.tag);
  });
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
    description: 'List the available measurement types',
    handler: function(request, reply) {
      reply((genericMeasurements.types).concat(proxyMeasurements.types)
           .concat(sbcMeasurements.types).concat(tcMeasurements.types));
    }
  }
}, {
  method: 'POST',
  path: '/api/measurements',
  config: {
    tags: ['api'],
    description: 'Get the latest measurements',
    validate: {
      payload: Joi.object().keys({
        types: Joi.array().items(Joi.string().required()).
        description('measurement types'),
        instances: Joi.array().items(Joi.string().required()).
        description('instances')
      })
    },
    handler: function(request, reply) {
      var dbRequest = {
        hosts: request.payload.instances,
        types: request.payload.types
      };
      db.readLastMeasurementsWithHostsAndTypes(dbRequest)
        .then(reply);
    }
  }
}, {
  method: 'POST',
  path: '/api/subscriptions',
  config: {
    tags: ['api', 'subscription'],
    description: 'Subscribe to measurement events',
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
      var newSubscription = subscr.addSubscription(
        {array: request.payload.instances},
        {array: request.payload.types},
        request.payload.interval,
        request.payload.callbackUrl
      );
      reply('Your subscription request has been registered successfully ' +
            `under ID ${newSubscription}`);
    }
  }
}, {
  method: 'GET',
  path: '/api/subscriptions',
  config: {
    tags: ['api', 'subscription'],
    description: 'Get all the active subscriptions',
    handler: function(request, reply) {
      reply(subscr.getSubscriptions());
    }
  }
}, {
  method: 'GET',
  path: '/api/subscriptions/{id}',
  config: {
    tags: ['api', 'subscription'],
    description: 'Get a specific subscription',
    validate: {
      params: {
        id: Joi.string().required().description('Subscription ID')
      }
    },
    handler: function(request, reply) {
      var response = subscr.getSubscription(request.params.id);
      if (response == {}) {
        reply('No subscription found').code(404);
      } else {
        reply(response);
      }
    }
  }
}, {
  method: 'DELETE',
  path: '/api/subscriptions/{id}',
  config: {
    tags: ['api', 'subscription'],
    description: 'Delete a specific subscription',
    validate: {
      params: {
        id: Joi.string().required().description('Subscription ID')
      }
    },
    handler: function(request, reply) {
      var response = subscr.delSubscription(request.params.id);
      if (response == -1) {
        reply('Subscription not found').code(404);
      } else {
        reply('Subscription was deleted');
      }
    }
  }
}, {
  method: 'POST',
  path: '/api/alarms',
  config: {
    tags: ['api', 'alarm'],
    description: 'Create an alarm event',
    validate: {
      payload: Joi.object().keys({
        triggers: Joi.array().items(Joi.object().keys({
          type: Joi.string().required().description('measurement type'),
          comparisonOperator: Joi.string()
            .valid(['lt', 'le', 'eq', 'ne', 'ge', 'gt']).required()
            .description('comparison operator'),
          threshold: Joi.number().required().description('threshold value')
        })).min(1).required().description('independent triggers'),
        instances: Joi.array().items(Joi.string().required()).min(1).required()
          .description('instances'),
        callbackUrl: Joi.string().uri().required().description('callback URL')
      })
    },
    handler: function(request, reply) {
      alrm.addAlarm(request.payload.triggers,
        request.payload.instances,
        request.payload.callbackUrl)
        .then(id => reply({status: 'alarm created', id: id}).code(201));
    }
  }
}, {
  method: 'GET',
  path: '/api/alarms',
  config: {
    tags: ['api', 'alarm'],
    description: 'List all the active alarms',
    handler: function(request, reply) {
      reply(alrm.listAlarms());
    }
  }
}, {
  method: 'GET',
  path: '/api/alarms/{id}',
  config: {
    tags: ['api', 'alarm'],
    description: 'Get a specific alarm',
    validate: {
      params: {
        id: Joi.string().required().description('Alarm ID')
      }
    },
    handler: function(request, reply) {
      alrm.getAlarm(request.params.id)
        .then(alarm => reply(alarm))
        .catch(error => {
          if (error === 'Not found') {
            reply(error).code(404);
          } else {
            reply(error).code(500);
          }
        });
    }
  }
}, {
  method: 'DELETE',
  path: '/api/alarms/{id}',
  config: {
    tags: ['api', 'alarm'],
    description: 'Delete a specific alarm',
    validate: {
      params: {
        id: Joi.string().required().description('Alarm ID')
      }
    },
    handler: function(request, reply) {
      alrm.delAlarm(request.params.id)
        .then(
          alarm => {
            return reply({id: request.params.id, status: 'alarm deleted'});
          },
          reason => {
            if (reason === 'Not found') {
              return reply(reason).code(404);
            } else {
              return reply(reason).code(500);
            }
          }
        );
    }
  }
}].concat(generateMultipleMeasurementRoutes(genericMeasurements))
.concat(generateMultipleMeasurementRoutes(proxyMeasurements))
.concat(generateMultipleMeasurementRoutes(sbcMeasurements))
.concat(generateMultipleMeasurementRoutes(tcMeasurements));

exports.routes = routes;
