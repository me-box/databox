# Databox
The Databox platform is an open-source personal networked device, augmented by cloud-hosted services, that collates, curates, and mediates access to an individual’s personal data by verified and audited third-party applications and services. The Databox will form the heart of an individual’s personal data processing ecosystem, providing a platform for managing secure access to data and enabling authorised third parties to provide the owner with authenticated services, including services that may be accessed while roaming outside the home environment. Databox project is led by Dr Hamed Haddadi (Imperial College) in collaboration with Dr Richard Mortier (University of Cambridge) and Professors Derek McAuley, Tom Rodden, Chris Greenhalgh, and Andy Crabtree (University of Nottingham) and funded by EPSRC. 

## Getting Started

These instructions will get a copy of the Databox up and running on your local machine. For development and testing purposes, see Development section below.

### Prerequisites

1) Requires Docker. Read [here](https://docs.docker.com/engine/installation/) for docker installation.

> Note: currently supported platforms are Linux and MacOS. Running on other platforms is possible using a virtual machine running Linux with bridge mode networking. Also note that more than one CPU core must be allocated to the VM.
> Note: requires ports 80 and 443 are not being used by other processes such as local web servers.

### Get started
Make sure Docker is installed and running before starting Databox.  Run the following to get your databox up and
running.

```
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock --network host -t databoxsystems/databox:0.5.2 /databox start -sslHostName $(hostname)
```

> Note: arm64v8 Platforms must be running a 64 bit version of linux [Alpine 3.8 aarch64](https://alpinelinux.org/downloads/) or [HypriotOS/arm64](https://github.com/DieterReuter/image-builder-rpi64/releases)

The above starts Databox using pre-build images published on [Docker hub](<https://hub.docker.com/r/databoxsystems>) and runs Databox on your local machine.

Once it's started, point a web browser at <http://127.0.0.1> and follow the instructions to configure your HTTPS certificates to access Databox UI securely (using a web browser <https://127.0.0.1>, or the iOS and Android app).

You should be presented with a log-in box. The default username is *docker* and this should be filled in for you. The password is created during the container set-up process so check the console where the container was started from and look for a line (amongst the 50 or so lines output) containing the generated password such as this:
```
container-manager        : [INFO]2020/11/12 14:00:21 Password=LH9zb4UDJ3ctkaHC1sbuwxBWWlJrZzh3
```


> Note: Using the databox iOS and Android apps with MacOS may require you to modify your firewall to enable external access to port 80 and 443.

To stop databox and clean up,
```
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -t databoxsystems/databox:0.5.2 /databox stop
```

# Development

## Get Started with the Graphical SDK

The graphical SDK will allow you to quickly build and test simple databox apps. To start the SDK run:
```
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock --network host -t databoxsystems/databox:0.5.2 /databox sdk -start
```
The SDK web UI is available at http://127.0.0.1:8086

To stop the SDK run:
```
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock --network host -t databoxsystems/databox:0.5.2 /databox sdk -stop
```

## Developing apps and drivers without the SDK

It is possible to develop Databox apps and driver without the SDK. Currently, [Python](https://github.com/me-box/lib-python-databox), [Golang](https://github.com/me-box/lib-go-databox) and [NodeJs](https://github.com/me-box/lib-node-databox) all have support libraries. Building outside the SDK allows you to make smaller more efficient containers and use more third-party libraries.

To get started all you need is a Dockerfile and a databox-manifest.json examples can be found in the libraries '/samples' directories. To make your app available to install locally on your databox you will need to upload the app-store driver and use `docker build -t [your-app-name] .`. Once the manifest is uploaded and the image has built then you should be up to install the app on your local Databox.

A good place to get started is the [Databox quickstart repo](https://github.com/me-box/databox-quickstart/) which has all you need to develop apps and drivers and a small tutorial.

> Note: Images must be post fixed with -amd64 or -arm64v8 respectively.

> Note: The image must have the version tag that matches your running version of databox :0.5.2 or :latest for example.

If you would like to modify one of the currently available actual drivers you can do so by doing the following:
```
git clone https://github.com/me-box/databox.git
cd databox
./databox-install-component driver-os-monitor
```
This will download and build the code on your machine and upload the Databox manifest to your local app store.

You can also use this with your repositories and forks using:
```
./databox-install-component [GITHUB_USERNAME]/[GITHUB_REPONAME]
```

## Setting up a full development clone of databox

To build the full platform form source clone this repo:

```
git clone https://github.com/me-box/databox.git
cd databox
```

To build the full platform for both amd64 and arm64v8:

> Note: Multi arch builds only work on Docker for Mac experimental

> Note: enable docker cli experimental features "experimental": "enabled" ~/.docker/config.json

```
make all
```

If your using docker on linux then you can build for a your architecture an using:

```
make all ARCH=[amd64 or arm64v8]
```

This will only build the specified architecture make sure it matches your cpu architecture. To run from your build artefacts

```
make start ARCH=[amd64 or arm64v8]
```

It is advised to also set **DEFAULT_REG=** to a registry that is not databoxsystems so you cam more easily identify and manage your build artefacts

## Developing core components

To develop on the platform and core components the databox start command allows you to replace the databoxsystems core images with your own. For example to replace the arbiter.

```
docker build -t databoxdev/arbiter:0.5.2 .                              # in your Arbiter source directory build your updated arbiter image
make start OPTS=--release 0.5.2 --arbiter databoxdev/arbiter            # From the databox directory on the same host start databox using the new code
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

## Running the tests

```
make test
```
For more details, have a look [here](./TESTING.md).

## Contributing

The databox project welcomes contributions via pull requests see [CONTRIBUTING.md](./CONTRIBUTING.md) for more information. A good start is to look at the current [issues](https://github.com/me-box/databox/issues) and [forking](https://github.com/me-box/databox#fork-destination-box) the databox repo and fixing bugs/issues and submitting a pull request. Read more on Fork and Pull [here](https://help.github.com/articles/fork-a-repo/).


## Published work
--------------

*   Fan Mo, Ali Shahin Shamsabadi, Kleomenis Katevas, Soteris Demetriou, Ilias Leontiadis, Andrea Cavallaro, Hamed Haddadi, “DarkneTZ: Towards Model Privacy at the Edge using Trusted Execution Environments”, 18th ACM International Conference on Mobile Systems, Applications, and Services ( [MobiSys 2020](https://www.sigmobile.org/mobisys/2020/) ) June 2020, Toronto, Canada. (Paper available on [ArXiv](https://arxiv.org/abs/2004.05703) , [Code](https://github.com/mofanv/darknetz) )

*   Ali Shahin Shamsabadi, Adria Gascon, Hamed Haddadi and Andrea Cavallaro, “PrivEdge: From Local to Distributed Private Training and Prediction”, IEEE Transactions on Information Forensics & Security, 2020, DOI:10.1109/TIFS.2020.2988132. (Paper available on [ArXiv](https://arxiv.org/abs/2004.05574) , [Code](https://github.com/smartcameras/PrivEdge) )

*   Yuchen Zhao, Hamed Haddadi, Severin Skillman, Shirin Enshaeifar, Payam Barnaghi, “Privacy-preserving Activity and Health Monitoring on Databox”, the 3rd International Workshop on Edge Systems, Analytics and Networking ( [EdgeSys 2020](https://edge-sys.github.io/2020/index.html) ), in conjunction with ACM EuroSys 2020, April 2020, Heraklion, Greece.

*   Anna Maria Mandalari, Roman Kolcun, Hamed Haddadi, Daniel J. Dubois, David Choffnes, “Towards Automatic Identification and Blocking of Non-Critical IoT Traffic Destinations”, Workshop on Technology and Consumer Protection ( [ConPro ’20](https://www.ieee-security.org/TC/SPW2020/ConPro/) ), Co-located with the 41th IEEE Symposium on Security and Privacy, May 21, 2020, San Francisco, CA. (Paper available on ArXiv )

*   Seyed Ali Osia, Ali Shahin Shamsabadi, Sina Sajadmanesh, Ali Taheri, Kleomenis Katevas, Hamid R. Rabiee, Nicholas D. Lane, Hamed Haddadi, “A Hybrid Deep Learning Architecture for Privacy-Preserving Mobile Analytics”, IEEE Internet of Things Journal, 2020. ( [paper](https://arxiv.org/abs/1703.02952) , [Code](https://github.com/aliosia/DeepPrivInf2017) )

*   Mohammad Malekzadeh, Richard G. Clegg, Andrea Cavallaro, Hamed Haddadi, “Privacy and Utility Preserving Sensor-Data Transformations”, Pervasive and Mobile Computing (PMC), 2020. (Paper Available on [ArXiv](https://arxiv.org/abs/1911.05996) ).

*   Poonam Yadav, Vadim Safronov, and Richard Mortier. 2019. Enforcing accountability in Smart built-in IoT environment using MUD. In _Proceedings of the 6th ACM International Conference on Systems for Energy-Efficient Buildings, Cities, and Transportation_ ( _BuildSys ’19_ ). Association for Computing Machinery, New York, NY, USA, 368–369. DOI:https://doi.org/10.1145/3360322.3361004

*   Ranya Aloufi, Hamed Haddadi, David Boyle, “Emotionless: Privacy-Preserving Speech Analysis for Voice Assistants”, in [Privacy Preserving Machine Learning](https://ppml-workshop.github.io/ppml/) , ACM CCS 2019 Workshop, November 2019, London, UK. (Available on [ArXiv](https://arxiv.org/abs/1908.03632) , Articles on [Vice](https://www.vice.com/en_us/article/ne8bxd/ai-that-hides-your-emotions-from-other-ai-alexa-siri-google) , [Medium](https://medium.com/syncedreview/how-to-hide-your-feelings-from-ai-voice-assistants-2db516d9e2d7) )

*   Ranya Aloufi, Hamed Haddadi, David Boyle, “Emotion Filtering at the Edge”, 1st Workshop on Machine Learning on Edge in Sensor Systems (Sensys-ML), In conjunction with ACM SenSys 2019, November 10, 2019, New York, NY, USA.

*   Jingjing Ren, Daniel J. Dubois, David Choffnes, Anna Maria Mandalari, Roman Kolcun, Hamed Haddadi, “Information Exposure From Consumer IoT Devices: A Multidimensional, Network-Informed Measurement Approach”, in ACM Internet Measurement Conference 2019, ( [IMC 2019](https://conferences.sigcomm.org/imc/2019/) ), October, 2019, Amsterdam, Netherlands.

*   Tom Lodge & Andy Crabtree (2019) Privacy Engineering for Domestic IoT: Enabling Due Diligence, Sensors vol.19 (20), article 4380. [https://www.mdpi.com/1424-8220/19/20/4380/htm](https://www.mdpi.com/1424-8220/19/20/4380/htm) 

*   Neelima Sailaja, James Colley, Andy Crabtree, Adrian Gradinar, Paul Coulton, Ian Forrester, Lianne Kerlin and Phil Stenton (2019) The Living Room of the Future, Proceedings of the ACM International Conference on Interactive Experiences for Television and Online Video, pp. 95-107, ACM Press. [https://nottingham-repository.worktribe.com/output/2329205](https://nottingham-repository.worktribe.com/output/2329205)

*   Seyed Ali Osia, Ali Taheri, Ali Shahin Shamsabadi, Kleomenis Katevas, Hamed Haddadi, Hamid R. Rabiee, “Deep Private-Feature Extraction”, IEEE Transactions on Knowledge and Data Engineering, 2019, DOI: 10.1109/TKDE.2018.2878698. (Available on [ArXiv](https://arxiv.org/abs/1802.03151) , [Code](https://github.com/aliosia/DPFE) )

*   Poonam Yadav, Qi Li, Anthony Brown, Richard Mortier, “Network Service Dependencies in Commodity Internet-of-Things Devices”, ACM/IEEE International Conference on Internet of Things Design and Implementation ( [IoTDI 2019](http://conferences.computer.org/iotDI/2019/) ), Available on [ArXiv](https://arxiv.org/abs/1902.09647)

*   Seyed Ali Osia, Ali Taheri, Ali Shahin Shamsabadi, Kleomenis Katevas, Hamed Haddadi, Hamid R. Rabiee, “Deep Private-Feature Extraction”, IEEE Transactions on Knowledge and Data Engineering, 2019. (Available on [ArXiv](https://arxiv.org/abs/1802.03151) , [Code](https://github.com/aliosia/DPFE) )

*   Mohammad Malekzadeh, Richard G. Clegg, Andrea Cavallaro, Hamed Haddadi, “Mobile Sensor Data Anonymization”, ACM/IEEE International Conference on Internet of Things Design and Implementation ( [IoTDI 2019](http://conferences.computer.org/iotDI/2019/) ), Available on [ArXiv](https://arxiv.org/abs/1810.11546) , [Code and Dataset](https://github.com/mmalekzadeh/motion-sense)

*   John Moore, Andres Arcia-Moret, Poonam Yadav, Richard Mortier, Anthony Brown, Derek McAuley, Andy Crabtree, Chris Greenhalgh, Hamed Haddadi, Yousef Amar, “Zest: REST over ZeroMQ”, The Third Workshop on Security, Privacy and Trust in the Internet of Things, In conjunction with IEEE PERCOM 2019, March 11 -15, 2019, Kyoto, Japan. ( [Paper](https://haddadi.github.io/papers/zest2019.pdf) )

*   Poonam Yadav, John Moore, Qi Li, Richard Mortier, Anthony Brown, Andy Crabtree, Chris Greenhalgh, Derek McAuley, Yousef Amar, Ali Shahin Shamsabadi, Hamed Haddadi, “Providing Occupancy as a Service with Databox”, in The 1st ACM International Workshop on Smart Cities and Fog Computing (CitiFog’18), November 4, 2018, Shenzhen, China.  https:// doi.org/ 10.1145/ 3277893.3277894  ( [Paper](https://haddadi.github.io/papers/citifog18-final7.pdf) )

*   Urquhart, L., Lodge, T. and Crabtree, A. (2018) “Demonstrably doing accountability in the Internet of Things”, International Journal of Law and Technology, vol. 27 (1), pp. 1-27.

*   Lodge, T., Crabtree, A. and Brown, A. (2018) “IoT app development: supporting data protection by design and default”, Proceedings of UbiComp ‘18, pp. 901-910, Singapore, ACM Press. [https://nottingham-repository.worktribe.com/output/1234975/iot-app-development-supporting-data-protection-by-design-and-default](https://nottingham-repository.worktribe.com/output/1234975/iot-app-development-supporting-data-protection-by-design-and-default)

*   Ali Shahin Shamsabadi, Hamed Haddadi, Andrea Cavallaro, “Distributed One-class Learning”,  [IEEE International Conference on Image Processing](https://2018.ieeeicip.org/) , October 7-10, 2018, Athens, Greece. Available on  [ArXiv](https://arxiv.org/abs/1802.03583)

*   Mohammad Malekzadeh, Richard G. Clegg, Andrea Cavallaro, Hamed Haddadi, “Protecting Sensory Data against Sensitive Inferences”, in proceedings of the [1st Workshop on Privacy by Design in Distributed Systems](http://www.gsd.inesc-id.pt/~p2ds/) , co-located with [Eurosys 2018](http://eurosys2018.org/) , Porto, Portugal, April 2018. (Available on [ArXiv](https://arxiv.org/abs/1802.07802) , February 2018. ( [Dataset](https://github.com/mmalekzadeh/motion-sense) ))

*   Yousef Amar, Hamed Haddadi, Richard Mortier, “An Information-Theoretic Approach to Time-Series Data Privacy”, in proceedings of the [1st Workshop on Privacy by Design in Distributed Systems](http://www.gsd.inesc-id.pt/~p2ds/) , co-located with [Eurosys 2018](http://eurosys2018.org/) , Porto, Portugal, April 2018.

*   Seyed Ali Osia, Ali Shahin Shamsabadi, Ali Taheri, Hamid R. Rabiee, Hamed Haddadi, “Private and Scalable Personal Data Analytics using Hybrid Edge-Cloud Deep Learning”, [IEEE Computer Magazine](https://publications.computer.org/computer-magazine/) Special Issue on Mobile and Embedded Deep Learning, April 2018. ( [Paper](https://haddadi.github.io/papers/ieeeComputer2018hybrid.pdf) )

*   Hamed Haddadi, Vassilis Christophides, Renata Teixeira, Kenjiro Cho, Shigeya Suzuki and Adrian Perrig, “SIOTOME: An Edge-ISP Collaborative Architecture for IoT Security”, in proceedings of the 1st International Workshop on Security and Privacy for the Internet-of-Things ( [IoTSec](https://synercys.github.io/iotsec/) ), co-located with the 3rd ACM/IEEE International Conference on Internet of Things Design & Implementation ( [IoTDI](http://conferences.computer.org/IoTDI/) ), April 2018, Orlando, Florida, USA. ( [Paper](https://haddadi.github.io/papers/SIOTOME_2018iot.pdf) , [Talk](https://haddadi.github.io/talks/IotDI18_SIOTOME.pdf) )

*   Sandra Servia-Rodriguez, Liang Wang, Jianxin R. Zhao, Richard Mortier, Hamed Haddadi, “Personal Model Training under Privacy Constraints”, The 3rd [ACM/IEEE International Conference on Internet-of-Things Design and Implementation](http://conferences.computer.org/IoTDI/) , April 2018, Orlando, Florida. ( [paper](https://arxiv.org/abs/1703.00380) , [Talk](https://haddadi.github.io/talks/IotDI18_PrivModels.pdf) )

*   Mohammad Malekzadeh, Richard G. Clegg, Hamed Haddadi, “Replacement AutoEncoder: A Privacy-Preserving Algorithm for Sensory Data Analysis”, The 3rd [ACM/IEEE International Conference on Internet-of-Things Design and Implementation](http://conferences.computer.org/IoTDI/) , April 2018, Orlando, Florida. ( [paper](https://haddadi.github.io/papers/RAE2018IoTDI.pdf) , [Code](https://github.com/mmalekzadeh/replacement-autoencoder) , [Talk](https://haddadi.github.io/talks/IotDI18_RAE.pdf) )

*   Andy Crabtree, Tom Lodge, James Colley, Chris Greenhalgh, Kevin Glover, Hamed Haddadi, Yousef Amar, Richard Mortier, Qi Li, John Moore, Liang Wang, Poonam Yadav, Jianxin Zhao, Anthony Brown, Lachlan Urquhart, Derek McAuley, “ [Building Accountability into the Internet of Things: The IoT Databox Model](https://link.springer.com/article/10.1007%2Fs40860-018-0054-5) ”, Journal of Reliable Intelligent Environments, Springer, 2018, DOI 10.1007/s40860-018-0054-5. ( [paper](https://haddadi.github.io/papers/JREI_IoTDatabox2018.pdf) )

*   Alan Chamberlain, Andy Crabtree, Hamed Haddadi, Richard Mortier, “ [Special theme on privacy and the Internet of things](https://link.springer.com/article/10.1007%2Fs00779-017-1066-5) ”, Personal and Ubiquitous Computing, August 2017 ( [DOI](https://doi.org/10.1007/s0077) ).

*   Peter Tolmie and Andy Crabtree (2017) “The practical politics of sharing”, Personal and Ubiquitous Computing, Online First.
DOI: 10.1007/s00779-017-1071-8
Open access: [https://link.springer.com/article/10.1007/s00779-017-1071-8](https://link.springer.com/article/10.1007/s00779-017-1071-8)
    
*   Andy Crabtree, Peter Tolmie and Will Knight, W. (2017) “Repacking privacy for a networked world”, Computer Supported Cooperative Work: The Journal of Collaborative Computing and Work Practices, vol. 26 (1), pp. 453-488.
DOI: 10.1007/s10606-017-9276-y
Open access: [https://link.springer.com/article/10.1007/s10606-017-9276-y](https://link.springer.com/article/10.1007/s10606-017-9276-y)
    
*   Yousef Amar, Hamed Haddadi and Richard Mortier (2017) “ Route-based authorization and discovery for personal data” (Poster),  Proceedings of the 12 th EuroSys Conference, April 23-26, Belgrade, ACM.
Open access: [https://eurodw17.kaust.edu.sa/abstracts/eurodw17-final3.pdf](https://eurodw17.kaust.edu.sa/abstracts/eurodw17-final3.pdf)
    
*   Jianxin Zhao, Richard Mortier, Hamed Haddadi and Jon Crowcroft (2017) “Towards Security in Distributed Home System”  (Poster), Proceedings of the 12 th EuroSys Conference (Poster),  April 23-26,  Belgrade, ACM.
Open access: [https://eurodw17.kaust.edu.sa/abstracts/eurodw17-final9.pdf](https://eurodw17.kaust.edu.sa/abstracts/eurodw17-final9.pdf)
    
*   Mohammad Malekzadeh, Hamed Haddadi,   [Towards Privacy-Preserving IoT Data Publishing ](https://eurodw17.kaust.edu.sa/abstracts/eurodw17-final15.pdf) (Poster), Proceedings of the 12 th EuroSys Conference (Poster),  April 23-26,  Belgrade, ACM.

*   Andy Crabtree, Tom Lodge, James Colley, Chris Greenghalgh and Richard Mortier (2017) “Accountable IoT? Outline of the Databox model”, International Symposium on a World of Wireless, Mobile, and Multimedia Networks, pp. 1-6, Macau, IEEE
**DOI:** 10.1109/WoWMoM.2017.7974335
Open access: [https://eprints.nottingham.ac.uk/42233/1/IoT\_SoS.pdf](https://eprints.nottingham.ac.uk/42233/1/IoT_SoS.pdf)
    
*   Richard Mortier, Jianxin Zhao, Jon Crowcroft, Liang Wang, Qi Li, Hamed Haddadi, Yousef Amar, Andy Crabtree, James Colley, Tom Lodge, Tosh Brown, Derek McAuley, Chris Greenhalgh, “Personal Data Management with the Databox: What’s Inside the Box?”, ACM CoNEXT Cloud-Assisted Networking workshop ( [CAN 2016](http://conferences2.sigcomm.org/co-next/2016/#%21/canworkshop) ), December 12, 2016, Irvine, California. ( [paper](http://www.eecs.qmul.ac.uk/%7Ehamed/papers/CAN2016Databox.pdf) )

*   Andy Crabtree, Tom Lodge, James Colley, Chris Greenhalgh, Richard Mortier, Hamed Haddadi “ [Enabling the New Economic Actor: Data Protection, the Digital Economy, and the Databox](http://link.springer.com/article/10.1007/s00779-016-0939-3) “, [Springer Personal and Ubiquitous Computing (PUC)](http://www.springer.com/computer/hci/journal/779) , 2016. ( [paper](http://www.eecs.qmul.ac.uk/%7Ehamed/papers/databox2016.pdf) )

*   Charith Perera, Susan Wakenshaw, Tim Baarslag, Hamed Haddadi, Arosha Bandara, Richard Mortier, Andy Crabtree, Irene Ng, Derek McAuley and Jon Crowcroft (2016) “Valorising the IoT Databox: creating value for everyone”, Transactions on Emerging Technologies, vol. 28 (1), article 38.  DOI: 10.1002/ett.3125 Open access: [http://onlinelibrary.wiley.com/doi/10.1002/ett.3125/full](http://onlinelibrary.wiley.com/doi/10.1002/ett.3125/full)
    
*   Richard Mortier, Hamed Haddadi, Tristan Henderson, Derek McAuley, Jon Crowcroft, Andy Crabtree, “ [Human-Data Interaction](https://www.interaction-design.org/literature/book/the-encyclopedia-of-human-computer-interaction-2nd-ed/human-data-interaction) “,  [Encyclopedia of Human Computer Interaction, 2nd Ed](https://www.interaction-design.org/literature/book/the-encyclopedia-of-human-computer-interaction-2nd-ed) , October 2016. ( [paper](http://www.eecs.qmul.ac.uk/%7Ehamed/papers/Human-Data-Interaction.pdf) )

*   Andy Crabtree, Tom Lodge, James Colley, Chris Greenhalgh, Richard Mortier and Hamed Haddadi (2016) “Enabling the new economic actor: data protection, the digital economy, and the Databox”, Personal and Ubiquitous Computing, vol. 20 (6), pp. 947-957.  DOI: 10.1007/s00779-016-0939-3
Open access: [https://link.springer.com/article/10.1007/s00779-016-0939-3](https://link.springer.com/article/10.1007/s00779-016-0939-3)
    
*   Yousef Amar, Hamed Haddadi, Richard Mortier, “Privacy-Aware Infrastructure for Managing Personal Data”, Demo and extended abstract,   [ACM SIGCOMM 2016](http://conferences.sigcomm.org/sigcomm/2016/) , August 2016, Florianopolis, Brazil. ( [abstract](http://www.databoxproject.uk/wp-content/uploads/2016/03/sigcomm16posters-paper50.pdf) , poster)

*   Hamed Haddadi, Heidi Howard, Amir Chaudhry, Jon Crowcroft, Anil Madhavapeddy, Derek McAuley, Richard Mortier, “Personal Data: Thinking Inside the Box”, The 5th decennial Aarhus conference ( [Aarhus 2015](http://aarhus2015.org/) ), August 2015, available on [arXiv](http://arxiv.org/abs/1501.04737) \[ [paper](http://www.eecs.qmul.ac.uk/%7Ehamed/papers/aarhus15-camera.pdf) , [MIT Technology Review](http://www.technologyreview.com/view/534526/how-a-box-could-solve-the-personal-data-conundrum/) , [Guardian](http://www.theguardian.com/technology/2015/feb/01/control-personal-data-databox-end-user-agreement) \]

## Working documents
-----------------

*   Andy Crabtree, Tom Lodge, James Colley, Chris Greenhalgh and Richard Mortier (2016) “Building accountability into the Internet of Things”, Social Science Research Network,  DOI 10.13140/RG.2.2.27512.44803        Open access:  [https://www.researchgate.net/publication/311456200\_Building\_Accountability\_into\_the\_Internet\_of\_Things?channel=doi&linkId=5847e61408aeda696825a79f&showFulltext=true](https://www.researchgate.net/publication/311456200_Building_Accountability_into_the_Internet_of_Things?channel=doi&linkId=5847e61408aeda696825a79f&showFulltext=true)

*   Andy Crabtree and Richard Mortier (2016) “Personal data, privacy and the Internet of Things: the shifting locus of agency and control”, Social Science Research Network,  DOI 10.13140/RG.2.2.34496.12809             Open access:  [https://www.researchgate.net/publication/311311186\_Personal\_Data\_Privacy\_and\_the\_Internet\_of\_Things\_The\_Shifting\_Locus\_of\_Agency\_and\_Control?channel=doi&linkId=584162dc08aeda6968137200&showFulltext=true](https://www.researchgate.net/publication/311311186_Personal_Data_Privacy_and_the_Internet_of_Things_The_Shifting_Locus_of_Agency_and_Control?channel=doi&linkId=584162dc08aeda6968137200&showFulltext=true)

## Public Engagement
-----------------

*   “ [The Living Room of the Future](https://www.bbc.co.uk/rd/projects/living-room-of-the-future) at the V&A Museum”, part of the  [London Design Festival](https://www.londondesignfestival.com/) , September 2019.

*   Market engagement in the Databox project,  [Report](http://www.horizon.ac.uk/wp-content/uploads/2017/01/Market-engagement-in-the-Databox-project.pdf) commissioned by: Horizon Digital Research Institute

*   “ [Living Room of the Future](https://www.britishcouncil.mk/the-living-room-of-the-future) “, British Council and the Foundation for Art and Creative Technology (FACT), February 2018, Macedonia.  [https://youtu.be/yneprnGCRm0](https://youtu.be/yneprnGCRm0)

*   [Mozilla Festival 2017 Hackathon](https://www.eventbrite.com/e/databox-hackday-at-mozfest-2017-tickets-37382940381) , October 2017

*   BT Innovation Showcase, “Smart World”,  Adastral Park,  June 2017  [http://connect2.globalservices.bt.com/innovationweek2017](http://connect2.globalservices.bt.com/innovationweek2017)  
    
*   UK / Japan “Socio-Cyber Physical Systems Workshop”, Japanese Embassy, Toyko, Foreign and Commonwealth Office, September 2017.
    
*   “ [Databox: re-balancing power](https://pdtn.org/databox-personal-networked-device/) “, Personal Data & Trust Network 2016.

*   Science Fair, Mozilla Festival, October 2016     
    [https://app.mozillafestival.org/#\_session-950](https://app.mozillafestival.org/#_session-950)
    
*   Databox: Hack an App, Mozilla Festival, October 2016    
    [https://app.mozillafestival.org/#\_session-172](https://app.mozillafestival.org/#_session-172)  / [https://app.mozillafestival.org/#\_session-1172](https://app.mozillafestival.org/#_session-1172)  / [https://app.mozillafestival.org/#\_session-1173](https://app.mozillafestival.org/#_session-1173)
    
*   The Kitchen Demo Databox in collaboration with BBC R&D, Mozilla Festival, October 2016,  [https://app.mozillafestival.org/#\_session-171](https://app.mozillafestival.org/#_session-171)

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
