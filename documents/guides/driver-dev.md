Driver Developer Guide
======================

> NB: This document is a work in progress, and as it stands, mainly supplementary to the full Databox specs for describing the system from a different perspective.

Databox dirvers run from within [Docker](https://www.docker.com/) containers within the Databox environment. They interface with other Databox components through common, open standards based on RESTful HTTP APIs and JSON.

Getting Started
---------------

A bare bones NodeJS driver is available [here](https://github.com/me-box/databox-driver-template-node) that can be built upon. This contains a documented library that encapsulates and abstracts away all HTTP APIs. You can of course write an app in a different language and interface with these APIs directly.

As driver developer your app only ever needs to know about two types of internal Databox components: the _arbiter_ and _stores_. Stores contain the data your app processes and the arbiter gives you access to these stores.

### The Arbiter ###

The arbiter lives at the host defined by the environment variable `DATABOX_ARBITER_ENDPOINT` (usually `tcp://arbiter:5555`). When the driver is running in the Databox environment, the `arbiter` hostname will resolve to the correct container.

When your driver is launched by the Databox system, it is provided with a unique token through the docker secret /run/secrets/ARBITER_TOKEN. When making any request to the arbiter, it is important that this token is included as a header with the name x-api-key (or through Basic Auth).

The arbiter API endpoints available to Databox apps are documented [here](https://github.com/me-box/databox-arbiter#container-facing). Driver request tokens over `/token` and may need to query this endpoint periodically as these tokens expire.

All arbiter requests are over HTTPS utilising a root CA certificate generated at runtime. See [The Databox Environment](/app-dev.md#the-databox-envronment) for more info.

### Stores ###

Every driver is launched alongside one or more stores, the URLs of which are passed to the driver as environment variables. A driver can request access to these stores with arbiter tokens. Tokens are provided at a per-endpoint basis. Stores map 1-1 to data sources, although a single data store can contain multiple types of data, e.g. your mobile phone is a source, while the store you access can contain both GPS and accelerometer data.

Your app can be permitted to query endpoint A in a store with a bearer token, but not endpoint B. Other restrictions of permissions, such as rate limiting or granularity, are similarly on a per-endpoint basis. The same token system applies to other non-data store APIs such as notifications, logging, and store catalogues.

Drivers can also populate a store's Hypercat catalogue to make the datasources they write to stores discoverable, by POSTing to `/cat` as per [Hypercat specs](https://shop.bsigroup.com/upload/276605/PAS212-corr.pdf).

All store requests are over HTTPS utilising a root CA certificate generated at runtime. See [The Databox Environment](/app-dev.md#the-databox-envronment) for more info.

### The Databox Manifest ###

Every driver must have a `databox-manifest.json` file in its root directory. The manifest encodes the permissions and metatadata that describes you driver.  The fields are documented [here](https://github.com/me-box/documents/blob/master/specs/manifest_and_sla.md#manifest).

This manifest must be additionally uploaded separately to a databox-app-server.

Your driver will become available on the store after it has been reviewed by store moderators.

### The Databox Envronment ###

When your driver container is installed on to a databox the databox-manifest is parsed and converted into a service level agreement(SLA). The SLA encodes your apps permissions on one particular databox. When your app is started a number of environment variables are set. These are:

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
