# Databox Documentation 


### Version: X.X.X 


### generated:Fri Aug 17 12:19:48 2018 


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


<a name="#libgodatabox"></a>


# libDatabox
`import "./"`

* [Overview](#pkg-overview)
* [Index](#pkg-index)
* [Subdirectories](#pkg-subdirectories)

## <a name="pkg-overview">Overview</a>



## <a name="pkg-index">Index</a>
* [Constants](#pkg-constants)
* [func ChkErr(err error)](#ChkErr)
* [func ChkErrFatal(err error)](#ChkErrFatal)
* [func Debug(msg string)](#Debug)
* [func Err(msg string)](#Err)
* [func GetHttpsCredentials() string](#GetHttpsCredentials)
* [func GetStoreURLFromDsHref(href string) (string, error)](#GetStoreURLFromDsHref)
* [func Info(msg string)](#Info)
* [func NewDataboxHTTPsAPI() *http.Client](#NewDataboxHTTPsAPI)
* [func NewDataboxHTTPsAPIWithPaths(cmRootCaPath string) *http.Client](#NewDataboxHTTPsAPIWithPaths)
* [func Warn(msg string)](#Warn)
* [type AggregationType](#AggregationType)
* [type ArbiterClient](#ArbiterClient)
  * [func NewArbiterClient(arbiterTokenPath string, zmqPublicKeyPath string, arbiterZMQURI string) (*ArbiterClient, error)](#NewArbiterClient)
  * [func (arb *ArbiterClient) GetRootDataSourceCatalogue() (HypercatRoot, error)](#ArbiterClient.GetRootDataSourceCatalogue)
  * [func (arb *ArbiterClient) GrantComponentPermission()](#ArbiterClient.GrantComponentPermission)
  * [func (arb *ArbiterClient) GrantContainerPermissions(permissions ContainerPermissions) error](#ArbiterClient.GrantContainerPermissions)
  * [func (arb *ArbiterClient) InvalidateCache(href string, method string)](#ArbiterClient.InvalidateCache)
  * [func (arb *ArbiterClient) RegesterDataboxComponent(name string, tokenString string, databoxType DataboxType) error](#ArbiterClient.RegesterDataboxComponent)
  * [func (arb *ArbiterClient) RemoveDataboxComponent()](#ArbiterClient.RemoveDataboxComponent)
  * [func (arb *ArbiterClient) RequestToken(href string, method string) ([]byte, error)](#ArbiterClient.RequestToken)
  * [func (arb *ArbiterClient) RevokeComponentPermission()](#ArbiterClient.RevokeComponentPermission)
* [type ContainerManagerOptions](#ContainerManagerOptions)
* [type ContainerPermissions](#ContainerPermissions)
* [type CoreStoreClient](#CoreStoreClient)
  * [func NewCoreStoreClient(arbiterClient *ArbiterClient, zmqPublicKeyPath string, storeEndPoint string, enableLogging bool) *CoreStoreClient](#NewCoreStoreClient)
  * [func NewDefaultCoreStoreClient(storeEndPoint string) *CoreStoreClient](#NewDefaultCoreStoreClient)
  * [func (csc *CoreStoreClient) GetStoreDataSourceCatalogue(href string) (HypercatRoot, error)](#CoreStoreClient.GetStoreDataSourceCatalogue)
  * [func (csc *CoreStoreClient) RegisterDatasource(metadata DataSourceMetadata) error](#CoreStoreClient.RegisterDatasource)
* [type DataSource](#DataSource)
* [type DataSourceMetadata](#DataSourceMetadata)
  * [func HypercatToDataSourceMetadata(hypercatDataSourceDescription string) (DataSourceMetadata, string, error)](#HypercatToDataSourceMetadata)
* [type DataboxType](#DataboxType)
* [type ExportWhitelist](#ExportWhitelist)
* [type ExternalWhitelist](#ExternalWhitelist)
* [type Filter](#Filter)
* [type FilterType](#FilterType)
* [type HypercatItem](#HypercatItem)
* [type HypercatRoot](#HypercatRoot)
* [type KVStore](#KVStore)
  * [func (kvj *KVStore) Delete(dataSourceID string, key string) error](#KVStore.Delete)
  * [func (kvj *KVStore) DeleteAll(dataSourceID string) error](#KVStore.DeleteAll)
  * [func (kvj *KVStore) ListKeys(dataSourceID string) ([]string, error)](#KVStore.ListKeys)
  * [func (kvj *KVStore) Observe(dataSourceID string) (&lt;-chan ObserveResponse, error)](#KVStore.Observe)
  * [func (kvj *KVStore) ObserveKey(dataSourceID string, key string) (&lt;-chan ObserveResponse, error)](#KVStore.ObserveKey)
  * [func (kvj *KVStore) Read(dataSourceID string, key string) ([]byte, error)](#KVStore.Read)
  * [func (kvj *KVStore) Write(dataSourceID string, key string, payload []byte) error](#KVStore.Write)
* [type LogEntries](#LogEntries)
* [type Logger](#Logger)
  * [func New(store *CoreStoreClient, outputDebugLogs bool) (*Logger, error)](#New)
  * [func (l Logger) ChkErr(err error)](#Logger.ChkErr)
  * [func (l Logger) Debug(msg string)](#Logger.Debug)
  * [func (l Logger) Err(msg string)](#Logger.Err)
  * [func (l Logger) GetLastNLogEntries(n int) Logs](#Logger.GetLastNLogEntries)
  * [func (l Logger) GetLastNLogEntriesRaw(n int) []byte](#Logger.GetLastNLogEntriesRaw)
  * [func (l Logger) Info(msg string)](#Logger.Info)
  * [func (l Logger) Warn(msg string)](#Logger.Warn)
* [type Logs](#Logs)
* [type Macaroon](#Macaroon)
* [type Manifest](#Manifest)
* [type ObserveResponse](#ObserveResponse)
* [type Package](#Package)
* [type RelValPair](#RelValPair)
* [type RelValPairBool](#RelValPairBool)
* [type Repository](#Repository)
* [type ResourceRequirements](#ResourceRequirements)
* [type Route](#Route)
* [type SLA](#SLA)
* [type StoreContentType](#StoreContentType)
* [type StoreType](#StoreType)
* [type TSBlobStore](#TSBlobStore)
  * [func (tbs *TSBlobStore) Earliest(dataSourceID string) ([]byte, error)](#TSBlobStore.Earliest)
  * [func (tbs *TSBlobStore) FirstN(dataSourceID string, n int) ([]byte, error)](#TSBlobStore.FirstN)
  * [func (tbs *TSBlobStore) LastN(dataSourceID string, n int) ([]byte, error)](#TSBlobStore.LastN)
  * [func (tbs *TSBlobStore) Latest(dataSourceID string) ([]byte, error)](#TSBlobStore.Latest)
  * [func (tbs *TSBlobStore) Length(dataSourceID string) (int, error)](#TSBlobStore.Length)
  * [func (tbs *TSBlobStore) Observe(dataSourceID string) (&lt;-chan ObserveResponse, error)](#TSBlobStore.Observe)
  * [func (tbs *TSBlobStore) Range(dataSourceID string, formTimeStamp int64, toTimeStamp int64) ([]byte, error)](#TSBlobStore.Range)
  * [func (tbs *TSBlobStore) Since(dataSourceID string, sinceTimeStamp int64) ([]byte, error)](#TSBlobStore.Since)
  * [func (tbs *TSBlobStore) Write(dataSourceID string, payload []byte) error](#TSBlobStore.Write)
  * [func (tbs *TSBlobStore) WriteAt(dataSourceID string, timstamp int64, payload []byte) error](#TSBlobStore.WriteAt)
* [type TSStore](#TSStore)
  * [func (tsc TSStore) Earliest(dataSourceID string) ([]byte, error)](#TSStore.Earliest)
  * [func (tsc TSStore) FirstN(dataSourceID string, n int, opt TimeSeriesQueryOptions) ([]byte, error)](#TSStore.FirstN)
  * [func (tsc TSStore) LastN(dataSourceID string, n int, opt TimeSeriesQueryOptions) ([]byte, error)](#TSStore.LastN)
  * [func (tsc TSStore) Latest(dataSourceID string) ([]byte, error)](#TSStore.Latest)
  * [func (tsc TSStore) Length(dataSourceID string) (int, error)](#TSStore.Length)
  * [func (tsc TSStore) Observe(dataSourceID string) (&lt;-chan ObserveResponse, error)](#TSStore.Observe)
  * [func (tsc TSStore) Range(dataSourceID string, formTimeStamp int64, toTimeStamp int64, opt TimeSeriesQueryOptions) ([]byte, error)](#TSStore.Range)
  * [func (tsc TSStore) Since(dataSourceID string, sinceTimeStamp int64, opt TimeSeriesQueryOptions) ([]byte, error)](#TSStore.Since)
  * [func (tsc TSStore) Write(dataSourceID string, payload []byte) error](#TSStore.Write)
  * [func (tsc TSStore) WriteAt(dataSourceID string, timstamp int64, payload []byte) error](#TSStore.WriteAt)
* [type TimeSeriesQueryOptions](#TimeSeriesQueryOptions)


#### <a name="pkg-files">Package files</a>
[arbiterClient.go](/src/target/arbiterClient.go) [coreStoreClient.go](/src/target/coreStoreClient.go) [coreStoreKV.go](/src/target/coreStoreKV.go) [coreStoreTS.go](/src/target/coreStoreTS.go) [coreStoreTSBlob.go](/src/target/coreStoreTSBlob.go) [databoxRequest.go](/src/target/databoxRequest.go) [databoxlog.go](/src/target/databoxlog.go) [export.go](/src/target/export.go) [helperFunction.go](/src/target/helperFunction.go) [types.go](/src/target/types.go) 


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

``` go
const DefaultArbiterKeyPath = "/run/secrets/ARBITER_TOKEN"
```
``` go
const DefaultArbiterURI = "tcp://arbiter:4444"
```
``` go
const DefaultHTTPSCertPath = "/run/secrets/DATABOX.pem"
```
DefaultHTTPSCertPath is the defaut loaction where apps and drivers can find the https certivicats needed to offer a secure UI

``` go
const DefaultHTTPSRootCertPath = "/run/secrets/DATABOX_ROOT_CA"
```
DefaultHTTPSRootCertPath contins the Public key of this databoxes Root certificate needed to verify requests to other components (used in )

``` go
const DefaultStorePublicKeyPath = "/run/secrets/ZMQ_PUBLIC_KEY"
```



## <a name="ChkErr">func</a> [ChkErr](/src/target/databoxlog.go?s=1841:1863#L85)
``` go
func ChkErr(err error)
```


## <a name="ChkErrFatal">func</a> [ChkErrFatal](/src/target/databoxlog.go?s=1916:1943#L92)
``` go
func ChkErrFatal(err error)
```


## <a name="Debug">func</a> [Debug](/src/target/databoxlog.go?s=2601:2623#L129)
``` go
func Debug(msg string)
```


## <a name="Err">func</a> [Err](/src/target/databoxlog.go?s=2373:2393#L117)
``` go
func Err(msg string)
```


## <a name="GetHttpsCredentials">func</a> [GetHttpsCredentials](/src/target/helperFunction.go?s=3161:3194#L95)
``` go
func GetHttpsCredentials() string
```
GetHttpsCredentials Returns a string containing the HTTPS credentials to pass to https server when offering an https server.
These are read form /run/secrets/DATABOX.pem and are generated by the container-manger at run time.



## <a name="GetStoreURLFromDsHref">func</a> [GetStoreURLFromDsHref](/src/target/helperFunction.go?s=2765:2820#L82)
``` go
func GetStoreURLFromDsHref(href string) (string, error)
```
GetStoreURLFromDsHref extracts the base store url from the href provied in the hypercat descriptions.



## <a name="Info">func</a> [Info](/src/target/databoxlog.go?s=2172:2193#L105)
``` go
func Info(msg string)
```


## <a name="NewDataboxHTTPsAPI">func</a> [NewDataboxHTTPsAPI](/src/target/databoxRequest.go?s=108:146#L3)
``` go
func NewDataboxHTTPsAPI() *http.Client
```


## <a name="NewDataboxHTTPsAPIWithPaths">func</a> [NewDataboxHTTPsAPIWithPaths](/src/target/databoxRequest.go?s=248:314#L8)
``` go
func NewDataboxHTTPsAPIWithPaths(cmRootCaPath string) *http.Client
```


## <a name="Warn">func</a> [Warn](/src/target/databoxlog.go?s=2271:2292#L111)
``` go
func Warn(msg string)
```



## <a name="AggregationType">type</a> [AggregationType](/src/target/coreStoreTS.go?s=70:97#L1)
``` go
type AggregationType string
```









## <a name="ArbiterClient">type</a> [ArbiterClient](/src/target/arbiterClient.go?s=179:383#L8)
``` go
type ArbiterClient struct {
    ArbiterToken string

    ZestC zest.ZestClient
    // contains filtered or unexported fields
}
```






### <a name="NewArbiterClient">func</a> [NewArbiterClient](/src/target/arbiterClient.go?s=495:612#L18)
``` go
func NewArbiterClient(arbiterTokenPath string, zmqPublicKeyPath string, arbiterZMQURI string) (*ArbiterClient, error)
```
NewArbiterClient returns an arbiter client for use by components that require conunication with the arbiter





### <a name="ArbiterClient.GetRootDataSourceCatalogue">func</a> (\*ArbiterClient) [GetRootDataSourceCatalogue](/src/target/arbiterClient.go?s=1596:1672#L51)
``` go
func (arb *ArbiterClient) GetRootDataSourceCatalogue() (HypercatRoot, error)
```
GetRootDataSourceCatalogue is used by the container manager to access the Root hypercat catalogue




### <a name="ArbiterClient.GrantComponentPermission">func</a> (\*ArbiterClient) [GrantComponentPermission](/src/target/arbiterClient.go?s=6122:6174#L224)
``` go
func (arb *ArbiterClient) GrantComponentPermission()
```



### <a name="ArbiterClient.GrantContainerPermissions">func</a> (\*ArbiterClient) [GrantContainerPermissions](/src/target/arbiterClient.go?s=3119:3210#L108)
``` go
func (arb *ArbiterClient) GrantContainerPermissions(permissions ContainerPermissions) error
```
GrantContainerPermissions allows the container manager to grant permissions to an app or driver on a registered store.




### <a name="ArbiterClient.InvalidateCache">func</a> (\*ArbiterClient) [InvalidateCache](/src/target/arbiterClient.go?s=5319:5388#L190)
``` go
func (arb *ArbiterClient) InvalidateCache(href string, method string)
```
InvalidateCache can be used to remove a token from the arbiterClient cache.
This is done automatically if the token is rejected.




### <a name="ArbiterClient.RegesterDataboxComponent">func</a> (\*ArbiterClient) [RegesterDataboxComponent](/src/target/arbiterClient.go?s=2165:2279#L70)
``` go
func (arb *ArbiterClient) RegesterDataboxComponent(name string, tokenString string, databoxType DataboxType) error
```
RegesterDataboxComponent allows the container manager to register a new app, driver or store with the arbiter




### <a name="ArbiterClient.RemoveDataboxComponent">func</a> (\*ArbiterClient) [RemoveDataboxComponent](/src/target/arbiterClient.go?s=6042:6092#L220)
``` go
func (arb *ArbiterClient) RemoveDataboxComponent()
```



### <a name="ArbiterClient.RequestToken">func</a> (\*ArbiterClient) [RequestToken](/src/target/arbiterClient.go?s=4346:4428#L155)
``` go
func (arb *ArbiterClient) RequestToken(href string, method string) ([]byte, error)
```
RequestToken is used internally to request a token from the arbiter




### <a name="ArbiterClient.RevokeComponentPermission">func</a> (\*ArbiterClient) [RevokeComponentPermission](/src/target/arbiterClient.go?s=6204:6257#L228)
``` go
func (arb *ArbiterClient) RevokeComponentPermission()
```



## <a name="ContainerManagerOptions">type</a> [ContainerManagerOptions](/src/target/types.go?s=89:859#L1)
``` go
type ContainerManagerOptions struct {
    Version               string
    SwarmAdvertiseAddress string
    DefaultRegistryHost   string
    DefaultRegistry       string
    DefaultAppStore       string
    DefaultStoreImage     string
    ContainerManagerImage string
    CoreUIImage           string
    ArbiterImage          string
    CoreNetworkImage      string
    CoreNetworkRelayImage string
    AppServerImage        string
    ExportServiceImage    string
    EnableDebugLogging    bool
    ClearSLAs             bool
    OverridePasword       string
    Hostname              string
    InternalIPs           []string
    ExternalIP            string
    HostPath              string
    Arch                  string //current architecture used to chose the correct docker images "" for x86 or "arm64v8" for arm64v8 ;-)
}
```
ContainerManagerOptions is used to configure the Container Manager










## <a name="ContainerPermissions">type</a> [ContainerPermissions](/src/target/arbiterClient.go?s=2859:2995#L101)
``` go
type ContainerPermissions struct {
    Name    string   `json:"name"`
    Route   Route    `json:"route"`
    Caveats []string `json:"caveats"`
}
```









## <a name="CoreStoreClient">type</a> [CoreStoreClient](/src/target/coreStoreClient.go?s=150:433#L5)
``` go
type CoreStoreClient struct {
    ZestC      zest.ZestClient
    Arbiter    *ArbiterClient
    ZEndpoint  string
    DEndpoint  string
    KVJSON     *KVStore
    KVText     *KVStore
    KVBin      *KVStore
    TSBlobJSON *TSBlobStore
    TSBlobText *TSBlobStore
    TSBlobBin  *TSBlobStore
    TSJSON     *TSStore
}
```






### <a name="NewCoreStoreClient">func</a> [NewCoreStoreClient](/src/target/coreStoreClient.go?s=723:860#L25)
``` go
func NewCoreStoreClient(arbiterClient *ArbiterClient, zmqPublicKeyPath string, storeEndPoint string, enableLogging bool) *CoreStoreClient
```

### <a name="NewDefaultCoreStoreClient">func</a> [NewDefaultCoreStoreClient](/src/target/coreStoreClient.go?s=435:504#L19)
``` go
func NewDefaultCoreStoreClient(storeEndPoint string) *CoreStoreClient
```




### <a name="CoreStoreClient.GetStoreDataSourceCatalogue">func</a> (\*CoreStoreClient) [GetStoreDataSourceCatalogue](/src/target/coreStoreClient.go?s=1808:1898#L54)
``` go
func (csc *CoreStoreClient) GetStoreDataSourceCatalogue(href string) (HypercatRoot, error)
```



### <a name="CoreStoreClient.RegisterDatasource">func</a> (\*CoreStoreClient) [RegisterDatasource](/src/target/coreStoreClient.go?s=2509:2590#L79)
``` go
func (csc *CoreStoreClient) RegisterDatasource(metadata DataSourceMetadata) error
```
RegisterDatasource is used by apps and drivers to register datasource in stores they
own.




## <a name="DataSource">type</a> [DataSource](/src/target/types.go?s=1601:1900#L52)
``` go
type DataSource struct {
    Type          string       `json:"type"`
    Required      bool         `json:"required"`
    Name          string       `json:"name"`
    Clientid      string       `json:"clientid"`
    Granularities []string     `json:"granularities"`
    Hypercat      HypercatItem `json:"hypercat"`
}
```









## <a name="DataSourceMetadata">type</a> [DataSourceMetadata](/src/target/types.go?s=4839:5081#L108)
``` go
type DataSourceMetadata struct {
    Description    string
    ContentType    string
    Vendor         string
    DataSourceType string
    DataSourceID   string
    StoreType      StoreType
    IsActuator     bool
    Unit           string
    Location       string
}
```






### <a name="HypercatToDataSourceMetadata">func</a> [HypercatToDataSourceMetadata](/src/target/helperFunction.go?s=815:922#L11)
``` go
func HypercatToDataSourceMetadata(hypercatDataSourceDescription string) (DataSourceMetadata, string, error)
```
HypercatToDataSourceMetadata is a helper function to convert the hypercat description of a datasource to a DataSourceMetadata instance
Also returns the store url for this data source.





## <a name="DataboxType">type</a> [DataboxType](/src/target/types.go?s=861:884#L18)
``` go
type DataboxType string
```

``` go
const (
    DataboxTypeApp    DataboxType = "app"
    DataboxTypeDriver DataboxType = "driver"
    DataboxTypeStore  DataboxType = "store"
)
```









## <a name="ExportWhitelist">type</a> [ExportWhitelist](/src/target/types.go?s=1494:1599#L47)
``` go
type ExportWhitelist struct {
    Url         string `json:"url"`
    Description string `json:"description"`
}
```









## <a name="ExternalWhitelist">type</a> [ExternalWhitelist](/src/target/types.go?s=1380:1492#L42)
``` go
type ExternalWhitelist struct {
    Urls        []string `json:"urls"`
    Description string   `json:"description"`
}
```









## <a name="Filter">type</a> [Filter](/src/target/coreStoreTS.go?s=692:775#L17)
``` go
type Filter struct {
    TagName    string
    FilterType FilterType
    Value      string
}
```
Filter types to hold the required data to apply the filtering functions of the structured json API










## <a name="FilterType">type</a> [FilterType](/src/target/coreStoreTS.go?s=99:121#L1)
``` go
type FilterType string
```









## <a name="HypercatItem">type</a> [HypercatItem](/src/target/types.go?s=5701:5822#L147)
``` go
type HypercatItem struct {
    ItemMetadata []interface{} `json:"item-metadata"`
    Href         string        `json:"href"`
}
```









## <a name="HypercatRoot">type</a> [HypercatRoot](/src/target/types.go?s=5560:5699#L142)
``` go
type HypercatRoot struct {
    CatalogueMetadata []RelValPair   `json:"catalogue-metadata"`
    Items             []HypercatItem `json:"items"`
}
```









## <a name="KVStore">type</a> [KVStore](/src/target/coreStoreKV.go?s=59:142#L1)
``` go
type KVStore struct {
    // contains filtered or unexported fields
}
```









### <a name="KVStore.Delete">func</a> (\*KVStore) [Delete](/src/target/coreStoreKV.go?s=894:959#L30)
``` go
func (kvj *KVStore) Delete(dataSourceID string, key string) error
```
Delete deletes data under the key.




### <a name="KVStore.DeleteAll">func</a> (\*KVStore) [DeleteAll](/src/target/coreStoreKV.go?s=1117:1173#L39)
``` go
func (kvj *KVStore) DeleteAll(dataSourceID string) error
```
DeleteAll deletes all keys and data from the datasource.




### <a name="KVStore.ListKeys">func</a> (\*KVStore) [ListKeys](/src/target/coreStoreKV.go?s=1327:1394#L48)
``` go
func (kvj *KVStore) ListKeys(dataSourceID string) ([]string, error)
```
ListKeys returns an array of key registed under the dataSourceID




### <a name="KVStore.Observe">func</a> (\*KVStore) [Observe](/src/target/coreStoreKV.go?s=1731:1811#L67)
``` go
func (kvj *KVStore) Observe(dataSourceID string) (<-chan ObserveResponse, error)
```



### <a name="KVStore.ObserveKey">func</a> (\*KVStore) [ObserveKey](/src/target/coreStoreKV.go?s=1905:2000#L75)
``` go
func (kvj *KVStore) ObserveKey(dataSourceID string, key string) (<-chan ObserveResponse, error)
```



### <a name="KVStore.Read">func</a> (\*KVStore) [Read](/src/target/coreStoreKV.go?s=687:760#L21)
``` go
func (kvj *KVStore) Read(dataSourceID string, key string) ([]byte, error)
```
Read will read the vale store at under tha key
return data is a  object of the format {"timestamp":213123123,"data":[data-written-by-driver]}




### <a name="KVStore.Write">func</a> (\*KVStore) [Write](/src/target/coreStoreKV.go?s=353:433#L11)
``` go
func (kvj *KVStore) Write(dataSourceID string, key string, payload []byte) error
```
Write Write will add data to the key value data store.




## <a name="LogEntries">type</a> [LogEntries](/src/target/databoxlog.go?s=126:205#L4)
``` go
type LogEntries struct {
    Msg  string `json:"msg"`
    Type string `json:"type"`
}
```









## <a name="Logger">type</a> [Logger](/src/target/databoxlog.go?s=78:124#L1)
``` go
type Logger struct {
    Store *CoreStoreClient
}
```






### <a name="New">func</a> [New](/src/target/databoxlog.go?s=250:321#L13)
``` go
func New(store *CoreStoreClient, outputDebugLogs bool) (*Logger, error)
```




### <a name="Logger.ChkErr">func</a> (Logger) [ChkErr](/src/target/databoxlog.go?s=1417:1450#L58)
``` go
func (l Logger) ChkErr(err error)
```



### <a name="Logger.Debug">func</a> (Logger) [Debug](/src/target/databoxlog.go?s=1247:1280#L52)
``` go
func (l Logger) Debug(msg string)
```



### <a name="Logger.Err">func</a> (Logger) [Err](/src/target/databoxlog.go?s=1082:1113#L47)
``` go
func (l Logger) Err(msg string)
```



### <a name="Logger.GetLastNLogEntries">func</a> (Logger) [GetLastNLogEntries](/src/target/databoxlog.go?s=1524:1570#L67)
``` go
func (l Logger) GetLastNLogEntries(n int) Logs
```



### <a name="Logger.GetLastNLogEntriesRaw">func</a> (Logger) [GetLastNLogEntriesRaw](/src/target/databoxlog.go?s=1702:1753#L77)
``` go
func (l Logger) GetLastNLogEntriesRaw(n int) []byte
```



### <a name="Logger.Info">func</a> (Logger) [Info](/src/target/databoxlog.go?s=750:782#L37)
``` go
func (l Logger) Info(msg string)
```



### <a name="Logger.Warn">func</a> (Logger) [Warn](/src/target/databoxlog.go?s=916:948#L42)
``` go
func (l Logger) Warn(msg string)
```



## <a name="Logs">type</a> [Logs](/src/target/databoxlog.go?s=207:229#L9)
``` go
type Logs []LogEntries
```









## <a name="Macaroon">type</a> [Macaroon](/src/target/types.go?s=1019:1039#L26)
``` go
type Macaroon string
```









## <a name="Manifest">type</a> [Manifest](/src/target/types.go?s=1902:3186#L61)
``` go
type Manifest struct {
    ManifestVersion      int                  `json:"manifest-version"` //
    Name                 string               `json:"name"`
    DataboxType          DataboxType          `json:"databox-type"`
    Version              string               `json:"version"`     //this is databox version e.g 0.3.1
    Description          string               `json:"description"` // free text description
    Author               string               `json:"author"`      //Tosh Brown <Anthony.Brown@nottingham.ac.uk>
    License              string               `json:"license"`     //Software licence
    Tags                 []string             `json:"tags"`        //search tags
    Homepage             string               `json:"homepage"`    //homepage url
    Repository           Repository           `json:"repository"`
    Packages             []Package            `json:"packages"`
    DataSources          []DataSource         `json:"datasources"`
    ExportWhitelists     []ExportWhitelist    `json:"export-whitelist"`
    ExternalWhitelist    []ExternalWhitelist  `json:"external-whitelist"`
    ResourceRequirements ResourceRequirements `json:"resource-requirements"`
    DisplayName          string               `json:"displayName"`
    StoreURL             string               `json:"storeUrl"`
}
```









## <a name="ObserveResponse">type</a> [ObserveResponse](/src/target/types.go?s=5856:5970#L157)
``` go
type ObserveResponse struct {
    TimestampMS  int64
    DataSourceID string
    Key          string
    Data         []byte
}
```
OBSERVE RESPONSE










## <a name="Package">type</a> [Package](/src/target/types.go?s=1122:1378#L33)
``` go
type Package struct {
    Name        string   `json:"name"`
    Purpose     string   `json:"purpose"`
    Install     string   `json:"install"`
    Risks       string   `json:"risks"`
    Benefits    string   `json:"benefits"`
    DataSources []string `json:"datastores"`
}
```









## <a name="RelValPair">type</a> [RelValPair](/src/target/types.go?s=5400:5476#L132)
``` go
type RelValPair struct {
    Rel string `json:"rel"`
    Val string `json:"val"`
}
```









## <a name="RelValPairBool">type</a> [RelValPairBool](/src/target/types.go?s=5478:5558#L137)
``` go
type RelValPairBool struct {
    Rel string `json:"rel"`
    Val bool   `json:"val"`
}
```









## <a name="Repository">type</a> [Repository](/src/target/types.go?s=1041:1120#L28)
``` go
type Repository struct {
    Type string `json:"Type"`
    Url  string `json:"url"`
}
```









## <a name="ResourceRequirements">type</a> [ResourceRequirements](/src/target/types.go?s=4772:4837#L104)
``` go
type ResourceRequirements struct {
    Store string `json:"store"`
}
```









## <a name="Route">type</a> [Route](/src/target/arbiterClient.go?s=2745:2857#L95)
``` go
type Route struct {
    Target string `json:"target"`
    Path   string `json:"path"`
    Method string `json:"method"`
}
```









## <a name="SLA">type</a> [SLA](/src/target/types.go?s=3188:4770#L81)
``` go
type SLA struct {
    ManifestVersion      int                  `json:"manifest-version"` //
    Name                 string               `json:"name"`             // container name  e.g core-store
    Image                string               `json:"image"`            //docker image tag e.g datboxsystems/core-store-amd64
    DataboxType          DataboxType          `json:"databox-type"`
    Version              string               `json:"version"`     //this is databox version e.g 0.3.1
    Description          string               `json:"description"` // free text description
    Author               string               `json:"author"`      //Tosh Brown <Anthony.Brown@nottingham.ac.uk>
    License              string               `json:"license"`     //Software licence
    Tags                 []string             `json:"tags"`        //search tags
    Homepage             string               `json:"homepage"`    //homepage url
    Repository           Repository           `json:"repository"`
    Packages             []Package            `json:"packages"`
    AllowedCombinations  []string             `json:"allowed-combinations"`
    Datasources          []DataSource         `json:"datasources"`
    ExportWhitelists     []ExportWhitelist    `json:"export-whitelist"`
    ExternalWhitelist    []ExternalWhitelist  `json:"external-whitelist"`
    ResourceRequirements ResourceRequirements `json:"resource-requirements"`
    DisplayName          string               `json:"displayName"`
    StoreURL             string               `json:"storeUrl"`
    Registry             string               `json:"registry"`
}
```









## <a name="StoreContentType">type</a> [StoreContentType](/src/target/types.go?s=5221:5249#L126)
``` go
type StoreContentType string
```

``` go
const ContentTypeBINARY StoreContentType = "BINARY"
```

``` go
const ContentTypeJSON StoreContentType = "JSON"
```

``` go
const ContentTypeTEXT StoreContentType = "TEXT"
```









## <a name="StoreType">type</a> [StoreType](/src/target/types.go?s=5083:5104#L120)
``` go
type StoreType string
```

``` go
const StoreTypeKV StoreType = "kv"
```

``` go
const StoreTypeTS StoreType = "ts"
```

``` go
const StoreTypeTSBlob StoreType = "ts/blob"
```









## <a name="TSBlobStore">type</a> [TSBlobStore](/src/target/coreStoreTSBlob.go?s=70:157#L1)
``` go
type TSBlobStore struct {
    // contains filtered or unexported fields
}
```









### <a name="TSBlobStore.Earliest">func</a> (\*TSBlobStore) [Earliest](/src/target/coreStoreTSBlob.go?s=1878:1947#L57)
``` go
func (tbs *TSBlobStore) Earliest(dataSourceID string) ([]byte, error)
```
Earliest will retrieve the first entry stored at the requested datasource ID
return data is a byte array contingin  of the format
{"timestamp":213123123,"data":[data-written-by-driver]}




### <a name="TSBlobStore.FirstN">func</a> (\*TSBlobStore) [FirstN](/src/target/coreStoreTSBlob.go?s=2633:2707#L79)
``` go
func (tbs *TSBlobStore) FirstN(dataSourceID string, n int) ([]byte, error)
```
FirstN will retrieve the first N entries stored at the requested datasource ID
return data is a byte array contingin  of the format
{"timestamp":213123123,"data":[data-written-by-driver]}




### <a name="TSBlobStore.LastN">func</a> (\*TSBlobStore) [LastN](/src/target/coreStoreTSBlob.go?s=2245:2318#L68)
``` go
func (tbs *TSBlobStore) LastN(dataSourceID string, n int) ([]byte, error)
```
LastN will retrieve the last N entries stored at the requested datasource ID
return data is a byte array contingin  of the format
{"timestamp":213123123,"data":[data-written-by-driver]}




### <a name="TSBlobStore.Latest">func</a> (\*TSBlobStore) [Latest](/src/target/coreStoreTSBlob.go?s=1515:1582#L46)
``` go
func (tbs *TSBlobStore) Latest(dataSourceID string) ([]byte, error)
```
TSBlobLatest will retrieve the last entry stored at the requested datasource ID
return data is a byte array contingin  of the format
{"timestamp":213123123,"data":[data-written-by-driver]}




### <a name="TSBlobStore.Length">func</a> (\*TSBlobStore) [Length](/src/target/coreStoreTSBlob.go?s=3837:3901#L110)
``` go
func (tbs *TSBlobStore) Length(dataSourceID string) (int, error)
```
TSBlobLength returns then number of items stored in the timeseries




### <a name="TSBlobStore.Observe">func</a> (\*TSBlobStore) [Observe](/src/target/coreStoreTSBlob.go?s=4457:4541#L134)
``` go
func (tbs *TSBlobStore) Observe(dataSourceID string) (<-chan ObserveResponse, error)
```
Observe allows you to get notifications when a new value is written by a driver
the returned chan receives chan ObserveResponse the data value og which contins json of the
form {"TimestampMS":213123123,"Json":byte[]}




### <a name="TSBlobStore.Range">func</a> (\*TSBlobStore) [Range](/src/target/coreStoreTSBlob.go?s=3479:3585#L101)
``` go
func (tbs *TSBlobStore) Range(dataSourceID string, formTimeStamp int64, toTimeStamp int64) ([]byte, error)
```
Range will retrieve all entries between  formTimeStamp and toTimeStamp timestamp in ms since unix epoch
return data is a byte array contingin  of the format
{"timestamp":213123123,"data":[data-written-by-driver]}




### <a name="TSBlobStore.Since">func</a> (\*TSBlobStore) [Since](/src/target/coreStoreTSBlob.go?s=3028:3116#L90)
``` go
func (tbs *TSBlobStore) Since(dataSourceID string, sinceTimeStamp int64) ([]byte, error)
```
Since will retrieve all entries since the requested timestamp (ms since unix epoch)
return data is a byte array contingin  of the format
{"timestamp":213123123,"data":[data-written-by-driver]}




### <a name="TSBlobStore.Write">func</a> (\*TSBlobStore) [Write](/src/target/coreStoreTSBlob.go?s=439:511#L12)
``` go
func (tbs *TSBlobStore) Write(dataSourceID string, payload []byte) error
```
Write will add data to the times series data store. Data will be time stamped at insertion (format ms since 1970)




### <a name="TSBlobStore.WriteAt">func</a> (\*TSBlobStore) [WriteAt](/src/target/coreStoreTSBlob.go?s=772:862#L22)
``` go
func (tbs *TSBlobStore) WriteAt(dataSourceID string, timstamp int64, payload []byte) error
```
WriteAt will add data to the times series data store. Data will be time stamped with the timstamp provided in the
timstamp paramiter (format ms since 1970)




## <a name="TSStore">type</a> [TSStore](/src/target/coreStoreTS.go?s=965:1048#L29)
``` go
type TSStore struct {
    // contains filtered or unexported fields
}
```









### <a name="TSStore.Earliest">func</a> (TSStore) [Earliest](/src/target/coreStoreTS.go?s=2662:2726#L82)
``` go
func (tsc TSStore) Earliest(dataSourceID string) ([]byte, error)
```
Earliest will retrieve the first entry stored at the requested datasource ID
return data is a JSON object of the format {"timestamp":213123123,"data":[data-written-by-driver]}




### <a name="TSStore.FirstN">func</a> (TSStore) [FirstN](/src/target/coreStoreTS.go?s=3446:3543#L102)
``` go
func (tsc TSStore) FirstN(dataSourceID string, n int, opt TimeSeriesQueryOptions) ([]byte, error)
```
FirstN will retrieve the first N entries stored at the requested datasource ID
return data is an array of JSON objects of the format {"timestamp":213123123,"data":[data-written-by-driver]}




### <a name="TSStore.LastN">func</a> (TSStore) [LastN](/src/target/coreStoreTS.go?s=3017:3113#L92)
``` go
func (tsc TSStore) LastN(dataSourceID string, n int, opt TimeSeriesQueryOptions) ([]byte, error)
```
LastN will retrieve the last N entries stored at the requested datasource ID
return data is an array of JSON objects of the format {"timestamp":213123123,"data":[data-written-by-driver]}




### <a name="TSStore.Latest">func</a> (TSStore) [Latest](/src/target/coreStoreTS.go?s=2322:2384#L72)
``` go
func (tsc TSStore) Latest(dataSourceID string) ([]byte, error)
```
Latest will retrieve the last entry stored at the requested datasource ID
return data is a JSON object of the format {"timestamp":213123123,"data":[data-written-by-driver]}




### <a name="TSStore.Length">func</a> (TSStore) [Length](/src/target/coreStoreTS.go?s=4751:4810#L131)
``` go
func (tsc TSStore) Length(dataSourceID string) (int, error)
```
Length retruns the number of records stored for that dataSourceID




### <a name="TSStore.Observe">func</a> (TSStore) [Observe](/src/target/coreStoreTS.go?s=5136:5215#L153)
``` go
func (tsc TSStore) Observe(dataSourceID string) (<-chan ObserveResponse, error)
```



### <a name="TSStore.Range">func</a> (TSStore) [Range](/src/target/coreStoreTS.go?s=4351:4480#L122)
``` go
func (tsc TSStore) Range(dataSourceID string, formTimeStamp int64, toTimeStamp int64, opt TimeSeriesQueryOptions) ([]byte, error)
```
Range will retrieve all entries between  formTimeStamp and toTimeStamp timestamp in ms since unix epoch
return data is a JSON object of the format {"timestamp":213123123,"data":[data-written-by-driver]}




### <a name="TSStore.Since">func</a> (TSStore) [Since](/src/target/coreStoreTS.go?s=3870:3981#L112)
``` go
func (tsc TSStore) Since(dataSourceID string, sinceTimeStamp int64, opt TimeSeriesQueryOptions) ([]byte, error)
```
Since will retrieve all entries since the requested timestamp (ms since unix epoch)
return data is a JSON object of the format {"timestamp":213123123,"data":[data-written-by-driver]}




### <a name="TSStore.Write">func</a> (TSStore) [Write](/src/target/coreStoreTS.go?s=1318:1385#L42)
``` go
func (tsc TSStore) Write(dataSourceID string, payload []byte) error
```
Write will add data to the times series data store. Data will be time stamped at insertion (format ms since 1970)




### <a name="TSStore.WriteAt">func</a> (TSStore) [WriteAt](/src/target/coreStoreTS.go?s=1641:1726#L52)
``` go
func (tsc TSStore) WriteAt(dataSourceID string, timstamp int64, payload []byte) error
```
WriteAt will add data to the times series data store. Data will be time stamped with the timstamp provided in the
timstamp paramiter (format ms since 1970)




## <a name="TimeSeriesQueryOptions">type</a> [TimeSeriesQueryOptions](/src/target/coreStoreTS.go?s=859:963#L24)
``` go
type TimeSeriesQueryOptions struct {
    AggregationFunction AggregationType
    Filter              *Filter
}
```
TimeSeriesQueryOptions describes the query options for the structured json API














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

