# T-NOVA VIM Monitoring Back-End

[![Build Status](https://travis-ci.org/spacehellas/tnova-vim-backend.svg?branch=master)](https://travis-ci.org/spacehellas/tnova-vim-backend) [![Dependency Status](https://david-dm.org/spacehellas/tnova-vim-backend.svg?theme=shields.io)](https://david-dm.org/spacehellas/tnova-vim-backend)

The monitoring back-end of [T-NOVA](http://www.t-nova.eu/)'s Virtual
Infrastructure Manager (VIM).

Primarily developed by [SPACE Hellas](http://www.space.gr/) and released under
the [GNU General Public License v3.0](LICENSE.txt).

## Quick Start

**Step 1.** Download collectd's types.db:

```sh
mkdir tnova_vim
cd tnova_vim
curl -LO https://github.com/collectd/collectd/raw/master/src/types.db
```

**Step 2.** Launch an InfluxDB container:

```sh
docker run -d --name tnova-monitoring-influxdb \
    --restart always \
    -p 8083:8083 -p 8086:8086 -p 25826:25826/udp \
    -v $PWD/influxdata:/var/lib/influxdb \
    -v $PWD/types.db:/usr/share/collectd/types.db \
    -e INFLUXDB_REPORTING_DISABLED=true \
    -e INFLUXDB_COLLECTD_ENABLED=true \
    -e INFLUXDB_COLLECTD_BIND_ADDRESS=":25826" \
    -e INFLUXDB_COLLECTD_DATABASE="statsdb" \
    -e INFLUXDB_COLLECTD_TYPESDB="/usr/share/collectd/types.db" \
    influxdb:alpine
```

**Step 3.** Launch the monitoring container:

```sh
docker run --name=tnova-vim-backend -d \
    --link tnova-monitoring-influxdb:influxdb \
    --publish 8080:3000 \
    tnova/vim-backend:latest
```

## Running locally

Although it is recommended to run the back-end inside a Docker container as
described [here](documentation/deploying.md), it is possible to run it locally.

### Requirements

* [Node.js](https://nodejs.org/) v4.2 or higher (Tested version: 4.4.7)
* [npm](https://www.npmjs.com/)
* [InfluxDB](https://influxdb.com/) v0.9 or higher (Tested version: 0.12)

### Running instructions

Before running the application, make sure that an InfluxDB service is available
and that the default configuration file,
[config/default.json](config/default.json) is properly modified.

```sh
git clone git@github.com:spacehellas/tnova-vim-backend.git # or clone your own fork
cd tnova-vim-backend
npm install
node app.js
```

## More information

* [Deploying T-NOVA VIM Monitoring Back-End](documentation/deploying.md)
* [Deploying T-NOVA VIM Monitoring Back-End using Ansible](contrib/ansible/README.md)
* [Building the official Docker image](documentation/building.md)
