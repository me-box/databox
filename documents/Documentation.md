# Databox Documentation 


### Version: X.X.X 


### generated:Tue May  8 22:35:41 2018 


---


# Table of Contents
 * Platform Overview
   * [Getting started](#databox)
 * Core Components
   * [Core container-manager](#corecontainermanager)
   * [Core arbiter](#corearbiter)
   * [Core network](#corenetwork)
   * [Core store](#corestore)
   * [Core export-service](#coreexportservice)
 * Development Libraries
   * [lib-go-databox](#libgodatabox)
   * [lib-node-databox](#libnodedatabox)
   * [lib-python-databox](#libpythondatabox)
 * Other
---


<a name="#databox"></a>
# Databox
The Databox platform is an open-source personal networked device, augmented by cloud-hosted services, that collates, curates, and mediates access to an individual’s personal data by verified and audited third-party applications and services. The Databox will form the heart of an individual’s personal data processing ecosystem, providing a platform for managing secure access to data and enabling authorised third parties to provide the owner with authenticated services, including services that may be accessed while roaming outside the home environment. Databox project is led by Dr Hamed Haddadi (Imperial College) in collaboration with Dr Richard Mortier (University of Cambridge) and Professors Derek McAuley, Tom Rodden, Chris Greenhalgh, and Andy Crabtree (University of Nottingham) and funded by EPSRC. See http://www.databoxproject.uk/ for more information.

## Getting Started

These instructions will get a copy of the Databox up and running on your local machine. For development and testing purposes, see Development section below.

### Prerequisites

1) Requires Docker. Read [here](https://docs.docker.com/engine/installation/) for docker installation.
2) Once docker is installed and running, install docker-compose. Read [here](https://docs.docker.com/compose/install/) for installation.
3) Requires Git (if it is not already on your machine). Read [here](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) for git installation.

> Note: currently supported platforms are Linux and MacOS. Running on other platforms is possible using a virtual machine running Linux with bridge mode networking. Also note that more than one CPU core must be allocated to the VM.

### Get started
1) Clone Databox Git repo.
```
git clone https://github.com/me-box/databox.git
```

### Operation

Make sure Docker is installed and running before starting Databox.  Run the following to get your databox up and
running.
```
cd databox
./databox-start
```
The above script pulls Databox pre-build images published on [Docker hub](<https://hub.docker.com/r/databoxsystems>) and run  Databox on your local machine.

Once it's started, point a web browser at <http://127.0.0.1> and follow the instructions to configure your HTTPS certificates to access Databox UI securely (using a web browser <https://127.0.0.1>, or the iOS and Android app).

> Note: Using the databox iOS and Android apps with MacOS may require you to modify your firewall to enable external access to port 80 and 443.

To stop databox and clean up,
```
./databox-stop
```

# Development

## Get Started with the Graphical SDK

The graphical SDK will allow you to quickly build and test simple databox apps. To start the SDK run:
```
./databox-start sdk
```
The SDK web UI is available at http://127.0.0.1:8086

To stop the SDK run:
```
./databox-stop sdk
```

## Developing apps and drivers without the SDK

It is possible to develop Databox apps and driver without the SDK. Currently, [Python](https://github.com/me-box/lib-python-databox), [Golang](https://github.com/me-box/lib-go-databox) and [NodeJs](https://github.com/me-box/node-databox) all have support libraries. Building outside the SDK allows you to make smaller more efficient containers and use more third-party libraries.

Developing apps and drivers 'does not' require data box to be started in dev mode.

To get started all you need is a Dockerfile and a databox-manifest.json examples can be found in the libraries '/samples' directories. To make your app available to install locally on your databox you will need to upload the manifest to http://127.0.0.1:8181 and use `docker build -t [your-app-name] .`. Once the manifest is uploaded and the image has built then you should be up to install the app on your local Databox.

If you would like to modify one of the currently available actual drivers you can do so by doing the following:
```
./databox-install-component driver-os-monitor
```

This will download and build the code on your machine and upload the Databox manifest to your local app store. You can also use this with your repositories and forks using:
```
./databox-install-component [GITHUB_USERNAME]/[GITHUB_REPONAME]
```

## Developing core components

To develop on the platform and core components run the data-box start script with 'dev' parameter. See below.

```
./databox-start dev
```

Unlike using the pre-built images, this will clone all the relevant source repositories locally, and build them into the
required Docker images.

When you start in development mode only the `core-components` are built from source. If you wish to develop one of the available apps or drivers then you can add them to your local install using:

```
./databox-install-component driver-os-monitor
```

This will download and build the code on your machine and upload the Databox manifest to your local app store. You can also use this with your repositories  and forks using:

```
./databox-install-component [GITHUB_USERNAME]/[GITHUB_REPONAME]
```

# Databox Components

Databox has a number of platform components, divided into two parts:  Core and Other components.  Core components are required for Databox function.  Other components of things like apps and drivers to demonstrate Databoxes functionality.

## Core

* [Databox-container-manager](https://github.com/me-box/core-container-manager) Container manager controls build, installation and running functions of the other databox components.
* [databox-arbiter](https://github.com/me-box/core-arbiter) Arbiter manages the flow of data by minting tokens and controlling store discovery.
* [databox-export-service](https://github.com/me-box/core-export-service) This service controls the data to be exported to external URLs.
* [databox-store-timeseries](https://github.com/me-box/store-timeseries)  This is a data store used by apps and drivers to store and retrieve JSON data or JPEG images.
* [databox-app-server](https://github.com/me-box/platform-app-server) This is a Server for storing and serving databox manifests.

## Other

### Drivers
* [driver-sensingkit](https://github.com/me-box/driver-sensingkit) This driver provides SensingKit mobile sensor data.
* [driver-google-takeout](https://github.com/me-box/driver-google-takeout) This driver supports bulk import of google takeout data.
* [driver-phillips-hue](https://github.com/me-box/driver-phillips-hue) This drivers allows connection to Phillips Hue Platform.
* [driver-os-monitor](https://github.com/me-box/driver-os-monitor) This driver monitors the databox hardware by fetching Memory consumption and CPU load.
* [driver-twitter](https://github.com/me-box/driver-twitter) This driver streams data from a twitter account into a datastore.
* [driver-tplink-smart-plug](https://github.com/me-box/driver-tplink-smart-plug) This driver collects data from TP-Link smart plugs.
### Apps
* [app-light-graph](https://github.com/me-box/app-light-graph) An app that plots mobile phone light sensor data.
* [app-twitter-sentiment](https://github.com/me-box/app-twitter-sentiment) An app that used data from driver-twitter to calculate tweet sentiment.
* [app-os-monitor](https://github.com/me-box/app-os-monitor) An app to plot the output of the data generated by [driver-os-monitor](https://github.com/me-box/driver-os-monitor).

## Libraries for writing drivers and apps
For writing a new driver or app for Databox, one needs [Databox APIs](./documents/api_specification.md). To make app/driver development easy, we have wrapped Databox APIs in [nodejs](https://nodejs.org/en/), [python](https://docs.python.org/3.4/library/index.html) and [go](https://golang.org/). Using any of these libraries, a developer can build their databox app/driver.
* [lib-node-databox](https://github.com/me-box/node-databox): Databox Nodejs API library for building databox apps and drivers.
* [lib-python-databox](https://github.com/me-box/lib-python-databox): Databox Python API library for building databox apps and drivers.
* [lib-go-databox](https://github.com/me-box/lib-go-databox): Databox Go API library for building databox apps and drivers.
#### API and System specifications
Databox System Design document can be find [here](./documents/system_overview.md) and general API specifications are [here](./documents/api_specification.md).

## Running the tests

```
./databox-test

```
For more details, have a look [here](./TESTING.md).

## Contributing

The databox project welcomes contributions via pull requests see [CONTRIBUTING.md](./CONTRIBUTING.md) for more information. A good start is to look at the current [issues](https://github.com/me-box/databox/issues) and [forking](https://github.com/me-box/databox#fork-destination-box) the databox repo and fixing bugs/issues and submitting a pull request. Read more on Fork and Pull [here](https://help.github.com/articles/fork-a-repo/).

## Versioning

This documentation is up-to-date till this [commit](https://github.com/me-box/databox/tree/45bb7b2f47f595d12a952d9902ffd99061dae6eb). The master branches on all components point to the current release and are tagged in git using [semver](http://semver.org/).

## Authors

The list of [contributors](https://github.com/me-box/databox/contributors) who participated in this project.

## License
MIT Licence, See [here](./LICENSE).

## Contributing

The Databox project welcomes contributions via pull requests see [CONTRIBUTING.md](./CONTRIBUTING.md) for more information.

## Development of databox was supported by the following funding

```
EP/N028260/1, Databox: Privacy-Aware Infrastructure for Managing Personal Data

EP/N028260/2, Databox: Privacy-Aware Infrastructure for Managing Personal Data

EP/N014243/1, Future Everyday Interaction with the Autonomous Internet of Things

EP/M001636/1, Privacy-by-Design: Building Accountability into the Internet of Things (IoTDatabox)

EP/M02315X/1, From Human Data to Personal Experience

```

---


<a name="#corecontainermanager"></a>

# Databox Container Manager

Databox container manager and dashboard are the part of the databox platform.
see [the main repository](https://github.com/me-box/databox) for more information.

For developing Databox core components - Container Manager (CM) exposes following functions:
1. `setHttpsHelper(helper)`: this function provides a https-agent with Databox root certificate, so that arbitor accepts   requests by the https-agent.
2. `install(sla)`: start a app/driver service as a docker container.
3. `uninstall(service)`: remove the running `service` docker container.
4. `restart(container)`: restart the `container`.
5. `connect()`: this function checks if CM can connect to docker.
5. `listContainers()`: this list all Databox componentn containers.
6. `generateArbiterToken(name)`:  this function generates token to be passed to arbitor for the service.
7. `updateArbiter(data)`:  this function updates arbitor endpoint:/cm/: upsert-container-info using post 'data'
8. `restoreContainers(slas)`:  this function restores containers by relaunching them by their sla's.
9. `getActiveSLAs()`: this function gives all SLA's registered in the SLA - database.

### CM SLA database functions
10. `getSLA(name)`: find sla with `name` in `./slaStore/sladatastore.db`
11. `getAllSLAs`: list all slas in `./slaStore/sladatastore.db`
12. `putSLA(name, sla)`: put sla with `name` in `./slaStore/sladatastore.db`
13. `deleteSLA(name)`: delete sla with `name` from `./slaStore/sladatastore.db`

### CM network functions using docker network
14. `createNetwork(networkName, external)`: this function creates a docker network with name `networkName` and boolean type         `external` variable. If `external` is true, it means external excess to the network is allowed.
15. `connectToNetwork(container, networkName)`: this function connects a container to the docker network -`networkName`
16. `disconnectFromNetwork(container, networkName)`: this function disconnects a container from the docker network -          `networkName`


## Development of databox was supported by the following funding

```
EP/N028260/1, Databox: Privacy-Aware Infrastructure for Managing Personal Data

EP/N028260/2, Databox: Privacy-Aware Infrastructure for Managing Personal Data

EP/N014243/1, Future Everyday Interaction with the Autonomous Internet of Things

EP/M001636/1, Privacy-by-Design: Building Accountability into the Internet of Things (IoTDatabox)

EP/M02315X/1, From Human Data to Personal Experience

```

---


<a name="#corearbiter"></a>
# Databox Arbiter

The Databox Docker container that manages the flow of data by minting tokens and controlling store discovery. This code is not meant to be run on its own except for debug purposes. 

If you are a Databox app or driver developer, skip to [the relevant API documentation](#container-facing).

Further background info for Databox platform [here](https://github.com/me-box/databox).


For debug purposes:

## Installation
	git clone https://github.com/me-box/core-arbiter.git
	cd core-arbiter
	npm install

## Usage

This code should not be run as a standalone app, but rather in a Databox context. Unit tests to make sure it will work in that context can be run with:

	npm test

Default port is 8080 (HTTPS only), but in case of lack of privileges, can be overridden using the PORT environment variable, i.e.:

	PORT=8081 npm start

## API Endpoints

All request bodies should be `application/json`.

### CM-facing
_(for Databox core-component developers)_

#### /status

##### Description

Method: GET

An endpoint required by the CM to signify if a container needs configuration. Can respond with (active|standby).

##### Response

  - 200: active

#### /cm/upsert-container-info

##### Description

Method: POST

Upserts the record of containers and the extent of their corresponding permissions (default none) maintained by the arbiter.

NB: CM arbiter key MUST be provided as per the [Hypercat 3.0 specs](http://shop.bsigroup.com/upload/276605/PAS212-corr.pdf). The arbiter will not accept requests that don't include a key that matches that passed to it in the `CM_KEY` environment variable on launch.

##### Parameters

  - name: Container name (required every time)
  - type: Container type (driver|store|app)
  - key: Container arbiter key

##### Response

###### Success

  - 200: [JSON-formatted updated container record]

###### Error

  - 401:
    - Missing API key (see description above)
    - Unauthorized: Arbiter key invalid

#### /cm/delete-container-info

##### Description

Method: POST

Deletes a containers record by name.

NB: CM arbiter key MUST be provided as per the [Hypercat 3.0 specs](http://shop.bsigroup.com/upload/276605/PAS212-corr.pdf). The arbiter will not accept requests that don't include a key that matches that passed to it in the `CM_KEY` environment variable on launch.

##### Parameters

  - name: Container name

##### Response

###### Success

  - 200

###### Error

  - 401:
    - Missing API key (see description above)
    - Unauthorized: Arbiter key invalid
  - 400: Missing parameters

#### /cm/grant-container-permissions

##### Description

Method: POST

Adds permissions to the record of containers maintained by the arbiter for a particular route.

Routes are encoded into tokens (as macaroon caveats). Routes are made up of a target container, an API path, and an HTTP method. The arbiter is indifferent to methods, but for the majority of APIs, `GET` requests map to read operations, and `POST` requests map to write operations.

Paths are JSON-formatted whitelists of accessible endpoints formatted as defined [here](https://github.com/pillarjs/path-to-regexp#parameters) and are testable [here](http://forbeslindesay.github.io/express-route-tester/). More information [here](https://github.com/me-box/admin/blob/master/specs/token-auth.md#path--datasourceapi). The arbiter will mint tokens to paths (exact or RegExp) that match granted path permissions following those RegExp rules.

NB: CM arbiter key MUST be provided as per the [Hypercat 3.0 specs](http://shop.bsigroup.com/upload/276605/PAS212-corr.pdf). The arbiter will not accept requests that don't include a key that matches that passed to it in the `CM_KEY` environment variable on launch.

##### Parameters

  - name: Container name
  - route:
    - target: Target container hostname
    - path:   API path
    - method: HTTP method
  - caveats: String array of route-specific caveats (all optional, see [here](https://github.com/me-box/admin/blob/master/specs/token-auth.md) for explanations).

##### Response

###### Success

  - 200: [JSON array of route caveats after modification]

###### Error

  - 401:
    - Missing API key (see description above)
    - Unauthorized: Arbiter key invalid
  - 400: Missing parameters

#### /cm/revoke-container-permissions

##### Description

Method: POST

Does the opposite of `/cm/grant-container-permissions`. If the specified path is a RegExp path, then _all_ matches will be revoked, so use wildcards carefully.

NB: CM arbiter key MUST be provided as per the [Hypercat 3.0 specs](http://shop.bsigroup.com/upload/276605/PAS212-corr.pdf). The arbiter will not accept requests that don't include a key that matches that passed to it in the `CM_KEY` environment variable on launch.

##### Parameters

  - name: Container name
  - route:
    - target: Target container hostname
    - path:   API path
    - method: HTTP method
  - caveats: String array of route-specific caveats to delete. If none specified, all permissions for this route are completely revoked.

##### Response

###### Success

  - 200:
    - [JSON array of route caveats after modification]
    - null (if all permissions are revoked)

###### Error

  - 401:
    - Missing API key (see description above)
    - Unauthorized: Arbiter key invalid
  - 400: Missing parameters

### Store-facing
_(for Databox developers)_

#### /store/secret

##### Description

Method: GET

Registers a store allowing the arbiter to mint macaroons for the store, and for the store to verify these macaroons independently.

NB: Container arbiter key (see developer guide) MUST be provided as per the [Hypercat 3.0 specs](http://shop.bsigroup.com/upload/276605/PAS212-corr.pdf). Containers without proper authorization will not be able to discover certain items, or will be able to discover them but not access them. In the latter case, they are informed as per section 7.3.1.2 of the [Hypercat 3.0 specs](http://shop.bsigroup.com/upload/276605/PAS212-corr.pdf).

##### Parameters

##### Response

###### Success

  - 200: [Alphanumeric secret for verifying container macaroons]

###### Error

  - 401: Missing API key (see description above)
  - 401: Invalid API key (see description above)
  - 500: Container type unknown by arbiter
  - 403: Container type [type] cannot use arbiter token minting capabilities as it is not a store type


### Container-facing
_(For Databox app and/or driver developers)_

#### /cat

##### Description

Method: GET

Serves a top-level [Hypercat](http://www.hypercat.io/) catalogue.

NB: Container arbiter key (see developer guide) MUST be provided as per the [Hypercat 3.0 specs](http://shop.bsigroup.com/upload/276605/PAS212-corr.pdf). Containers without proper authorization will not be able to discover certain items, or will be able to discover them but not access them. In the latter case, they are informed as per the [Hypercat 3.0 specs](http://shop.bsigroup.com/upload/276605/PAS212-corr.pdf).

##### Response

###### Success

  - 200: [JSON-encoded Hypercat catalogue]

###### Error

  - 401: Missing API key (see description above)

#### /token

##### Description

Method: POST

Provides store tokens for containers.

NB: Container arbiter key (see developer guide) MUST be provided as per the [Hypercat 3.0 specs](http://shop.bsigroup.com/upload/276605/PAS212-corr.pdf). Containers without proper authorization will not be able to discover certain items, or will be able to discover them but not access them. In the latter case, they are informed as per section 7.3.1.2 of the [Hypercat 3.0 specs](http://shop.bsigroup.com/upload/276605/PAS212-corr.pdf).

##### Parameters

  - target: The unique hostname of the target container that will verify the provided macaroon
  - path:   API path for which the token should be minted for
  - method: HTTP method for which the token should be minted for

##### Response

###### Success

  - 200: [Serialzed macaroon]

###### Error

  - 401:
    - Missing API key (see description above)
    - Invalid API key
    - Insufficient route permissions
  - 400:
    - Missing parameters
    - Target [target] has not been approved for arbitering
    - Target [target] has not registered itself for arbitering

---


<a name="#corenetwork"></a>
# core-network [![Build Status](https://travis-ci.org/me-box/core-network.svg?branch=master)](https://travis-ci.org/me-box/core-network)
A system component in databox managing container-to-container and container-to-external communications

### Operation Models
#### At the start of Databox:
1. CM, arbiter, core-network will be put on a network `databox-system-net`
2. CM calls on core-network to identify itself as a privileged entity, then CM is authorized to resolve all the other components that core-network knows of and make connections with them

#### When an app or driver is requested to be installed:
1. A dedicated network is created, core-network then gets attached to it, and by default external access is disallowed on this network
2. After parsing SLA, CM gathers all the entities that this component would like to communicate with (arbiter, and its dependent stores, datasources etc.), and call on core-network to enable these, which includes being able to resolve host names and make connections with previously resolved IP addresses
3. When CM starts the app/driver and its dependent stores, their DNS servers will be pointed to core-network

#### When an app/driver/store is requested to be removed:
1. CM calls on core-network to disable all the communications, giving the being removed service name and its IP address. This mainly helps core-network to recollect resources and delete un-usuful states
1. CM checks if this is the last component on its dedicated network, if so, remove the network, if not, this network will be kept and reusued when a user possibly wants to reinstall a related service

### Internals
core-network oprates on IP packet, for all the other L4 traffic, it only concerns itself with DNS queries.

All the control policies are stored within two data structures:
```
transport: Set of (src_ip, dst_ip')
resolve:   Map from src_ip to (host name, dst_ip') list
```
When a packet comes in from an interface, its (src_ip, dst_ip') pair is checked against `transport`, only existed pairs are allowed to move on, otherwise the packet will get dropped. And when a DNS query comes in, the src_ip of the query and the name it wants to resolve are extracted, then it tries to find a dst_ip' from `resolve`.

Another point worth mentioning is that all the `src_ip`s are the IP addresses that currently used by containers, and almost all the `dst_ip'`s are spoofed by core-network on each interface within the same subnet as with associated `src_ip`s.

When CM calls on core-network to enable communication for a pair of host names, core-network firstly tries to resolve those to (src_ip, dst_ip). If they are coming from the same subnet, like driver and its dependent store, only `resolve` will be updated to contain these new infomation. Since core-network serves as the DNS server for them, when driver wants to talk to its store, a DNS query will be expected to come up in core-network, and core-network could lookup `resolve` to return the IP of the store. When src_ip and dst_ip are from different subnets, like app and one of its datasources, core-network will spoof dst_ip' and src_ip' on both of those two networks, and `transport` will be updated with (src_ip, dst_ip') and also (dst_ip, src_ip'), so that traffic could come back and forth from both sides. `resolve` will also be updated accrodingly, DNS requires from both sides will be replied with spoofed addresses within their same subnets. This also implies that there is a NAT-like module which is in charge of translating from (src_ip, dst_ip') to (src_ip', dst_ip) before sending the packet out.

So a container can't communicate with an entity which it doesn't declare explicitly in the manifest, cause no such infomation reside in `resolve` and `NXDOMAIN` will be returned. It can't use an IP directly either, cause everything is constraint to happen locally, and all the contactable IPs on the local subnet are either its dependent stores, or are spoofed and controlled by core-network.


### API exposed
All of the following calls are intended to be invoked only by core-container-manager, and caller is authenticated by a key.
```
POST /privileged
input: {"src_ip": <string>}
```
`src_ip` is a privileged source IP. Any DNS queries or communications from this IP will be served. CM calls on this when it starts up.

```
POST /connect
input: {"name":<string>, "peers":[<string>]}
```
`name` is the service's host name which CM wants to enable communications for, `peers` is an array of peer host names that this service may want connmunicate with.

```
POST /disconnect
intput: {"name":<string>, "ip":<string>}
```
`name` is the service about to be removed, and `ip` is its IP address. core-container uses these to delete related states.

---


<a name="#corestore"></a>
# core-store

A wrapper around [ZestDB](https://github.com/jptmoore/zestdb) which provides the storage component within the Databox Project. 

### Usage 

Please refer to the Databox client library [documentation](https://github.com/me-box/databox#libraries-for-writing-drivers-and-apps).

### Development of Databox was supported by the following funding

```
EP/N028260/1, Databox: Privacy-Aware Infrastructure for Managing Personal Data
EP/N028260/2, Databox: Privacy-Aware Infrastructure for Managing Personal Data
EP/N014243/1, Future Everyday Interaction with the Autonomous Internet of Things
EP/M001636/1, Privacy-by-Design: Building Accountability into the Internet of Things (IoTDatabox)
EP/M02315X/1, From Human Data to Personal Experience
```
---


<a name="#coreexportservice"></a>
databox-export-service - export service for databox platform [![Build Status](https://travis-ci.org/me-box/core-export-service.svg?branch=master)](https://travis-ci.org/me-box/core-export-service)
-------------------------------------------------------------------------------
%%VERSION%%

core-export-service is distributed under the MIT license.

Homepage: https://github.com/me-box/core-export-service

## Installation

Build your own docker image:

    docker build -t <image name> .

export-service can be installed with `opam`:

	opam pin -n add export-service https://github.com/me-box/core-export-service.git
    opam install export-service

The docker container solution is recommended, as there are extra system dependencies and local package pins to make it work for the `opam` installation. All of this has been taken care of by steps in Dockerfile.


## API

This service exposes two endpoints, `/export` and `/lp/export`. The `/export` endpoint provides the basic export functionality, you'll get instant response when querying it, either it be the state of your export request or you'll get the export response if already fulfilled. And `/lp/export`, as suggested by its name, is the long polling version of the service. For now, no matter which endpoint you are using, the export requests will be put into the same queue and get serviced accordingly.

    Method   : POST
	URL      : /export or /lp/export
	Parameter: JSON object that has the format {id: <request id>, uri: <destination url>, data: <export data>}
	Response : JSON object with the format {id: <request id>, state: <request state>, ext_response: <response>}

When making a query to these endpoints, make sure there is a `X-Api-Key` header included, it contains an arbiter-minted macaroon.

The service will use `id` field in request parameter to differentiate between a newly submitted export request and a polling action about some previously submitted one. If the field is left as an empty string, it will be treated as a new export request, and the export service will put it in a queue and generate its unique id, and include the id in the reponse JSON object. The `data` field will be parsed as a stringified JSON object.

The client could query the state of its request by including the service provided id. The `state` is of string type, and could be one of `"Pending"`, `"Processing"`, and `"Finished"`. If the state is `"Finished"`, the `ext_response` field will be a JSON object as `{status: <status code>, body: <response body>}`.


---


<a name="#libgodatabox"></a>


# libDatabox
`import "./"`

* [Overview](#pkg-overview)
* [Index](#pkg-index)
* [Subdirectories](#pkg-subdirectories)

## <a name="pkg-overview">Overview</a>
A golang library for interfacing with Databox APIs.

Install using go get github.com/me-box/lib-go-databox

Examples can be found in the samples directory




## <a name="pkg-index">Index</a>
* [Constants](#pkg-constants)
* [func ExportLongpoll(destination string, payload string) (string, error)](#ExportLongpoll)
* [func GetHttpsCredentials() string](#GetHttpsCredentials)
* [type AggregationType](#AggregationType)
* [type BinaryKeyValue_0_3_0](#BinaryKeyValue_0_3_0)
  * [func NewBinaryKeyValueClient(reqEndpoint string, enableLogging bool) (BinaryKeyValue_0_3_0, error)](#NewBinaryKeyValueClient)
* [type BinaryObserveResponse](#BinaryObserveResponse)
* [type DataSourceMetadata](#DataSourceMetadata)
  * [func HypercatToDataSourceMetadata(hypercatDataSourceDescription string) (DataSourceMetadata, string, error)](#HypercatToDataSourceMetadata)
* [type Filter](#Filter)
* [type FilterType](#FilterType)
* [type JSONKeyValue_0_3_0](#JSONKeyValue_0_3_0)
  * [func NewJSONKeyValueClient(reqEndpoint string, enableLogging bool) (JSONKeyValue_0_3_0, error)](#NewJSONKeyValueClient)
* [type JSONTimeSeriesBlob_0_3_0](#JSONTimeSeriesBlob_0_3_0)
  * [func NewJSONTimeSeriesBlobClient(reqEndpoint string, enableLogging bool) (JSONTimeSeriesBlob_0_3_0, error)](#NewJSONTimeSeriesBlobClient)
* [type JSONTimeSeriesQueryOptions](#JSONTimeSeriesQueryOptions)
* [type JSONTimeSeries_0_3_0](#JSONTimeSeries_0_3_0)
  * [func NewJSONTimeSeriesClient(reqEndpoint string, enableLogging bool) (JSONTimeSeries_0_3_0, error)](#NewJSONTimeSeriesClient)
* [type JsonObserveResponse](#JsonObserveResponse)
* [type TextKeyValue_0_3_0](#TextKeyValue_0_3_0)
  * [func NewTextKeyValueClient(reqEndpoint string, enableLogging bool) (TextKeyValue_0_3_0, error)](#NewTextKeyValueClient)
* [type TextObserveResponse](#TextObserveResponse)


#### <a name="pkg-files">Package files</a>
[core-store-kv-bin.go](/src/target/core-store-kv-bin.go) [core-store-kv-json.go](/src/target/core-store-kv-json.go) [core-store-kv-text.go](/src/target/core-store-kv-text.go) [core-store-ts-json-blob.go](/src/target/core-store-ts-json-blob.go) [core-store-ts-json.go](/src/target/core-store-ts-json.go) [export.go](/src/target/export.go) [types.go](/src/target/types.go) [utils.go](/src/target/utils.go) 


## <a name="pkg-constants">Constants</a>
``` go
const (
    Equals            FilterType      = "equals"
    Contains          FilterType      = "contains"
    Sum               AggregationType = "sum"
    Count             AggregationType = "count"
    Min               AggregationType = "min"
    Max               AggregationType = "max"
    Mean              AggregationType = "mean"
    Median            AggregationType = "median"
    StandardDeviation AggregationType = "sd"
)
```
Allowed values for FilterType and AggregationFunction




## <a name="ExportLongpoll">func</a> [ExportLongpoll](/src/target/export.go?s=339:410#L5)
``` go
func ExportLongpoll(destination string, payload string) (string, error)
```
ExportLongpoll exports data to external service (payload must be an escaped json string)
permissions must be requested in the app manifest (drivers dont need to use the export service)



## <a name="GetHttpsCredentials">func</a> [GetHttpsCredentials](/src/target/utils.go?s=2426:2459#L93)
``` go
func GetHttpsCredentials() string
```
GetHttpsCredentials Returns a string containing the HTTPS credentials to pass to https server when offering an https server.
These are read form /run/secrets/DATABOX.pem and are generated by the container-manger at run time.




## <a name="AggregationType">type</a> [AggregationType](/src/target/core-store-ts-json.go?s=124:151#L2)
``` go
type AggregationType string
```









## <a name="BinaryKeyValue_0_3_0">type</a> [BinaryKeyValue_0_3_0](/src/target/core-store-kv-bin.go?s=113:1007#L1)
``` go
type BinaryKeyValue_0_3_0 interface {
    // Write text value to key
    Write(dataSourceID string, key string, payload []byte) error
    // Read text values from key.
    Read(dataSourceID string, key string) ([]byte, error)
    //ListKeys returns an array of key registed under the dataSourceID
    ListKeys(dataSourceID string) ([]string, error)
    // Get notifications of updated values for a key. Returns a channel that receives BinaryObserveResponse containing a JSON string when a new value is added.
    ObserveKey(dataSourceID string, key string) (<-chan BinaryObserveResponse, error)
    // Get notifications of updated values for any key. Returns a channel that receives BinaryObserveResponse containing a JSON string when a new value is added.
    Observe(dataSourceID string) (<-chan BinaryObserveResponse, error)
    // Get notifications of updated values
    RegisterDatasource(metadata DataSourceMetadata) error
}
```






### <a name="NewBinaryKeyValueClient">func</a> [NewBinaryKeyValueClient](/src/target/core-store-kv-bin.go?s=1374:1472#L24)
``` go
func NewBinaryKeyValueClient(reqEndpoint string, enableLogging bool) (BinaryKeyValue_0_3_0, error)
```
NewBinaryKeyValueClient returns a new NewBinaryKeyValueClient to enable reading and writing of binary data key value to the store
reqEndpoint is provided in the DATABOX_ZMQ_ENDPOINT environment varable to databox apps and drivers.





## <a name="BinaryObserveResponse">type</a> [BinaryObserveResponse](/src/target/types.go?s=293:413#L13)
``` go
type BinaryObserveResponse struct {
    TimestampMS  int64
    DataSourceID string
    Key          string
    Data         []byte
}
```









## <a name="DataSourceMetadata">type</a> [DataSourceMetadata](/src/target/types.go?s=446:685#L26)
``` go
type DataSourceMetadata struct {
    Description    string
    ContentType    string
    Vendor         string
    DataSourceType string
    DataSourceID   string
    StoreType      string
    IsActuator     bool
    Unit           string
    Location       string
}
```






### <a name="HypercatToDataSourceMetadata">func</a> [HypercatToDataSourceMetadata](/src/target/utils.go?s=6485:6592#L227)
``` go
func HypercatToDataSourceMetadata(hypercatDataSourceDescription string) (DataSourceMetadata, string, error)
```
HypercatToDataSourceMetadata is a helper function to convert the hypercat description of a datasource to a DataSourceMetadata instance
Also returns the store url for this data source.





## <a name="Filter">type</a> [Filter](/src/target/core-store-ts-json.go?s=746:829#L20)
``` go
type Filter struct {
    TagName    string
    FilterType FilterType
    Value      string
}
```
Filter types to hold the required data to apply the filtering functions of the structured json API










## <a name="FilterType">type</a> [FilterType](/src/target/core-store-ts-json.go?s=153:175#L4)
``` go
type FilterType string
```









## <a name="JSONKeyValue_0_3_0">type</a> [JSONKeyValue_0_3_0](/src/target/core-store-kv-json.go?s=133:1162#L3)
``` go
type JSONKeyValue_0_3_0 interface {
    // Write JSON value
    Write(dataSourceID string, key string, payload []byte) error
    // Read JSON values. Returns a []bytes containing a JSON string.
    Read(dataSourceID string, key string) ([]byte, error)
    //ListKeys returns an array of key registed under the dataSourceID
    ListKeys(dataSourceID string) ([]string, error)
    // Get notifications of updated values for a key. Returns a channel that receives JsonObserveResponse containing a JSON string when a new value is added.
    ObserveKey(dataSourceID string, key string) (<-chan JsonObserveResponse, error)
    // Get notifications of updated values for any key. Returns a channel that receives JsonObserveResponse containing a JSON string when a new value is added.
    Observe(dataSourceID string) (<-chan JsonObserveResponse, error)
    // RegisterDatasource make a new data source for available to the rest of datbox. This can only be used on stores that you have requested in your manifest.
    RegisterDatasource(metadata DataSourceMetadata) error
}
```






### <a name="NewJSONKeyValueClient">func</a> [NewJSONKeyValueClient](/src/target/core-store-kv-json.go?s=1521:1615#L26)
``` go
func NewJSONKeyValueClient(reqEndpoint string, enableLogging bool) (JSONKeyValue_0_3_0, error)
```
NewJSONKeyValueClient returns a new NewJSONKeyValueClient to enable reading and writing of JSON data key value to the store
reqEndpoint is provided in the DATABOX_ZMQ_ENDPOINT environment varable to databox apps and drivers.





## <a name="JSONTimeSeriesBlob_0_3_0">type</a> [JSONTimeSeriesBlob_0_3_0](/src/target/core-store-ts-json-blob.go?s=124:2391#L2)
``` go
type JSONTimeSeriesBlob_0_3_0 interface {
    // Write  will be timestamped with write time in ms since the unix epoch by the store
    Write(dataSourceID string, payload []byte) error
    // WriteAt will be timestamped with timestamp provided in ms since the unix epoch
    WriteAt(dataSourceID string, timestamp int64, payload []byte) error
    // Read the latest value.
    // return data is a JSON object of the format {"timestamp":213123123,"data":[data-written-by-driver]}
    Latest(dataSourceID string) ([]byte, error)
    // Read the earliest value.
    // return data is a JSON object of the format {"timestamp":213123123,"data":[data-written-by-driver]}
    Earliest(dataSourceID string) ([]byte, error)
    // Read the last N values.
    // return data is an array of JSON objects of the format {"timestamp":213123123,"data":[data-written-by-driver]}
    LastN(dataSourceID string, n int) ([]byte, error)
    // Read the first N values.
    // return data is an array of JSON objects of the format {"timestamp":213123123,"data":[data-written-by-driver]}
    FirstN(dataSourceID string, n int) ([]byte, error)
    // Read values written after the provided timestamp in in ms since the unix epoch.
    // return data is an array of JSON objects of the format {"timestamp":213123123,"data":[data-written-by-driver]}
    Since(dataSourceID string, sinceTimeStamp int64) ([]byte, error)
    // Read values written between the start timestamp and end timestamp in in ms since the unix epoch.
    // return data is an array of JSON objects of the format {"timestamp":213123123,"data":[data-written-by-driver]}
    Range(dataSourceID string, formTimeStamp int64, toTimeStamp int64) ([]byte, error)
    //Length retruns the number of records stored for that dataSourceID
    Length(dataSourceID string) (int, error)
    // Get notifications when a new value is written
    // the returned chan receives JsonObserveResponse of the form {"TimestampMS":213123123,"Json":byte[]}
    Observe(dataSourceID string) (<-chan JsonObserveResponse, error)
    // registerDatasource is used by apps and drivers to register data sources in stores they own.
    RegisterDatasource(metadata DataSourceMetadata) error
    // GetDatasourceCatalogue is used by drivers to get a list of registered data sources in stores they own.
    GetDatasourceCatalogue() ([]byte, error)
}
```






### <a name="NewJSONTimeSeriesBlobClient">func</a> [NewJSONTimeSeriesBlobClient](/src/target/core-store-ts-json-blob.go?s=2752:2858#L44)
``` go
func NewJSONTimeSeriesBlobClient(reqEndpoint string, enableLogging bool) (JSONTimeSeriesBlob_0_3_0, error)
```
NewJSONTimeSeriesBlobClient returns a new jSONTimeSeriesBlobClient to enable interaction with a time series data store in unstructured JSON format
reqEndpoint is provided in the DATABOX_ZMQ_ENDPOINT environment varable to databox apps and drivers.





## <a name="JSONTimeSeriesQueryOptions">type</a> [JSONTimeSeriesQueryOptions](/src/target/core-store-ts-json.go?s=911:1019#L27)
``` go
type JSONTimeSeriesQueryOptions struct {
    AggregationFunction AggregationType
    Filter              *Filter
}
```
JSONTimeSeriesQueryOptions described the options for the structured json API










## <a name="JSONTimeSeries_0_3_0">type</a> [JSONTimeSeries_0_3_0](/src/target/core-store-ts-json.go?s=1094:3485#L33)
``` go
type JSONTimeSeries_0_3_0 interface {
    // Write  will be timestamped with write time in ms since the unix epoch by the store
    Write(dataSourceID string, payload []byte) error
    // WriteAt will be timestamped with timestamp provided in ms since the unix epoch
    WriteAt(dataSourceID string, timestamp int64, payload []byte) error
    // Read the latest value.
    // return data is a JSON object of the format {"timestamp":213123123,"data":[data-written-by-driver]}
    Latest(dataSourceID string) ([]byte, error)
    // Read the earliest value.
    // return data is a JSON object of the format {"timestamp":213123123,"data":[data-written-by-driver]}
    Earliest(dataSourceID string) ([]byte, error)
    // Read the last N values.
    // return data is an array of JSON objects of the format {"timestamp":213123123,"data":[data-written-by-driver]}
    LastN(dataSourceID string, n int, opt JSONTimeSeriesQueryOptions) ([]byte, error)
    // Read the first N values.
    // return data is an array of JSON objects of the format {"timestamp":213123123,"data":[data-written-by-driver]}
    FirstN(dataSourceID string, n int, opt JSONTimeSeriesQueryOptions) ([]byte, error)
    // Read values written after the provided timestamp in in ms since the unix epoch.
    // return data is an array of JSON objects of the format {"timestamp":213123123,"data":[data-written-by-driver]}
    Since(dataSourceID string, sinceTimeStamp int64, opt JSONTimeSeriesQueryOptions) ([]byte, error)
    // Read values written between the start timestamp and end timestamp in in ms since the unix epoch.
    // return data is an array of JSON objects of the format {"timestamp":213123123,"data":[data-written-by-driver]}
    Range(dataSourceID string, formTimeStamp int64, toTimeStamp int64, opt JSONTimeSeriesQueryOptions) ([]byte, error)
    //Length retruns the number of records stored for that dataSourceID
    Length(dataSourceID string) (int, error)
    // Get notifications when a new value is written
    // the returned chan receives JsonObserveResponse of the form {"TimestampMS":213123123,"Json":byte[]}
    Observe(dataSourceID string) (<-chan JsonObserveResponse, error)
    // registerDatasource is used by apps and drivers to register data sources in stores they own.
    RegisterDatasource(metadata DataSourceMetadata) error
    // GetDatasourceCatalogue is used by drivers to get a list of registered data sources in stores they own.
    GetDatasourceCatalogue() ([]byte, error)
}
```
JSONTimeSeries_0_3_0 described the the structured json timeseries API







### <a name="NewJSONTimeSeriesClient">func</a> [NewJSONTimeSeriesClient](/src/target/core-store-ts-json.go?s=4041:4139#L76)
``` go
func NewJSONTimeSeriesClient(reqEndpoint string, enableLogging bool) (JSONTimeSeries_0_3_0, error)
```
NewJSONTimeSeriesClient returns a new jSONTimeSeriesClient to enable interaction with a structured timeseries data store in JSON format.
The data written must contain at least {"value":[any numeric value]}. This is used in the aggregation functions. Other data can be store and used at KV pairs to filter the data but it can not be processed.
reqEndpoint is provided in the DATABOX_ZMQ_ENDPOINT environment varable to databox apps and drivers.





## <a name="JsonObserveResponse">type</a> [JsonObserveResponse](/src/target/types.go?s=53:171#L1)
``` go
type JsonObserveResponse struct {
    TimestampMS  int64
    DataSourceID string
    Key          string
    Json         []byte
}
```









## <a name="TextKeyValue_0_3_0">type</a> [TextKeyValue_0_3_0](/src/target/core-store-kv-text.go?s=113:1155#L1)
``` go
type TextKeyValue_0_3_0 interface {
    // Write text value
    Write(dataSourceID string, key string, payload string) error
    // Read text values. Returns a string containing the text written to the key.
    Read(dataSourceID string, key string) (string, error)
    //ListKeys returns an array of key registed under the dataSourceID
    ListKeys(dataSourceID string) ([]string, error)
    // Get notifications of updated values for a key. Returns a channel that receives TextObserveResponse containing a JSON string when a new value is added.
    ObserveKey(dataSourceID string, key string) (<-chan TextObserveResponse, error)
    // Get notifications of updated values for any key. Returns a channel that receives TextObserveResponse containing a JSON string when a new value is added.
    Observe(dataSourceID string) (<-chan TextObserveResponse, error)
    // RegisterDatasource make a new data source for available to the rest of datbox. This can only be used on stores that you have requested in your manifest.
    RegisterDatasource(metadata DataSourceMetadata) error
}
```






### <a name="NewTextKeyValueClient">func</a> [NewTextKeyValueClient](/src/target/core-store-kv-text.go?s=1513:1607#L24)
``` go
func NewTextKeyValueClient(reqEndpoint string, enableLogging bool) (TextKeyValue_0_3_0, error)
```
NewTextKeyValueClient returns a new TextKeyValue_0_3_0 to enable reading and writing of string data key value to the store
reqEndpoint is provided in the DATABOX_ZMQ_ENDPOINT environment varable to databox apps and drivers.





## <a name="TextObserveResponse">type</a> [TextObserveResponse](/src/target/types.go?s=173:291#L6)
``` go
type TextObserveResponse struct {
    TimestampMS  int64
    DataSourceID string
    Key          string
    Text         string
}
```













## Development of databox was supported by the following funding
```
EP/N028260/1, Databox: Privacy-Aware Infrastructure for Managing Personal Data
EP/N028260/2, Databox: Privacy-Aware Infrastructure for Managing Personal Data
EP/N014243/1, Future Everyday Interaction with the Autonomous Internet of Things
EP/M001636/1, Privacy-by-Design: Building Accountability into the Internet of Things EP/M02315X/1, From Human Data to Personal Experience
```

---


<a name="#libnodedatabox"></a>
Node Databox
============

A Nodejs library for interfacing with Databox APIs.

Installation
------------

To use this library in your node project, run:

    npm install --save node-databox

and then within your project:

    const databox = require('node-databox');

Usage
-----

> :warning: While this library is at [1.0.0](http://semver.org/spec/v2.0.0.html) the API may change.

Examples of usage are provided in the ./samples directory.


# Helper Functions

These functions are useful for parsing the configuration data passed to you app or driver.

## getHttpsCredentials()

**Returns** An object containing the HTTPS credentials to pass to https.createServer when offering an https server. These are read from /run/secrets/DATABOX.pem and are generated by the container-manger at run time. This is useful for apps and driver offing interfaces over https.

## NewDataSourceMetadata ()

**Returns** An empty DataSourceMetadata object

DataSourceMetadata objects are used to describe your data source when creating a new one. They look like this:

```JS
    {
        Description:    "", // Text Description of you dataSource
        ContentType:    "", // The format the data is written in
                            // JSON,BINARY or TEXT.
        Vendor:         "", // Your company name.
        DataSourceType: "", // A short type string that represents your data
                            // it is used by apps to find the data you offer.
        DataSourceID:   "", // the ID of this data source, as the crater you
                            // are responsible for ensuring this is unique
                            // within your data store.
        StoreType:      "", // The type of store this uses
                            // (probably store-core)
        IsActuator:  false, // is this an IsActuator?
        Unit:           "", // Text representation of the units
        Location:       "", // Text representation of lactation Information
    };
```
## DataSourceMetadataToHypercat (DataSourceMetadata)

 Name | Type | Description |
| ---- | ---- | ----------- |
| _DataSourceMetadata_ | `Object` | An object of the from returned by NewDataSourceMetadata |

**Returns** An object representing the hypercat item represented by DataSourceMetadata.

## HypercatToSourceDataMetadata (hyperCatString)

 Name | Type | Description |
| ---- | ---- | ----------- |
| _hyperCatString_ | `String` | An string representation of an the hypercat Item representing a data source |

**Returns** A promise that resolves to an object of the from { "DataSourceMetadata": <DataSourceMetadata>, "DataSourceURL":store_url}


# core-store

The databox core-store supports the writing and querying of time series and key value data. It is the default store for Databox version 0.3.0 and greater.

The time series API has support for writing generic JSON blobs (see TimeSeriesBlobClient) or data in a specific format (see TimeSeriesClient) which allows extra functionality such as joining, filtering and aggregation on the data. The key value API stores data against keys (see KeyValueClient).

## TimeSeriesClient

These functions allow you to manage structured json data in the time series store and allow for filtering and aggregation of the data.

Data written into a TimeSeriesStore must contain, A value (integer or floating point number) and a tag is an identifier with corresponding string value. For example:{"room": "lounge", "value": 1}. Tagging a value provides a way to group values together when accessing them. In the example provided you could retrieve all values that are in a room called 'lounge'.

Data returned from a query is a JSON dictionary containing a timestamp in epoch milliseconds and the actual data. For example:{"timestamp":1513160985841,"data":{"foo":"bar","value":1}}. Data can also be aggregated by applying functions across values. Aggregation functions result in a response of a single value. For example: {"result":1}.

The TimeSeriesClient supports the following functions:

### databox.NewTimeSeriesClient (reqEndpoint, enableLogging)

**Returns** a new TimeSeriesClient that is connected to the provided store.

### TimeSeriesClient.Write (dataSourceID, payload)

Writes data to the store for the given dataSourceID data is timestamped with milliseconds since the unix epoch on insert.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _payload_ | `Object` | A JSON serializable Object to write to the store |

**Returns** a `Promise` that resolves with "created" on success or rejects with error message on error.

### TimeSeriesClient.WriteAt (dataSourceID, timestamp, payload)

Writes data to the store for the given dataSourceID at the given timestamp. Timestamp should be in milliseconds since the unix epoch.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _timestamp_ | `Int` | milliseconds since the unix epoch |
| _payload_ | `Object` | A JSON serializable Object to write to the store |

**Returns** a `Promise` that resolves with "created" on success or rejects with error message on error.

### TimeSeriesClient.Latest (dataSourceID)

Reads the latest data written to the provided dataSourceID.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |

**Returns** a `Promise` that resolves with an ***array of Objects*** of the from
```js
   {
      timestamp: 1510768103558,
      data: { value:[numeric value] ,[tag name]:[tag value] }
   }
```
 on success or rejects with error message on error.

### TimeSeriesClient.LastN (dataSourceID,n)

Reads the last N items written to the provided dataSourceID.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _N_ | `Int` | number of results to return |
| _aggregation_ | `String` sum|count|min|max|mean|median|sd | Optional agrigation function |
| _filterTagName_ | `String` | The name of the tag to filter on |
| _filterType_ | `String` equals|contains | where 'equals' is an exact match and 'contains' is a substring match |
| _filterValue_ | `String` | the value to search for in the tag data |

**Returns** a `Promise` that resolves with an ***array of Objects*** of the from
```js
   {
      timestamp: 1510768103558,
      data: { value:[numeric value] ,[tag name]:[tag value] }
   }
```
 on success or rejects with error message on error.

### TimeSeriesClient.Since (dataSourceID, sinceTimeStamp, aggregation, filterTagName, filterType, filterValue)

Read all entries since a time (inclusive)

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _sinceTimeStamp_ | `Int` | timestamp im ms form which to return data after |
| _aggregation_ | `String` sum|count|min|max|mean|median|sd | Optional aggregation function |
| _filterTagName_ | `String` | Optional name of the tag to filter on |
| _filterType_ | `String` equals|contains | Optional where 'equals' is an exact match and 'contains' is a substring match |
| _filterValue_ | `String` | Optional the value to search for in the tag data |

**Returns** a `Promise` that resolves with an ***array of Objects*** of the from
```js
   {
      timestamp: 1510768103558,
      data: { value:[numeric value] ,[tag name]:[tag value] }
   }
```

### TimeSeriesClient.Range (dataSourceID, fromTimeStamp, toTimeStamp, aggregation, filterTagName, filterType, filterValue)

Read all entries in a time range (inclusive)

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _fromTimeStamp_ | `Int` | timestamp in ms form which to return data after |
| _toTimeStamp_ | `Int` | timestamp in ms before which data will be returned |
| _aggregation_ | `String` sum|count|min|max|mean|median|sd | Optional aggregation function |
| _filterTagName_ | `String` | Optional name of the tag to filter on |
| _filterType_ | `String` equals|contains | Optional where 'equals' is an exact match and 'contains' is a substring match |
| _filterValue_ | `String` | Optional value to search for in the tag data |

**Returns** a `Promise` that resolves with an ***array of Objects*** of the from
```js
   {
      timestamp: 1510768103558,
      data: { value:[numeric value] ,[tag name]:[tag value] }
   }
```

### TimeSeriesClient.Observe (dataSourceID,timeout)

This function allows you to receive data from a data source as soon as it is written.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _timeout_ | `int` | stop sending data after timeout seconds |

**Returns** A `Promise` that resolves with an `EventEmitter` that emits `data` when data is written to the observed _dataSourceID_, the `Promise` rejects with an error. The `data` event will contain an an Object of the from
```js
   {
        "timestamp"    : 1510768103558,
        "datasourceid" : dataSourceID,
        "key"          : key name,
        "data"         : { value:[numeric value] ,[tag name]:[tag value] }
    }
```

### TimeSeriesClient.StopObserving (dataSourceID)

Closes the connection to stop observing data on the provided _dataSourceID_.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |

**Returns** Void

### TimeSeriesClient.RegisterDatasource (DataSourceMetadata)

This function registers your data sources with your store. Registering your data source makes them available to databox apps.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _DataSourceMetadata_ | `Object` | of the from returned by NewDataSourceMetadata |

**Returns** a `Promise` that resolves with "created" on success or rejects with error message on error.


## TimeSeriesBlobClient

These functions allow you to manage unstructured json data in the time series store. It is backwards compatible with the old store-json.

> :warning: If data is written into a TimeSeriesBlobStore filtering and aggregation functions are not supported.

The NewTimeSeriesBlobClient supports the following functions:

### databox.NewTimeSeriesBlobClient (reqEndpoint, enableLogging)

**Returns** a new NewTimeSeriesBlobClient that is connected to the provided store.

### TimeSeriesBlobClient.Write (dataSourceID, payload)

Writes data to the store for the given dataSourceID data is timestamped with milliseconds since the unix epoch on insert.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _payload_ | `Object` | A JSON serializable Object to write to the store |

**Returns** a `Promise` that resolves with "created" on success or rejects with error message on error.

### TimeSeriesBlobClient.WriteAt (dataSourceID, timestamp, payload)

Writes data to the store for the given dataSourceID at the given timestamp. Timestamp should be in milliseconds since the unix epoch.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _timestamp_ | `Int` | milliseconds since the unix epoch |
| _payload_ | `Object` | A JSON serializable Object to write to the store |

**Returns** a `Promise` that resolves with "created" on success or rejects with error message on error.

### TimeSeriesBlobClient.Latest (dataSourceID)

Reads the latest data written to the provided dataSourceID.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |

**Returns** a `Promise` that resolves with an Object of the from
```js
   {
      timestamp: 1510768103558,
      data: { data written by driver }
   }
```
 on success or rejects with error message on error.

### TimeSeriesBlobClient.LastN (dataSourceID,n)

Reads the last N items written to the provided dataSourceID.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _N_ | `Int` | number of results to return |

**Returns** a `Promise` that resolves with an ***array of Objects*** of the from
```js
   {
      timestamp: 1510768103558,
      data: { data written by driver }
   }
```
 on success or rejects with error message on error.

### TimeSeriesBlobClient.Since (dataSourceID, sinceTimeStamp)

Read all entries since a time (inclusive)

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _sinceTimeStamp_ | `Int` | timestamp im ms form which to return data after |

**Returns** a `Promise` that resolves with an ***array of Objects*** of the from
```js
   {
      timestamp: 1510768103558,
      data: { value:[numeric value] ,[tag name]:[tag value] }
   }
```

### TimeSeriesBlobClient.Range (dataSourceID, fromTimeStamp, toTimeStamp)

Read all entries in a time range (inclusive)

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _fromTimeStamp_ | `Int` | timestamp in ms form which to return data after |
| _toTimeStamp_ | `Int` | timestamp in ms before which data will be returned |

**Returns** a `Promise` that resolves with an ***array of Objects*** of the from
```js
   {
      timestamp: 1510768103558,
      data: { value:[numeric value] ,[tag name]:[tag value] }
   }
```

### Observe (dataSourceID,timeout)

This function allows you to receive data from a data source as soon as it is written.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _timeout_ | `int` | stop sending data after timeout seconds |

**Returns** A `Promise` that resolves with an `EventEmitter` that emits `data` when data is written to the observed _dataSourceID_, the `Promise` rejects with an error. The `data` event will contain an an Object of the from
```js
   {
        "timestamp"  : 1510768103558,
        "datasourceid" : dataSourceID,
        "key"          : key name,
        "data"         : { data written by driver },
    }
```

### StopObserving (dataSourceID)

Closes the connection to stop observing data on the provided _dataSourceID_.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |

**Returns** Void

### RegisterDatasource (DataSourceMetadata)

This function registers your data sources with your store. Registering your data source makes them available to databox apps.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _DataSourceMetadata_ | `Object` | of the from returned by NewDataSourceMetadata |

**Returns** a `Promise` that resolves with "created" on success or rejects with error message on error.

## KeyValueClient

The Key Value Store allows the storage of TEXT, JSON and binary data agents keys. The default content format is JSON.

The KeyValueClient supports the following functions:

### databox.NewKeyValueClient (reqEndpoint, enableLogging)

**Returns** a new KeyValueClient that is connected to the provided store.

### Write (dataSourceID, KeyName, payload, contentFormat)

Writes data to the store for the given dataSourceID data. Writes to the same key overwrite the data.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _KeyName_ | `String` | the key you wish to write to |
| _payload_ | `Object` | A JSON serializable Object to write to the store |
| _contentFormat_ | `String` | JSON TEXT or BINARY |

**Returns** a `Promise` that resolves with "created" on success or rejects with error message on error.

### ListKeys (dataSourceID)

Lists the stored keys for this dataSourceID

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to read from |

**Returns** as `Promise` that resolves with the data on success or rejects with error message on error. The type of the returned data is an `Array` of `Strings`.

### Read (dataSourceID, KeyName, contentFormat)

Reads data from the store for the given dataSourceID. data is timestamped with milliseconds since the unix epoch on insert.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to read from |
| _KeyName_ | `String` | the key you wish read from |
| _contentFormat_ | `String` | JSON TEXT or BINARY |

**Returns** a `Promise` that resolves with the data on success or rejects with error message on error. The type of the returned data depends on the _contentFormat_ read.


### Observe (dataSourceID,timeout,contentFormat)

This function allows you to receive data from all keys under a data source as soon as it is written. This will observe all keys under a single data source

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _timeout_ | `int` | stop sending data after timeout seconds |
| _contentFormat_ | `String` | JSON TEXT or BINARY |

**Returns** A `Promise` that resolves with an `EventEmitter` that emits `data` when data is written to the observed _dataSourceID_, the `Promise` rejects with an error. The `data` event will contain an an data stored at the provided dataSourceID. The type of the return data depends on _contentFormat_.
```js
   {
        "timestamp"  : 1510768103558,
        "datasourceid" : dataSourceID,
        "key"          : key name,
        "data"         : { data written by driver },
    }
```

### ObserveKey (dataSourceID,KeyName,timeout,contentFormat)

This function allows you to receive data from a data source as soon as it is written. This will observe a single key under a single data source

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _timeout_ | `int` | stop sending data after timeout seconds |
| _contentFormat_ | `String` | JSON TEXT or BINARY |

**Returns** A `Promise` that resolves with an `EventEmitter` that emits `data` when data is written to the observed _dataSourceID_, the `Promise` rejects with an error. The `data` event will contain an an data stored at the provided dataSourceID. The type of the return data depends on _contentFormat_.
```js
   {
        "timestamp"  : 1510768103558,
        "datasourceid" : dataSourceID,
        "key"          : key name,
        "data"         : { data written by driver },
    }
```

### StopObserving (dataSourceID)

Closes the connection to stop observing data on the provided _dataSourceID_.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |

**Returns** Void

### RegisterDatasource (DataSourceMetadata)

This function registers your data sources with your store. Registering your data source makes them available to databox apps.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _DataSourceMetadata_ | `Object` | of the from returned by NewDataSourceMetadata |

**Returns** a `Promise` that resolves with "created" on success or rejects with error message on error.

## Exporting Data to an external service

### export.longpoll(destination, payload) ###

Exports data and retrieves response via long polling

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| _destination_ | `String` | An HTTPS URL to the export destination |
| _payload_     | `Object` | Data to POST to destination |

**Returns** A `Promise` that resolves with the destination server's response or rejects with an error

### export.queue(destination, payload) ###

> :warning: Currently unimplemented

Pushes data to an export queue and retrieves response via polling

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| _destination_ | `String` | An HTTPS URL to the export destination |
| _payload_     | `Object` | Data to POST to destination |

**Returns** A `Promise` that resolves with the destination server's response or rejects with an error

## Development of databox was supported by the following funding

```
EP/N028260/1, Databox: Privacy-Aware Infrastructure for Managing Personal Data

EP/N028260/2, Databox: Privacy-Aware Infrastructure for Managing Personal Data

EP/N014243/1, Future Everyday Interaction with the Autonomous Internet of Things

EP/M001636/1, Privacy-by-Design: Building Accountability into the Internet of Things (IoTDatabox)

EP/M02315X/1, From Human Data to Personal Experience

```
---


<a name="#libpythondatabox"></a>
# python-databox-library

This repo includes python driver and app templates with databox-python library with basic APIs.  Copy lib folder in your application directory and import lib in your driver/app python file.
```
import lib as databox
```
Databox python library provides following funtions:

```
databox.waitForStoreStatus(href, status, maxRetries)
databox.makeStoreRequest(method, jsonData, url)
databox.makeArbiterRequest(method, path, data)
databox.requestToken(hostname, endpoint, method)
databox.getRootCatalog()
databox.listAvailableStores()
databox.registerDatasource(href, metadata)
databox.export.longpoll(destination, payload)
databox.key_value.read(href, key)
databox.key_value.write(href, key, data)
databox.time_series.latest(store_href, dataSourceID)
databox.time_series.since(store_href, dataSourceID, startTimestamp)
databox.time_series.range(store_href, dataSourceID, startTimestamp, endTimestamp)
databox.time_series.write(store_href, dataSourceID, data)

```

The usecases of these functions for the test purpose included in  the Sample [Driver](./samples/driver-hello-world/test.py) and the sample [App](./samples/app-hello-world/test.py).

---

