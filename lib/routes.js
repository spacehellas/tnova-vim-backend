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
  path: '/api/subscriptions',
  config: {
    tags: ['api'],
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
      var newSubscription = subscr.addSubscription({array: request.payload.instances},
        {array: request.payload.types}, request.payload.interval, request.payload.callbackUrl);
      reply('Your subscription request has been registered successfully under ID ' + newSubscription);
    }
  }
}, {
  method: 'GET',
  path: '/api/subscriptions',
  config: {
    tags: ['api'],
    description: 'Get all the active subscriptions',
    handler: function(request, reply) {
      reply(subscr.getSubscriptions());
    }
  }
}, {
  method: 'GET',
  path: '/api/subscriptions/{id}',
  config: {
    tags: ['api'],
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
    tags: ['api'],
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
}].concat(generateMultipleMeasurementRoutes(measurementTypes));

exports.routes = routes;
