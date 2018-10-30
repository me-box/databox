# Databox Specification

Updated: 32rd oct 2018 databox version 0.5.1


This document specifies the databox system

## Contents

- [System architecture diagram](#system-architecture-diagram)
- [Data sources](#data-sources)
- [Actuators](#actuators)
- [Drivers](#drivers)
- [Data stores](#datastores)
- [The Arbiter](#the-arbiter)
- [Databox applications](#databox-applications)
- [app store driver](#databox-app-store)
- [External Applications](#external-applications)


## System architecture diagram

![architecture diagram](./figures/platform-overview.png)

## Data Sources
Inputs to the databox, e.g.

- Twitter posts
- Facebook feeds
- Environmental Sensors
- Smart meters
- BLE Proximity beacons
- Smart kitchen utensils

In order for an input to be made available / managed through the databox, it requires installation of an associated driver.

## Actuators
These are IoT devices within the home which can be actuated by data box application (if a SLA permits) via a driver

## Drivers
A docker container which can

- Allow data to be input to a databox data store, it may either pull data and insert into a data store or expose a http interface that can be used by an external device to push data into a data store. In this case there would be one driver per type of device
- Facilitate data access to external data sources such as twitter and facebook via the databox through external APIs. In this case there would be one driver per external account
- Enable actuation of local (in home) IoT devices. An example of this would be changing the colour of the living room lights based on the temperature in the living room.

## Data Stores
A data store is exists in conjunction with a driver for historical data storage and querying of a datasource it should
- Manage the authentication of applications data access tokens and associated permissions as per the application SLA
- Be able to present a set of query parameters that it is capable of servicing for the data stored within it for use by the discovery service
- Where the policy is that data is not stored it is effectively a "pass through" data store which allows access to real time (most recent) data points from data sources
- Allow data to be inserted by a driver

## The Arbiter
Is responsible for handing out tokens which permit access to data stores / actuators according to the terms of an SLA

## App store driver
The app store driver reads databox manifests from a git repository (https://github.com/me-box/databox-manifest-store) stored on git hub and writes them into a local databox store for access by other components.

This driver registers two key value data sources, one for apps (type databox:manifests:app) and one for drivers (type databox:manifests:driver). The keys are the app/driver name and the value is the json representation of the corresponding manifest.

## Databox Application
Code running inside a docker container which can
- Request data store / actuator access tokens from arbiter
- make requests to data stores over and actuators using obtained tokens
- Expose data gathered from data stores and potentially processed through a http service to the outside world (if permitted by SLA). Data requests / pushes are only permitted from domains specified in the SLA

## External Application
Code running outside of the data box which of on an a permitted domain can access data via databox applications
