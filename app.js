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

var influx = require('influx');
var http = require('http');
var CronJob = require('cron').CronJob;
var moment = require('moment');
moment().format();

// Configuration variables
var pollingInterval = 10000; // in milliseconds
var dbHost = 'localhost';
var dbUsername = 'root';
var dbPassword = 'root';
var dbName = 'statsdb';
var tenantName = 'tenant';
var identityHost = 'localhost';
var identityPort = 5000;
var identityUsername = 'username';
var identityPassword = 'pass';
var ceilometerHostname = 'localhost';
var ceilometerPort = 8777;
var instanceId = '27ad39af-0267-4f81-bdc6-deda0d64c9ac';

// Database connection instantiation
var dbInflux = influx({host : dbHost, username : dbUsername,
	password : dbPassword, database : dbName});

// TODO Do not issue new token if the previous one is not expired

// Delete data older than 2 days at 3:05 every day
new CronJob('5 3 * * * *', function() {
	console.log('Erasing old data from 2 days...');
	dbInflux.query('delete from cpu_util where time < now() - 2d');
	dbInflux.query('delete from disk.read.requests.rate where time < now() - 2d');
	dbInflux.query('delete from /^space-2.*/ where time < now() - 2d');
	dbInflux.query('delete from /^ubuntu-amd64.*/ where time < now() - 2d');
}, null, true, 'Europe/Athens');

var writeMeasurement = function (name, value, timestamp) {
	console.log(name + ': ' + value + ' recorded at: ' + timestamp.toDate());
	dbInflux.writePoint(name, { time: timestamp.toDate(), value: value});
},

	getMeasurement = function (tokenId, measurementType) {
		// OpenStack polls every 10 minutes for measurements by default
		// This is to ensure Ceilometer has a measurement available
		var currentTime = moment();
		currentTime.seconds(0);
		currentTime.subtract(10, 'minutes');

		var measurementUrl = measurementType + '/statistics?aggregate.func=avg&' +
			'q.field=timestamp&q.op=gt&q.value=' + currentTime.format("YYYY-MM-DDTHH:mm:ss") + '&' +
			'q.field=resource_id&q.op=eq&q.value=' + instanceId;

		var options = {
			hostname: ceilometerHostname,
			port: ceilometerPort,
			path: '/v2/meters/' + measurementUrl,
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-Auth-Token': tokenId
			}
		};

		var measurementRequest = http.request(options, function(res) {
			var output = '';
			res.setEncoding('utf8');

			res.on('data', function (chunk) {
				output += chunk;
			});

			res.on('end', function() {
				var measurement = JSON.parse(output);
				if (Object.keys(measurement).length != 0) {
					writeMeasurement(measurementType, measurement[0].avg, currentTime);
				}
			});
		});

		measurementRequest.end();

	},

	getToken = function () {
		var identity = '{"auth": {"tenantName": "' + tenantName + '", "passwordCredentials":{"username": "' +
			identityUsername + '", "password": "' + identityPassword + '"}}}';

		var options = {
			hostname: identityHost,
			port: identityPort,
			path: '/v2.0/tokens',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(identity)
			}
		};

		var tokenRequest = http.request(options, function(res) {
			var output = '';

			res.setEncoding('utf8');

			res.on('data', function (chunk) {
				output += chunk;
			});

			res.on('end', function() {
				var token = JSON.parse(output);
				getMeasurement(token.access.token.id, 'cpu_util');
				getMeasurement(token.access.token.id, 'disk.read.requests.rate');
			});
		});

		tokenRequest.on('error', function(e) {
			console.log('Problem with request: ' + e.message);
		});

		tokenRequest.write(identity);
		tokenRequest.end();
		setTimeout(getToken, pollingInterval);
	};

getToken();
