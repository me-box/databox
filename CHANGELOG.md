# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) 
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

### Added

### Changed
    * Moved to docker swarm mode #42
    * Removed need for local registry for development
    * pass HTTPS certs and arbiter keys as docker secrets #3 
    * moved the container manager into it own repo me-box/databox-cm
    * Removed some modules and implemented mod clean to reduce container manager image size
    * Docker Network API issue - when creating network first time. Fixed #29

## [0.1.1] 2017-04-05
### Changed
    * Moved databox container manger to node:alpine to save bandwidth. #14
    * Removed the need to run update updateLocalRegistry.sh #13
    * code cleanup in container-manager.js
    * Update to local registry Env Vars 
    * reduced size of databox-export service 

## [0.1.0] 2017-03-24

    * The fist open source release. Provides basic versions of all core components and a set of APIs on which to build databox Apps and drivers 