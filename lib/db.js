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
var influent = require('influent');
var Promise  = require('bluebird');
var config   = require('config');

var dbHost     = config.get('database.host');
var dbPortTemp = config.get('database.port');
if (typeof dbPortTemp === 'string' || dbPortTemp instanceof String) {
  var dbPort   = parseInt(dbPortTemp);
} else {
  var dbPort   = dbPortTemp;
}
var dbUsername = config.get('database.username');
var dbPassword = config.get('database.password');
var dbName     = config.get('database.name');

var dbInflux = influent.createClient({
  username: dbUsername,
  password: dbPassword,
  database: dbName,
  server: [{
      protocol: 'http',
      host: dbHost,
      port: dbPort
    }]
});

var writeMeasurement = function(type, instance, value, timestamp) {
  winston.log('verbose', type + ': ' + value + ' @ ' + instance +
    ' recorded at: ' + timestamp);
  switch (type) {
    case 'network.incoming.bytes.rate':
      type = 'network_incoming';
      break;
    case 'network.outgoing.bytes.rate':
      type = 'network_outgoing';
  }
  dbInflux.then(function(client) {
    client.writeOne({
      key: type,
      tags: {
        host: instance
      },
      fields: {
        value: value
      },
      time: timestamp
    });
  });
};

var getHostLastMeasurementQuery = function(host, measurementType) {
  var type = undefined;
  var typeInstance = undefined;
  var instance = undefined;

  switch (measurementType) {
    case 'cpuidle':
      measurementType = 'aggregation_value';
      type = 'cpu';
      typeInstance = 'idle';
      break;
    case 'memfree':
      measurementType = 'memory_value';
      typeInstance = 'free';
      break;
    case 'fsfree':
      measurementType = 'df_value';
      typeInstance = 'free';
      instance = 'root';
      break;
    case 'load_shortterm':
      measurementType = 'load_shortterm';
      type = 'load';
      break;
    case 'load_midterm':
      measurementType = 'load_midterm';
      type = 'load';
      break;
    case 'load_longterm':
      measurementType = 'load_longterm';
      type = 'load';
      break;
    case 'processes_blocked':
      measurementType = 'processes_value';
      type = 'ps_state';
      typeInstance = 'blocked';
      break;
    case 'processes_paging':
      measurementType = 'processes_value';
      type = 'ps_state';
      typeInstance = 'paging';
      break;
    case 'processes_running':
      measurementType = 'processes_value';
      type = 'ps_state';
      typeInstance = 'running';
      break;
    case 'processes_sleeping':
      measurementType = 'processes_value';
      type = 'ps_state';
      typeInstance = 'sleeping';
      break;
    case 'processes_stopped':
      measurementType = 'processes_value';
      type = 'ps_state';
      typeInstance = 'stopped';
      break;
    case 'processes_zombie':
      measurementType = 'processes_value';
      type = 'ps_state';
      typeInstance = 'zombies';
      break;
  }

  var query = 'SELECT last(value) FROM ' + measurementType + ' WHERE host=\'' +
    host + '\'';

  if (typeof(type) !== 'undefined') {
    query = query + ' AND type=\'' + type + '\'';
  }
  if (typeof(typeInstance) !== 'undefined') {
    query = query + ' AND type_instance=\'' + typeInstance + '\'';
  }
  if (typeof(instance) !== 'undefined') {
    query = query + ' AND instance=\'' + instance + '\'';
  }

  return query;
};

var formatBytes = function(bytes, decimals) {
  if (bytes == 0) {
    return '0 Byte';
  }
  var k = 1000;
  var dm = decimals + 1 || 3;
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toPrecision(dm) + ' ' + sizes[i];
};

var readLastMeasurement = function(host, measurementType) {
  return new Promise(function(resolve, reject) {
    var query = getHostLastMeasurementQuery(host, measurementType);
    winston.log('debug', 'query: ' + query);
    dbInflux.then(function(client) {
      client
        .query(query)
        .then(function(result) {
          if ('series' in result.results[0]) {
            var meter = {};
            meter.timestamp = result.results[0].series[0].values[0][0];
            meter.value = result.results[0].series[0].values[0][1];
            switch (measurementType) {
              case 'cpu_util':
              // Proxy-related metrics - Start
              case 'cachediskutilization':
              case 'cachememkutilization':
              case 'cpuusage':
              case 'diskhits':
              case 'hits':
              case 'hits_bytes':
              case 'memoryhits':
                meter.units = 'percentage';
                break;
              // Proxy-related metrics - End
              case 'cpuidle':
                meter.units = 'jiffies';
                break;
              case 'memfree':
                var res = formatBytes(meter.value, 2).split(' ');
                meter.value = res[0];
                meter.unit = res[1];
                break;
              case 'fsfree':
                var res = formatBytes(meter.value, 2).split(' ');
                meter.value = res[0];
                meter.unit = res[1];
                break;
              case 'network_incoming':
              case 'network_outgoing':
                meter.units = 'Bytes / s';
                break;
              case 'load_shortterm':
              case 'load_midterm':
              case 'load_longterm':
                meter.units = 'runnable processes';
                break;
              case 'processes_blocked':
              case 'processes_paging':
              case 'processes_running':
              case 'processes_sleeping':
              case 'processes_stopped':
              case 'processes_zombie':
                meter.units = 'processes';
                break;
              // SBC-related metrics - Start
              case 'rtp_frame_loss':
                meter.units = 'frames';
                break;
              case 'rtp_pack_in':
              case 'rtp_pack_out':
                meter.units = 'packets';
                break;
              case 'rtp_pack_in_byte':
              case 'rtp_pack_out_byte':
                meter.units = 'Bytes';
                break;
              // SBC-related metrics - End
              // TC-related metrics - Start
              case 'mbits_packets_all':
              case 'mbits_packets_apple':
              case 'mbits_packets_bittorrent':
              case 'mbits_packets_dns':
              case 'mbits_packets_dropbox':
              case 'mbits_packets_google':
              case 'mbits_packets_http':
              case 'mbits_packets_icloud':
              case 'mbits_packets_skype':
              case 'mbits_packets_twitter':
              case 'mbits_packets_viber':
              case 'mbits_packets_youtube':
                meter.units = 'bits / s';
                break;
              // TC-related metrics - End
            }
            resolve(meter);
          } else {
            error = `Host (${host}) or measurement type (${measurementType})` +
              ` not found.`;
            winston.log('error', error);
            reject(error);
          }
        });
    });
  });
};

var readLastMeasurementWithType = function(host, measurementType) {
  return new Promise(function(resolve, reject) {
    readLastMeasurement(host, measurementType)
      .then(function(result) {
        var measurement = result;
        measurement.type = measurementType;
        resolve(measurement);
      })
      .catch(function(e) {
        reject(e);
      });
  });
};

var readLastMeasurementsWithHostAndTypes = function(host) {
  var args = Array.prototype.slice.call(arguments, 1);
  return Promise.all(args.map(function(x) {
    return readLastMeasurementWithType(host, x);
  }).map(function(promise) {
    return promise.reflect();
  })).filter(function(promise) {
    return promise.isFulfilled() == true;
  }).map(function(promise) {
    return promise.value();
  }).then(function(value) {
    var measurementGroup = {};
    measurementGroup.instance = host;
    measurementGroup.measurements = value;
    return measurementGroup;
  }).catch(function(reason) {
    winston.log('error', reason);
    return Promise.reject(reason);
  });
};

exports.writeMeasurement    = writeMeasurement;
exports.readLastMeasurement = readLastMeasurement;
exports.readLastMeasurementsWithHostAndTypes =
    readLastMeasurementsWithHostAndTypes;
