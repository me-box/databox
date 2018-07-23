# Databox
The Databox platform is an open-source personal networked device, augmented by cloud-hosted services, that collates, curates, and mediates access to an individual’s personal data by verified and audited third-party applications and services. The Databox will form the heart of an individual’s personal data processing ecosystem, providing a platform for managing secure access to data and enabling authorised third parties to provide the owner with authenticated services, including services that may be accessed while roaming outside the home environment. Databox project is led by Dr Hamed Haddadi (Imperial College) in collaboration with Dr Richard Mortier (University of Cambridge) and Professors Derek McAuley, Tom Rodden, Chris Greenhalgh, and Andy Crabtree (University of Nottingham) and funded by EPSRC. See http://www.databoxproject.uk/ for more information.

## Getting Started

These instructions will get a copy of the Databox up and running on your local machine. For development and testing purposes, see Development section below.

### Prerequisites

1) Requires Docker. Read [here](https://docs.docker.com/engine/installation/) for docker installation.
2) Requires Git (if it is not already on your machine). Read [here](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) for git installation.
3) Requires golang grater than 10.0 Read [here](https://golang.org/doc/install) (Required for now, will only be needed to build from source in future)

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
make start
```
The above script pulls Databox pre-build images published on [Docker hub](<https://hub.docker.com/r/databoxsystems>) and run  Databox on your local machine.

Once it's started, point a web browser at <http://127.0.0.1> and follow the instructions to configure your HTTPS certificates to access Databox UI securely (using a web browser <https://127.0.0.1>, or the iOS and Android app).

> Note: Using the databox iOS and Android apps with MacOS may require you to modify your firewall to enable external access to port 80 and 443.

To stop databox and clean up,
```
make stop
```

# Development

## Get Started with the Graphical SDK

The graphical SDK will allow you to quickly build and test simple databox apps. To start the SDK run:
```
./bin/databox sdk -start
```
The SDK web UI is available at http://127.0.0.1:8086

To stop the SDK run:
```
./bin/databox sdk -stop
```

## Developing apps and drivers without the SDK

It is possible to develop Databox apps and driver without the SDK. Currently, [Python](https://github.com/me-box/lib-python-databox), [Golang](https://github.com/me-box/lib-go-databox) and [NodeJs](https://github.com/me-box/node-databox) all have support libraries. Building outside the SDK allows you to make smaller more efficient containers and use more third-party libraries.

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

To develop on the platform and core components the databox start command allows you to replace the databoxsystems core images with your oen. For example to replace the arbiter.

```
docker build databoxdev/arbiter .                                     # build your updated arbiter image
./bin/databox start --release 0.4.0 --arbiter databoxdev/arbiter      # start databox using the new code
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

## Setting up a full development clone of databox

>> Multi arch builds only work on Docker for Mac experimental
>> enable docker cli experimental features "experimental": "enabled" ~/.docker/config.json

```
    make all DEFAULT_REG=[your docker hub reg tag]
```

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
