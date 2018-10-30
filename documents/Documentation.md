# Databox Documentation 


### Version: X.X.X 


### generated:Tue Oct 30 14:19:23 2018 


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
   * [Driver app-store](#driverappstore)
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

> Note: currently supported platforms are Linux and MacOS. Running on other platforms is possible using a virtual machine running Linux with bridge mode networking. Also note that more than one CPU core must be allocated to the VM.

### Get started
Make sure Docker is installed and running before starting Databox.  Run the following to get your databox up and
running.

```
mkdir databox
cd databox
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v -t databoxsystems/databox:0.5.1 /databox start -sslHostName $(hostname)
```

> Note: arm64v8 Platforms must be running a 64 bit version of linux (Alpine 3.8 aarch64)[https://alpinelinux.org/downloads/] or (HypriotOS/arm64)[https://github.com/DieterReuter/image-builder-rpi64/releases]

The above starts Databox using pre-build images published on [Docker hub](<https://hub.docker.com/r/databoxsystems>) and runs Databox on your local machine.

Once it's started, point a web browser at <http://127.0.0.1> and follow the instructions to configure your HTTPS certificates to access Databox UI securely (using a web browser <https://127.0.0.1>, or the iOS and Android app).

> Note: Using the databox iOS and Android apps with MacOS may require you to modify your firewall to enable external access to port 80 and 443.

To stop databox and clean up,
```
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v -t databoxsystems/databox:0.5.1 /databox stop
```

# Development

## Get Started with the Graphical SDK

The graphical SDK will allow you to quickly build and test simple databox apps. To start the SDK run:
```
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v -t databoxsystems/databox:0.5.1 /databox sdk -start
```
The SDK web UI is available at http://127.0.0.1:8086

To stop the SDK run:
```
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v -t databoxsystems/databox:0.5.1 /databox sdk -stop
```

## Developing apps and drivers without the SDK

It is possible to develop Databox apps and driver without the SDK. Currently, [Python](https://github.com/me-box/lib-python-databox), [Golang](https://github.com/me-box/lib-go-databox) and [NodeJs](https://github.com/me-box/lib-node-databox) all have support libraries. Building outside the SDK allows you to make smaller more efficient containers and use more third-party libraries.

To get started all you need is a Dockerfile and a databox-manifest.json examples can be found in the libraries '/samples' directories. To make your app available to install locally on your databox you will need to upload the app-store driver and use `docker build -t [your-app-name] .`. Once the manifest is uploaded and the image has built then you should be up to install the app on your local Databox.

A good place to get started is the [databox quickstart repo](https://github.com/me-box/databox-quickstart/) which has all you need to develop apps and drivers and a small tutorial.

>>Images must be post fixed with -amd64 or -arm64v8 respectively.
>>The image must have the version tag that matches your running version of databox :0.5.1 or :latest for example.

If you would like to modify one of the currently available actual drivers you can do so by doing the following:
```
./databox-install-component driver-os-monitor
```

This will download and build the code on your machine and upload the Databox manifest to your local app store. You can also use this with your repositories and forks using:
```
./databox-install-component [GITHUB_USERNAME]/[GITHUB_REPONAME]
```

## Developing core components

To develop on the platform and core components the databox start command allows you to replace the databoxsystems core images with your owen. For example to replace the arbiter.

```
docker build databoxdev/arbiter .                                     # build your updated arbiter image
make start OPTS=--release 0.5.1 --arbiter databoxdev/arbiter      # start databox using the new code
```

# Databox Components

Databox has a number of platform components, divided into two parts:  Core and Other components.  Core components are required for Databox function.  Other components of things like apps and drivers to demonstrate Databoxes functionality.

## Core

* [Databox-container-manager](https://github.com/me-box/core-container-manager) Container manager controls build, installation and running functions of the other databox components.
* [databox-arbiter](https://github.com/me-box/core-arbiter) Arbiter manages the flow of data by minting tokens and controlling store discovery.
* [databox-export-service](https://github.com/me-box/core-export-service) This service controls the data to be exported to external URLs.
* [core-store](https://github.com/me-box/core-store)  This is a data store used by apps and drivers to store and retrieve JSON data or JPEG images.
* [core-ui](https://github.com/me-box/core-ui)  This is the databox default user interface.
* [driver-app-store](https://github.com/me-box/driver-app-store) This is a driver for retrieving manifests and making them available to your databox.

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

## Setting up a full development clone of databox

>> Multi arch builds only work on Docker for Mac experimental
>> enable docker cli experimental features "experimental": "enabled" ~/.docker/config.json
```
    make all ARCH=amd64 DEFAULT_REG=[your docker hub reg tag]
```
Or for amd64v8 platforms
'''
    make all ARCH=amd64v8 DEFAULT_REG=[your docker hub reg tag]
'''

## Running the tests

```
make test

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


```
POST /restart
intput: {"name":<string>, "old_ip":<string>, "new_ip":<string>}
```
`name` is the restarted service, and `old_ip` is its IP address before restart, `new_ip` is the new IP address after retart. core-network updates the policies accroding to this change.

```
GET /status
```
This returns a string `'active'`.

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


<a name="#driverappstore"></a>
# databox-app-store-driver

The official databox app store driver, reads databox manifests from a git repository stored on git hub and writes them into a local databox store for access by other components.

This driver registers two key value data sources, one for apps (type databox:manifests:app) and one for drivers (type databox:manifests:driver). The keys are the app/driver name and the value is the json representation of the corresponding manifest.

## Testing/developing outside databox

Its passable to test this component outside of databox, to do so run:

```
    ./setupTests.sh
    go run *.go -giturl https://github.com/Toshbrown/databox-manifest-store --storeurl tcp://127.0.0.1:5555 --arbiterurl tcp://127.0.0.1:4444
```

# TODO

- Add the ability to add new manifest stores

## Development of databox was supported by the following funding

```
EP/N028260/1, Databox: Privacy-Aware Infrastructure for Managing Personal Data

EP/N028260/2, Databox: Privacy-Aware Infrastructure for Managing Personal Data

EP/N014243/1, Future Everyday Interaction with the Autonomous Internet of Things

EP/M001636/1, Privacy-by-Design: Building Accountability into the Internet of Things (IoTDatabox)

EP/M02315X/1, From Human Data to Personal Experience

```
---


<a name="#libgodatabox"></a>
# lib-go-databox

A Golang library for interfacing with Databox APIs.

see https://godoc.org/github.com/me-box/lib-go-databox for full documtatiosn


# Example

Set up the store and arbiter using setupTest.sh script

```go
package main

import (
	"fmt"
	libDatabox "github.com/me-box/lib-go-databox"
)

func main () {

    //Create a new client in testing mode outside databox
    const testArbiterEndpoint = "tcp://127.0.0.1:4444"
    const testStoreEndpoint = "tcp://127.0.0.1:5555"
    ac, _ := libDatabox.NewArbiterClient("./", "./", testArbiterEndpoint)
    storeClient := libDatabox.NewCoreStoreClient(ac, "./", DataboxStoreEndpoint, false)


    //write some data
    jsonData := `{"data":"This is a test"}`
	err := storeClient.TSBlobJSON.Write("testdata1", []byte(jsonData))
	if err != nil {
		libDatabox.Err("Error Write Datasource " + err.Error())
	}

    //Read some data
    jsonData, err := storeClient.TSBlobJSON.Latest("testdata1")
    if err != nil {
        libDatabox.Err("Error Write Datasource " + err.Error())
    }
    fmt.Println(jsonData)

}
```

More examples can be found in the [databox-quickstart guide](https://github.com/me-box/databox-quickstart)

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

These functions are useful for parsing the configuration data passed to your app or driver.

## getHttpsCredentials()

**Returns** An object containing the HTTPS credentials to pass to https.createServer when offering an https server. These are read from /run/secrets/DATABOX.pem and are generated by the container-manager at run time. This is useful for apps and driver offering interfaces over https.

## NewDataSourceMetadata ()

**Returns** An empty DataSourceMetadata object

DataSourceMetadata objects are used to describe your data source when creating a new one. They look like this:

```JS
    {
        Description:    "", // Text Description of your dataSource
        ContentType:    "", // The format the data is written in
                            // JSON,BINARY or TEXT.
        Vendor:         "", // Your company name.
        DataSourceType: "", // A short type string that represents your data
                            // it is used by apps to find the data you offer.
        DataSourceID:   "", // the ID of this data source, as the creator you
                            // are responsible for ensuring this is unique
                            // within your data store.
        StoreType:      "", // The type of store this uses
                            // (probably store-core)
        IsActuator:  false, // is this an IsActuator?
        Unit:           "", // Text representation of the units
        Location:       "", // Text representation of location Information
    };
```
## DataSourceMetadataToHypercat (DataSourceMetadata)

 Name | Type | Description |
| ---- | ---- | ----------- |
| _DataSourceMetadata_ | `Object` | An object of the form returned by NewDataSourceMetadata |

**Returns** An object representing the hypercat item represented by DataSourceMetadata.

## HypercatToSourceDataMetadata (hyperCatString)

 Name | Type | Description |
| ---- | ---- | ----------- |
| _hyperCatString_ | `String` | A string representation of the hypercat Item representing a data source |

**Returns** A promise that resolves to an object of the form { "DataSourceMetadata": <DataSourceMetadata>, "DataSourceURL":store_url}


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

Data written to the store for the given dataSourceID data is timestamped with milliseconds since the unix epoch on insert.

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

**Returns** a `Promise` that resolves with an ***array of Objects*** of the form
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
| _aggregation_ | `String` sum|count|min|max|mean|median|sd | Optional aggregation function |
| _filterTagName_ | `String` | The name of the tag to filter on |
| _filterType_ | `String` equals|contains | where 'equals' is an exact match and 'contains' is a substring match |
| _filterValue_ | `String` | the value to search for in the tag data |

**Returns** a `Promise` that resolves with an ***array of Objects*** of the form
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
| _sinceTimeStamp_ | `Int` | timestamp im ms form to return data after |
| _aggregation_ | `String` sum|count|min|max|mean|median|sd | Optional aggregation function |
| _filterTagName_ | `String` | Optional name of the tag to filter on |
| _filterType_ | `String` equals|contains | Optional where 'equals' is an exact match and 'contains' is a substring match |
| _filterValue_ | `String` | Optional value to search for in the tag data |

**Returns** a `Promise` that resolves with an ***array of Objects*** of the form
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

**Returns** a `Promise` that resolves with an ***array of Objects*** of the form
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

**Returns** A `Promise` that resolves with an `EventEmitter` that emits `data` when data is written to the observed _dataSourceID_, the `Promise` rejects with an error. The `data` event will contain an Object of the form
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
| _DataSourceMetadata_ | `Object` | of the form returned by NewDataSourceMetadata |

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

**Returns** a `Promise` that resolves with an Object of the form
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

**Returns** a `Promise` that resolves with an ***array of Objects*** of the form
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

**Returns** a `Promise` that resolves with an ***array of Objects*** of the form
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

**Returns** a `Promise` that resolves with an ***array of Objects*** of the form
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

**Returns** A `Promise` that resolves with an `EventEmitter` that emits `data` when data is written to the observed _dataSourceID_, the `Promise` rejects with an error. The `data` event will contain an Object of the form
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
| _DataSourceMetadata_ | `Object` | of the form returned by NewDataSourceMetadata |

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

**Returns** A `Promise` that resolves with an `EventEmitter` that emits `data` when data is written to the observed _dataSourceID_, the `Promise` rejects with an error. The `data` event will contain data stored at the provided dataSourceID. The type of the return data depends on _contentFormat_.
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

**Returns** A `Promise` that resolves with an `EventEmitter` that emits `data` when data is written to the observed _dataSourceID_, the `Promise` rejects with an error. The `data` event will contain data stored at the provided dataSourceID. The type of the return data depends on _contentFormat_.
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
| _DataSourceMetadata_ | `Object` | of the form returned by NewDataSourceMetadata |

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
from databox.core_store import NewKeyValueClient as nkvClient
from databox.core_store import NewTimeSeriesClient as ntsClient
```
Databox python library provides following funtions:

## Key/Value API

### Write entry

URL: /kv/<id>/<key>
Method: POST
Parameters: JSON body of data, replace <id> and <key> with a string
Notes: store data using given key
```
nkvClient.write(id, key, payload, contentFormat)
```

### Read entry

URL: /kv/<id>/<key>
Method: GET
Parameters: replace <id> and <key> with a string
Notes: return data for given id and key 
```
nkvClient.read(id, key, contentFormat)
```

## Time series API


### Write entry (auto-generated time)
URL: /ts/<id>
Method: POST
Parameters: JSON body of data, replace <id> with a string
Notes: add data to time series with given identifier (a timestamp will be calculated at time of insertion)
```
ntsClient.write(id, payload, contentFormat)
```

### Write entry (user-specified time)

### Read latest entry
URL: /ts/<id>/latest
Method: GET
Parameters: replace <id> with an identifier
Notes: return the latest entry
```
ntsClient.latest(id, contentFormat)
```
### Read last number of entries

### Read earliest entry

### Read first number of entries

### Read all entries since a time (inclusive)

### Read all entries in a time range (inclusive)

### Delete all entries since a time (inclusive)

### Delete all entries in a time range (inclusive)

### Length of time series

The usecases of these functions for the test purpose included in  the Sample [Driver](./samples/driver-hello-world/test.py) and the sample [App](./samples/app-hello-world/test.py).

---

