App Developer Guide
===================

> NB: This document is a work in progress, and as it stands, mainly supplementary to the full Databox specs for describing the system from a different perspective.

Databox apps run from within [Docker](https://www.docker.com/) containers within the Databox environment. They interface with other Databox components through common, open standards based on RESTful HTTP APIs and JSON.

Getting Started
---------------

A bare bones NodeJS app is available [here](https://github.com/me-box/databox-app-template-node) that can be built upon. This contains a documented library that encapsulates and abstracts away all HTTP APIs. You can of course write an app in a different language and interface with these APIs directly.

As an app developer your app only ever needs to know about three types of internal Databox components: the _arbiter_, _stores_, and the _export service_. Stores contain the data your app processes, the arbiter gives you access to these stores, and the export service is used for emitting results to your remote server.

Another important thing to understand is that your App so not able to communicate directly over the local or wide area network. Apps are only permitted to export data from the databox through the _export service_. All data an app receives comes form a data store.


### The Arbiter ###

The arbiter lives at the host defined by the environment variable `DATABOX_ARBITER_ENDPOINT` (usually `tcp://arbiter:5555`). When the app is running in the Databox environment, the `arbiter` hostname will resolve to the correct container.

When your driver is launched by the Databox system, it is provided with a unique token through the docker secret  `/run/secrets/ARBITER_TOKEN`. When making any request to the arbiter, it is important that this token is included as a header with the name `x-api-key` (or through Basic Auth).


The arbiter API endpoints available to Databox apps are documented [here](https://github.com/me-box/databox-arbiter#container-facing). Apps request tokens over `/token` and may need to query this endpoint periodically as these tokens expire.

All arbiter requests are over HTTPS utilising a root CA certificate generated at runtime. See [The Databox Environment](/app-dev.md#the-databox-envronment) for more info.

### Stores ###

Once you know where the stores are that you have access to and what they provide by asking the arbiter, an app can request access to these stores. Tokens are provided at a per-endpoint basis. Stores map 1-1 to drivers, although a single data store can contain multiple data sources, e.g. your mobile phone is a source, while the store you access can contain both GPS and accelerometer data.

Your app can be permitted to query endpoint A in a store with a bearer token, but not endpoint B. Other restrictions of permissions, such as rate limiting or granularity, are similarly on a per-endpoint basis. The same token system applies to other non-data store APIs such as notifications, logging, and store catalogues.

All store requests are over HTTPS utilising a root CA certificate generated at runtime. See [The Databox Environment](/app-dev.md#the-databox-envronment) for more info.

### Export service ###
TODO

Publishing your App
-------------------

Before publishing an app, you crucially need two things.

1. A Dockerfile
2. A Databox Manifest

### The Dockerfile ###

The Dockerfile is for building the Docker image. Note that the sample Dockerfile has two lines relevant to the Databox ecosystem.

The first is the line:

    LABEL databox.type="app"

If this line is not in your Dockerfile, then your container will not be recognised as a Databox app.

The second line is:

    EXPOSE 8080

Databox apps can host web-based UIs for configuration or visualisation on port 8080, and these will be embedded within the Databox dashboard. Note that any libraries or resources need to be local and bundled within the app; [Content Security Policy](https://en.wikipedia.org/wiki/Content_Security_Policy) (CSP) will prevent you from making any requests to the outside world or loading any external resources from an app UI.

Note that this must be served over HTTPS. Public and private certificates are provided as environment variables. See [The Databox Environment](/app-dev.md#the-databox-envronment) for more info.

The rest of your Dockerfile can be set up following standard Docker workflow. Depending on what language or framework your app uses, you can base it off of one of the existing [official Docker images](https://hub.docker.com/explore/) (commonly Nodejs or Java), copy files from the working directory to the container root on building the Docker image, and run commands for compiling and running your program.

Once you have built an app (`docker build`)

### The Databox Manifest ###

Every app must have a `databox-manifest.json` file in its root directory. The manifest encodes the permissions and metatadata that describes you application. The manifest is translated in to a service level agreement (SLA) during the instillation of your application. This process lets the user agree to, or deny, your app access to their data sources. Once constructed the SLA encodes the rules by which your application will be constrained.

The fields are documented [here](https://github.com/me-box/documents/blob/master/specs/manifest_and_sla.md#manifest).

This manifest must be additionally uploaded separately to a databox-app-server (http://127.0.0.1:8181 for devlopment).

Your app will become available on your local databox for testing.

### The Databox Envronment ###

When your app container is installed on to a databox the databox-manifest is parsed and converted into a service level agreement(SLA). The SLA encodes your apps permissions on one particular databox. When your app is started a number of environment variables are set and docker secrets created in /run/secrets/. These are:

**HTTPS Certificates**

/run/secrets/DATABOX_ROOT_CA: This is the container managers certificate authority public key. All databox applications communicate over HTTPS and the container manager is responsible for generating the certificates for all components. Your app must add this to its chain of trust before making any requests. Each databox generates its own root cert at startup which is regenerated on each reboot.

/run/secrets/DATABOX_PEM: This is your apps HTTPS private and public key signed by the container managers certificate authority. These should be used to secure your apps REST API.

**DATABOX configuration**

DATABOX_LOCAL_NAME: Your app's hostname on this databox.

DATABOX_ARBITER_ENDPOINT: The endpoint where the arbiter can be reached to request new tokens for access to other Databox components.

DATABOX_LOGSTORE_ENDPOINT: The endpoint for the Databox logging service. Read-only access can be requested by an app to enable log parsing but this is only ever written to by datastores.

/run/secrets/ARBITER_TOKEN: Your arbiter token. This is used in all requests to the arbiter, for example when requesting tokens as a means of authentication.

DATABOX_STORE_ENDPOINT: If your app requests a datastore to write data into then one or more environment variables will be set containing their endpoints.

Most of the time you will not need to worry about these as they will be abstracted away in a library. For example, [node-databox](https://github.com/me-box/node-databox).

### Advanced ###

Certain apps may need to directly access store [Hypercat](http://www.hypercat.io/) catalogues. If granted permission, apps can query the arbiter's root catalogue which will specify where to access the resources you need among other metadata. An app can _walk_ the arbiter's root Hypercat catalogue. These catalogues can be nested, and the root catalogue will refer to other catalogues hosted by stores.
