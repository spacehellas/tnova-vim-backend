/*
 Copyright (C) 2016 Space Hellas S.A.

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

'use strict';

const config = require('config');
const Promise = require('bluebird');
const db = require('./db.js');
const rp = require('request-promise');
const winston = require('winston');

const pollingInterval = config.get('alarms.pollingInterval');

var alarms = [];

var ID = function() {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  // Might have an issue with more than 10000 unique IDs
  // (https://gist.github.com/gordonbrander/2230317)
  return '_' + Math.random().toString(36).substr(2, 9);
};

var addAlarm = function(triggers, instances, callbackUrl) {
  return new Promise(resolve => {
    var newAlarm = {
      id: ID(),
      triggers: triggers,
      instances: instances,
      callbackUrl: callbackUrl
    };
    alarms.push(newAlarm);
    resolve(newAlarm.id);
  });
};

var listAlarms = function() {
  return alarms;
};

var getAlarm = function(id) {
  return new Promise((resolve, reject) => {
    var foundAlarm = alarms.find(element => {
      return element.id === id;
    });
    if (typeof foundAlarm == 'undefined') {
      reject('Not found');
    } else {
      resolve(foundAlarm);
    }
  });
};

var delAlarm = function(id) {
  return new Promise((resolve, reject) => {
    const foundAlarmIndex = alarms.findIndex(element => {
      return element.id == id;
    });
    if (foundAlarmIndex == -1) {
      reject('Not found');
    } else {
      alarms.splice(foundAlarmIndex, 1);
      resolve('OK');
    }
  });
};

var checkInstance = function(measurement, alarm, trigger, alarmingInstances,
                              callback) {
  // TODO check if measurement time is too old
  if (alarm.instances.indexOf(measurement.instance) !== -1) {
    var condition = undefined;
    switch (trigger.comparisonOperator) {
      case 'lt':
        condition = measurement.value < trigger.threshold;
        break;
      case 'le':
        condition = measurement.value <= trigger.threshold;
        break;
      case 'eq':
        condition = measurement.value == trigger.threshold;
        break;
      case 'ne':
        condition = measurement.value != trigger.threshold;
        break;
      case 'ge':
        condition = measurement.value <= trigger.threshold;
        break;
      case 'gt':
        condition = measurement.value < trigger.threshold;
        break;
      default:
        winston.log('error', `Incompatible comparison operator ` +
          `(${trigger.comparisonOperator}) in alarm ${alarm.id}`);
    }
    if (condition !== undefined) {
      if (condition) {
        alarmingInstances.push({
          instance: measurement.instance,
          value: measurement.value,
          time: measurement.time
        });
      }
    }
  }
  callback();
};

var checkAlarms = function() {
  for (let alarm of alarms) {
    for (let trigger of alarm.triggers) {
      db.readLastMeasurements(trigger.type).then(result => {
        var alarmingInstances = [];
        var itemsProcessed = 0;
        result.forEach((item, index, array) => {
          checkInstance(item, alarm, trigger, alarmingInstances,
            () => {
              itemsProcessed++;
              if (itemsProcessed === array.length) {
                if (alarmingInstances.length !== 0) {
                  var options = {
                    uri: alarm.callbackUrl,
                    method: 'POST',
                    json: true,
                    simple: true,
                    body: {
                      measurementType: trigger.type,
                      expected: trigger.comparisonOperator + ' ' +
                        trigger.threshold,
                      alarmingInstances
                    }
                  };
                  rp(options);
                }
              }
            });
        });
      }, () => {
        winston.log('error', 'Could not read measurements for multiple hosts');
      });
    }
  }
  setTimeout(checkAlarms, pollingInterval);
};

exports.addAlarm    = addAlarm;
exports.listAlarms  = listAlarms;
exports.getAlarm    = getAlarm;
exports.delAlarm    = delAlarm;
exports.checkAlarms = checkAlarms;
