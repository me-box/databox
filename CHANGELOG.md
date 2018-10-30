# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [0.5.1]

This version contains a number of bug fixes and some new features including:

  -  fixed bugs #291, #289, #285 #284 #277
  -  Version manifests and allow addition of manifest repos to the app-store driver
  -  Manifests for apps and drivers can now provide a full docker image name and tag
  -  Changes to the manifest format to enable core-ui to install dependencies at install time
  -  Fixed nodejs builds
  -  Containers running as root (all apps and drivers now run as an un-privileged user)
  -  first version of the quickstart guide https://github.com/me-box/databox-quickstart
  -  make databox recover from host and docker demon restarts
  -  App and Driver crashes are detected and restarted cleanly
  -  removed the need for the CM and SDK to bind mount directories on the host
  -  updates to the arbiter, fixes export token support
  -  The export service has ben re-enabled
  -  Arm64v8 support has been enabled and arm images built. Databox now runs on a Pi3b+ (testing and performance improvements needed)


## [0.5.0]

This version contains a rewritten core-arbiter, core-container-manager and a new set of build tools. There is now no javascript in the code of databox. Most of the core databox components now communicate over the zest protocol, the language-specific libraries have been updated to reflect this change.

The databox user interface has been moved for the core-container-manager into its own component core-ui. This uses a new experimental store based API to access data and API endpoints within the container-manager. This enhances security and enables audit logging by default. It also has the benefit that new user interfaces can be developed in the same way as databox apps.

The platform-app server has also been removed in favour of a databox driver that read manifest from a git hub repository (driver-app-store).

With these changes, the core of databox is much more stable and should be easier or extend and develop on in the future.

Have fun, and as always expect bugs and dragons. Please report issues on the main me-box/databox repository.

The Databox Team

## [0.2.0]
### Changed
    * renamed all the repos see #52
    * Re-enable docker hub builds
    * removed need for remote app-store (for now)
    * removed syslog loging will be done by stores
    * new UI and Android app

## [0.1.2]
### Changed
    * Moved to docker swarm mode #42
    * Removed need for local registry for development
    * pass HTTPS certs and arbiter keys as docker secrets #3
    * moved the container manager into it own repo me-box/databox-cm
    * Removed some modules and implemented mod clean to reduce container manager image size
    * Docker Network API issue - when creating network first time. Fixed #29
    * Integrated the graphical SDK

## [0.1.1] 2017-04-05
### Changed
    * Moved databox container manager to node:alpine to save bandwidth. #14
    * Removed the need to run update updateLocalRegistry.sh #13
    * code cleanup in container-manager.js
    * Update to local registry Env Vars
    * reduced size of databox-export service

## [0.1.0] 2017-03-24

    * The fist open source release. Provides basic versions of all core components and a set of APIs on which to build databox Apps and drivers