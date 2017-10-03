# Databox
The Databox platform is an open-source personal networked device, augmented by cloud-hosted services, that collates, curates, and mediates access to an individual’s personal data by verified and audited third party applications and services. The Databox will form the heart of an individual’s personal data processing ecosystem, providing a platform for managing secure access to data and enabling authorised third parties to provide the owner with authenticated services, including services that may be accessed while roaming outside the home environment. Databox project is led by Dr Hamed Haddadi (Imperial College) in collaboration with Dr Richard Mortier (University of Cambridge) and Professors Derek McAuley, Tom Rodden, Chris Greenhalgh, and Andy Crabtree (University of Nottingham) and funded by EPSRC. See http://www.databoxproject.uk/ for more information.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine. For development and testing purposes, see Development section below.

### Prerequisites

1) Requires Docker. Read [here](https://docs.docker.com/engine/installation/) for docker installation.
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
### Development

To develop on the platform and core components run the data-box start script with 'dev' parameter. See below.

```
./databox-start dev
```

Unlike using the pre-build images, this will clone all the relevant source repositories locally, and build them into the
required Docker images. To try your component out, add your code into a
directory with a Databox manifest and `Dockerfile`, and then add a reference to
it in `docker-compose-dev-local-images.yaml`. Your image will then be built
alongside the platform. To install your app, upload the manifest to the local
app store on <http://127.0.0.1:8181> and it should then become visible in the
UI, ready for you to install.

#### Get Started with the Graphical SDK

The graphical SDK will allow you to quickly build and test simple databox apps. The current version of SDK run by default in `dev` mode. To start the sdk run:
```
./databox-start sdk
```        
The SDK web UI is available at http://127.0.0.1:8086

To stop the SDK run: 
```
./databox-stop sdk
```

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
* [app-light-graph](https://github.com/me-box/app-light-graph)
* [app-twitter-sentiment](https://github.com/me-box/app-twitter-sentiment)
* [app-os-monitor](https://github.com/me-box/app-os-monitor)
                
### Libraries for writing drivers and apps
* [lib-node-databox](https://github.com/me-box/node-databox): Databox nodejs api library for building databox apps and drivers.  Read more about nodejs [here](https://nodejs.org/en/).
* [lib-python-databox](https://github.com/me-box/lib-python-databox): Databox python api library for building databox apps and drivers. Read more about python [here](https://docs.python.org/3.4/library/index.html).
* [lib-go-databox](https://github.com/me-box/lib-go-databox): Databox go api library for building databox apps and drivers. Read more about go [here](https://golang.org/).
#### API and System specifications
Databox System Design document can be find [here](./documents/system_overview.md) and general API specifications are [here](./documents/api_specification.md).

### Running the tests

```
./databox-test 

```
For more details, have a look [here](./documents/testing.md).

## Contributing

The databox project welcomes contributions via pull requests see [CONTRIBUTING.md](./CONTRIBUTING.md) for more information. Good start is from having a look on  the current [issues](https://github.com/me-box/databox/issues) and [forking](https://github.com/me-box/databox#fork-destination-box) the databox repo and fixing bugs/issues and submitting a pull request. Read more on Fork and Pull [here](https://help.github.com/articles/fork-a-repo/).

## Versioning

This documentation is up-to-date till this [commit](https://github.com/me-box/databox/tree/a62ed323d98c0a6fd32f020eca9352f8da687c09). The master branches on all components points to the current release and are tagged in git using [semver](http://semver.org/).

## Authors

The list of [contributors](https://github.com/me-box/databox/contributors) who participated in this project.

## License
MIT Licence, See [here](./LICENSE).

## Known issues


### During development of  system components and custom drivers

*  While building the platform and core components you can sometimes get an error:
```
TLS certificates invalid
```
This is caused when Databox is started before docker has cleaned up the networks. 

This issue can be fixed if you run `./databox-start`

*  In some cases, the time in docker containers on Mac can get out of sync with the system clock. This causes the HTTPS 
   certs generated by the CM from being valid. See https://github.com/docker/for-mac/issues/17. Fix this by restarting Docker for Mac.

