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
var db      = require('./db.js');
var rp      = require('request-promise');
var winston = require('winston');

var subscriptions = [];

var ID = function () {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  // Might have an issue with more than 10000 unique IDs
  // (https://gist.github.com/gordonbrander/2230317)
  return '_' + Math.random().toString(36).substr(2, 9);
};

var addSubscription = function (instances, measurementTypes, interval, callbackUrl) {
  var job = new CronJob('0 */' + parseInt(interval) +
    ' * * * *', function() {
    Promise.all(instances.array.map(function(instance) {
        var args = measurementTypes.array.slice();
        args.unshift(instance);
        return db.readLastMeasurementsWithHostAndTypes.apply(this, args);
      }))
      .then(function(result) {
        var options = {
          uri: callbackUrl,
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
  }, null, true, 'Europe/Athens');

  var newSubscription = {
    id: ID(),
    instances: instances.array,
    measurementTypes: measurementTypes.array,
    interval: interval,
    callbackUrl: callbackUrl,
    job: job
  };

  subscriptions.push(newSubscription);

  return newSubscription.id;
};

var getSubscription = function (id) {
  var foundSubscription = subscriptions.find(function (element) {
    return element['id'] == id;
  });
  if (typeof foundSubscription == 'undefined') {
    return {};
  } else {
    return {
      instances: foundSubscription.instances,
      measurementTypes: foundSubscription.measurementTypes,
      interval: foundSubscription.interval,
      callbackUrl: foundSubscription.callbackUrl
    };
  }
};

var getSubscriptions = function () {
  return subscriptions.map(function(subscription) {
    return {
      id: subscription.id,
      instances: subscription.instances,
      measurementTypes: subscription.measurementTypes,
      interval: subscription.interval,
      callbackUrl: subscription.callbackUrl
    };
  })
};

var delSubscription = function (id) {
  var foundSubscriptionIndex = subscriptions.findIndex(function (element) {
    return element['id'] == id;
  });
  if (foundSubscriptionIndex == -1) {
    return -1;
  } else {
    subscriptions[foundSubscriptionIndex].job.stop();
    subscriptions.splice(foundSubscriptionIndex, 1);
    return 0;
  }
};

exports.addSubscription = addSubscription;
exports.getSubscription = getSubscription;
exports.getSubscriptions = getSubscriptions;
exports.delSubscription = delSubscription;