# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [unreleased]

### Changed
- Update node-alpine Docker image to v4.2.6.

## [0.1.1] - 2016-02-04

**Due to a schema change it is obligatory to DROP the statsdb database.**

### Added
- Continuous integration with Travis.
- Template for the collectd agent.
- Information for deploying the back-end using Docker.
- Ceilometer polling interval option in the Docker image.

### Changed
- Make OpenStack no data errors more verbose.
- Host information by Ceilometer stored as tag.

### Fixed
- Use measurement time and not the polling time while storing the actual
  measurement to the database.

## [0.1.0] - 2016-01-11

Initial version.
