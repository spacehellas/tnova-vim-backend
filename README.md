# T-NOVA VIM Monitoring Back-End

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
