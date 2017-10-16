<<<<<<< HEAD
# Databox
The Databox platform is an open-source personal networked device, augmented by cloud-hosted services, that collates, curates, and mediates access to an individual’s personal data by verified and audited third party applications and services. The Databox will form the heart of an individual’s personal data processing ecosystem, providing a platform for managing secure access to data and enabling authorised third parties to provide the owner with authenticated services, including services that may be accessed while roaming outside the home environment. Databox project is led by Dr Hamed Haddadi (Imperial College) in collaboration with Dr Richard Mortier (University of Cambridge) and Professors Derek McAuley, Tom Rodden, Chris Greenhalgh, and Andy Crabtree (University of Nottingham) and funded by EPSRC. See http://www.databoxproject.uk/ for more information.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine. For development and testing purposes, see Development section below.
=======
# DataBox
The Databox platform is an open-source personal networked device, augmented by cloud-hosted services, that collates, curates, and mediates access to an individual’s personal data by verified and audited third party applications and services. The Databox will form the heart of an individual’s personal data processing ecosystem, providing a platform for managing secure access to data and enabling authorised third parties to provide the owner with authenticated services, including services that may be accessed while roaming outside the home environment. Databox project is led by Dr. Hamed Haddadi (Imperial College) in collaboration with Dr. Richard Mortier (University of Cambridge) and Professors Derek McAuley, Tom Rodden, Chris Greenhalgh, and Andy Crabtree (University of Nottingham) and funded by EPSRC. See http://www.databoxproject.uk/ for more information

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.
>>>>>>> Updated Readme

### Prerequisites

1) Requires Docker. Read [here](https://docs.docker.com/engine/installation/) for docker installation.
<<<<<<< HEAD
2) Once docker is installed and running, install  docker-compose. Read [here](https://docs.docker.com/compose/install/) for installation.
3) Requires Git (if it is not already on your machine). Read [here](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) for git installation.


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
The above script pulls Databox pre-build images published on [Docker hub](<https://hub.docker.com/r/databoxsystems>) and run  Databox in your local machine.

Once it's started, point a web browser at <https://127.0.0.1:8989> to access Databox UI.

To stop databox and clean up,
```
./databox-stop
```
=======
2) Once docker is installed and running, install  docker-compose. Read [here](https://docs.docker.com/compose/install/) for installation. 
3) Requires Git (if it is not already on your machine). Read [here](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) for git installation.


### Installation
1) Clone Databox Git repo and run on your machine
```
        terminal$ git clone -b https://github.com/me-box/databox.git
```

```
     terminal$ cd databox
     terminal$ ./databox-start
     
```
### Operation

Once docker is installed, just run the following to get your databox up and
running using images published to <https://hub.docker.com/r/databoxsystems>:
```
  terminal$  ./databox-start
```    

Once it's started point a web browser at <https://127.0.0.1:8989>.

To stop databox and clean up,
```
  terminal$  ./databox-stop
``` 
>>>>>>> Updated Readme
### Development

To develop on the platform and core components run the data-box start script with 'dev' parameter. See below.

<<<<<<< HEAD
```
./databox-start dev
```
=======
  terminal$  ./databox-start dev
>>>>>>> Updated Readme

Unlike using the pre-build images, this will clone all the relevant source repositories locally, and build them into the
required Docker images. To try your component out, add your code into a
directory with a Databox manifest and `Dockerfile`, and then add a reference to
it in `docker-compose-dev-local-images.yaml`. Your image will then be built
alongside the platform. To install your app, upload the manifest to the local
app store on <http://127.0.0.1:8181> and it should then become visible in the
UI, ready for you to install.

<<<<<<< HEAD
=======
Databox has a number of platform components, divided into two parts:  Core and User components.

### Core Components

* [Databox container manager](https://github.com/me-box/core-container-manager)

* [databox-arbiter](https://github.com/me-box/core-arbiter)

* [databox-export-service](https://github.com/me-box/core-export-service)

* [databox-store-json](https://github.com/me-box/store-json)

* [databox-store-timeseries](https://github.com/me-box/store-timeseries)

* [databox-app-server](https://github.com/me-box/platform-app-server) Server for storing and serving databox manifests

### User Components
#### Drivers
* [driver-sensingkit](https://github.com/me-box/driver-sensingkit)
* [driver-google-takeout](https://github.com/me-box/driver-google-takeout)
* [driver-phillips-hue](https://github.com/me-box/driver-phillips-hue)
* [driver-os-monitor](https://github.com/me-box/driver-os-monitor)
* [driver-twitter](https://github.com/me-box/driver-twitter)
* [driver-tplink-smart-plug](https://github.com/me-box/driver-tplink-smart-plug)    
#### Apps 
* [app-light-graph] https://github.com/me-box/app-light-graph
* [app-twitter-sentiment] https://github.com/me-box/app-twitter-sentiment
* [app-os-monitor] https://github.com/me-box/app-os-monitor
                
### Libraries for writing drivers and apps
* [lib-node-databox](https://github.com/me-box/node-databox) nodejs lib for databox apps and drivers
* [lib-python-databox](https://github.com/me-box/lib-python-databox) python lib for databox apps and drivers
* [lib-go-databox](https://github.com/me-box/lib-go-databox) go lib for databox apps and drivers
#### API and Sustem specifications
For Databox System Design is find [here](https://github.com/pooyadav/documents/blob/master/specs/system_overview.md) and General API specifications are found [here](https://github.com/pooyadav/documents/blob/master/specs/api_specification.md)

### Running the tests
```
terminal$ ./databox-test

```

## Contributing

Please see the current [issues](https://github.com/me-box/databox/issues). [Fork](https://github.com/me-box/databox#fork-destination-box) the databox repo and fix bugs/issues and submit pull request. Read more on Fork and Pull [here](https://help.github.com/articles/fork-a-repo/).

## Versioning

This documentation is up-to-date till this [commit](https://github.com/me-box/databox/tree/a62ed323d98c0a6fd32f020eca9352f8da687c09). The master branches on all components points to the current release and are tagged in git using [semver](http://semver.org/).

## Authors

The list of [contributors](https://github.com/me-box/databox/contributors) who participated in this project.

## License
MIT Licence, See [here](https://github.com/me-box/databox/blob/master/LICENSE)

## Known issues
>>>>>>> Updated Readme

#### Get Started with the Graphical SDK

<<<<<<< HEAD
The graphical SDK will allow you to quickly build and test simple databox apps. The current version of SDK run by default in `dev` mode. To start the sdk run:
```
./databox-start sdk
```
The SDK web UI is available at http://127.0.0.1:8086

To stop the SDK run:
```
./databox-stop sdk
```
=======
The graphical SDK will allow you to quickly build and test simple databox apps. Current version of SDK run bydefault in `dev` mode. To start the sdk run:
```
terminal$ ./databox-start sdk
```        
>>>>>>> Updated Readme

When you start in development mode only the `core-components` are built from source. If you wish to develop one of the available apps or drivers then you can add them to you local install using:

```
./databox-install-component driver-os-monitor
```

This will download and build the code on your machine and upload the Databox manifest to your local app store. You can also use this with your repositories  and forks using:

```
./databox-install-component [GITHUB_USERNAME]/[GITHUB_REPONAME]
```

### Core Components

Databox has a number of platform components, divided into two parts:  Core and User components.

* [Databox-container-manager](https://github.com/me-box/core-container-manager) Container manager controls build, installation and running funtions of the other databox components. 
* [databox-arbiter](https://github.com/me-box/core-arbiter) Arbiter manages the flow of data by minting tokens and controlling store discovery.
* [databox-export-service](https://github.com/me-box/core-export-service) This service controls the data to be exported to external URLs.
* [databox-store-json](https://github.com/me-box/store-json) This is a datastore used by apps and drivers to store and retrieve JSON data.
* [databox-store-timeseries](https://github.com/me-box/store-timeseries)  This is a datastore used by apps and drivers to store and retrieve JSON data or JPEG images.
* [databox-app-server](https://github.com/me-box/platform-app-server) This is a Server for storing and serving databox manifests.

### User Components
#### Drivers
* [driver-sensingkit](https://github.com/me-box/driver-sensingkit) This driver provides SensingKit mobile sensor data.
* [driver-google-takeout](https://github.com/me-box/driver-google-takeout) This driver supports bulk import of google takeout data.
* [driver-phillips-hue](https://github.com/me-box/driver-phillips-hue) This drivers allows connection to Phillips Hue Platform.
* [driver-os-monitor](https://github.com/me-box/driver-os-monitor) This driver monitors the databox hardware by fetching Memory consumption and CPU load.
* [driver-twitter](https://github.com/me-box/driver-twitter) This driver streams data from a twitter account into a datastore.
* [driver-tplink-smart-plug](https://github.com/me-box/driver-tplink-smart-plug) This driver collects data from TP-Link smart plugs.
#### Apps
* [app-light-graph](https://github.com/me-box/app-light-graph) An app that plots mobile phone light sensor data.
* [app-twitter-sentiment](https://github.com/me-box/app-twitter-sentiment) An app that used data from driver-twitter to calculate tweet sentiment.
* [app-os-monitor](https://github.com/me-box/app-os-monitor) An app to plot the output of the data feteched by [driver-os-monitor](https://github.com/me-box/driver-os-monitor).

<<<<<<< HEAD
### Libraries for writing drivers and apps
For writing a new driver or app for Databox, one needs [Databox APIs](./documents/api_specification.md). To make app/driver development easy, we have wrapped Databox APIs in [nodejs](https://nodejs.org/en/), [python](https://docs.python.org/3.4/library/index.html) and [go](https://golang.org/). Using any of these libraries, a developer can build their databox app/driver.
* [lib-node-databox](https://github.com/me-box/node-databox): Databox Nodejs API library for building databox apps and drivers.
* [lib-python-databox](https://github.com/me-box/lib-python-databox): Databox Python API library for building databox apps and drivers.
* [lib-go-databox](https://github.com/me-box/lib-go-databox): Databox Go API library for building databox apps and drivers.
#### API and System specifications
Databox System Design document can be find [here](./documents/system_overview.md) and general API specifications are [here](./documents/api_specification.md).

### Running the tests

```
./databox-test
=======
To stop the SDK run: 
```
terminal$ ./databox-stop sdk
```
>>>>>>> Updated Readme

```
For more details, have a look [here](./TESTING.md).

## Contributing

The databox project welcomes contributions via pull requests see [CONTRIBUTING.md](./CONTRIBUTING.md) for more information. Good start is from having a look on  the current [issues](https://github.com/me-box/databox/issues) and [forking](https://github.com/me-box/databox#fork-destination-box) the databox repo and fixing bugs/issues and submitting a pull request. Read more on Fork and Pull [here](https://help.github.com/articles/fork-a-repo/).

## Versioning

This documentation is up-to-date till this [commit](https://github.com/me-box/databox/tree/a62ed323d98c0a6fd32f020eca9352f8da687c09). The master branches on all components points to the current release and are tagged in git using [semver](http://semver.org/).

## Authors

The list of [contributors](https://github.com/me-box/databox/contributors) who participated in this project.

## License
MIT Licence, See [here](./LICENSE).

## Contributing 

The Databox project welcomes contributions via pull requests see [CONTRIBUTING.md](./CONTRIBUTING.md) for more information.

## Known issues

<<<<<<< HEAD
### During development of  system components and custom drivers
=======
*       To develop on the platform and core components you can sometimes get an error:

        ```
                TLS certificates invalid
        ```
>>>>>>> Updated Readme

*  While building the platform and core components you can sometimes get an error:
```
TLS certificates invalid
```
This is caused when Databox is started before docker has cleaned up the networks.

<<<<<<< HEAD
This issue can be fixed if you run `./databox-start`

*  In some cases, the time in docker containers on Mac can get out of sync with the system clock. This causes the HTTPS
   certs generated by the CM from being valid. See https://github.com/docker/for-mac/issues/17. Fix this by restarting Docker for Mac.
=======
*       In some cases, the time in docker containers on Mac can get out of sync with the system clock. This causes the HTTPS    
        certs generated by the CM from being valid. See https://github.com/docker/for-mac/issues/17. Fix by restarting Docker for Mac.

>>>>>>> Updated Readme
