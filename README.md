# T-NOVA VIM Monitoring Back-End

[![Build Status](https://travis-ci.org/spacehellas/tnova-vim-backend.svg?branch=master)](https://travis-ci.org/spacehellas/tnova-vim-backend) [![Dependency Status](https://david-dm.org/spacehellas/tnova-vim-backend.svg?theme=shields.io)](https://david-dm.org/spacehellas/tnova-vim-backend)

The monitoring back-end of [T-NOVA](http://www.t-nova.eu/)'s Virtual
Infrastructure Manager (VIM).

Primarily developed by [SPACE Hellas](http://www.space.gr/) and released under
the [GNU General Public License v3.0](LICENSE.txt).

## Requirements

* [Node.js](https://nodejs.org/) (Tested version: 4.2.1)
* [npm](https://www.npmjs.com/)
* [InfluxDB](https://influxdb.com/) v0.9 or higher (Tested version: 0.9.4.2)

## Running locally

Before running the application, make sure that the default configuration file,
[config/default.json](config/default.json) is properly modified.

```sh
git clone git@github.com:spacehellas/tnova-vim-backend.git # or clone your own fork
cd tnova-vim-backend
npm install
node app.js
```

## Building a Docker image

Make sure that you have installed the necessary Node.js modules and modified
[config/default.json](config/default.json) before building the Docker image.

```sh
docker build --tag=tnova/vim-backend .
```

## Running a Docker container

**Step 1.** Launch an InfluxDB container:

```sh
docker run --name tnova-monitoring-influxdb -d \
    -e ADMIN_USER="root" -e INFLUXDB_INIT_PWD="root" \
    -e PRE_CREATE_DB="statsdb" -e COLLECTD_DB="statsdb" \
    -e COLLECTD_BINDING=':25826' -e COLLECTD_RETENTION_POLICY="statspolicy" \
    --publish 8083:8083 --publish 8086:8086 --publish 25826:25826/udp \
    --volume=/var/influxdb:/data \
    tutum/influxdb
```

**Step 2.** Launch the monitoring container:

```sh
docker run --name=tnova-vim-backend -d \
    --link tnova-monitoring-influxdb:influxdb \
    --publish 8080:3000 \
    tnova/vim-backend:latest
```

## More information

* [Deploying T-NOVA VIM Monitoring Back-End](documentation/deploying.md)
