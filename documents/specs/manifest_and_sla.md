# Manifest and SLA

Updated: 32rd oct 2018 databox version 0.5.1

Strategy: the SLA is a refinement of the Manifest, i.e. essentially the same file format but with extra information filled in, and sometimes irrelevant/sensitive parts elided.


## Overview of SLA Creation

The [core-ui](https://github.com/me-box/core-ui) will download the Manifest from the [app store driver](https://github.com/me-box/driver-app-store). It will take the user through the process of mapping local data  sources to those requested in the manifest.

The container-manager will then post the manifest and an array od seated data sources to the [container-manager](https://github.com/me-box/core-container-manager). The container-manager will process the manifest and data  source array into an SLA.

The SLA is then used to install the App or driver (download the application image if required) and start the  container. The container-manager grants the required permissions by calling on the /cm/grant-container-permissions endpoint of the [arbiter](https://github.com/me-box/core-arbiter). The container-manager also informs the [core-network](https://github.com/me-box/core-network) of the required network configuration via the /connect endpoint. The container-manager is also responsible for starting any required data stores. Finally, the SlA is stored in the container-manager core store for reinstalling Apps and drivers at restart.

### Manifest

Manifest general metadata:

- manifest-version: [Number]
- name: [String] \(one unique word)
 - docker-image (Optional: docker image name  e.g my-cool-app (-amd64 or -amd64v8 will be added depending on the platform) defaults to Name from above)
- docker-registry (Optional: docker registry e.g myDockerRegistry defaults to datboxsystems)
- docker-image-tag (Optional: docker image tag e.g latest or v0.5.1 etc defaults to the running version of databox)
- version: [String] \([semver](http://semver.org/))
- databox-type: [String] \(top-level type field to distinguish apps from drivers)
- description: [String] \(single line description)
- author: [[Person](https://docs.npmjs.com/files/package.json#people-fields-author-contributors)]
- license: [[License](https://docs.npmjs.com/files/package.json#license)]
- tags: [Array of strings]
- homepage: [String]
- repository: [[Repository](https://docs.npmjs.com/files/package.json#repository)]
- datasources: [Array of [Datasource](#datasource)]
- export-whitelist: [Array of [Export Destinations](#export-destination)]
- external-whitelist: [Array of [White listed hosts](#external-whitelist)]

Notes:

- what markup should be allowed/assumed/required for human-readable UI strings, e.g. [Manifest](#manifest) description

### Data source

An array of data sources to be accessed by an application.

Manifest Object with:

- type: [String] \(basis for compatibility test, like current data store / node type names)
- clientid: [String] used by the app to distinguish data sources of the same type (e.g. 'main-bulb')
- granularities: [Array of [Granularity](#granularity)]
- required: [Boolean]
- clientid [string] The Id used to identify this data source in the client code (from the manifest).
- hypercat [Object] The full hypercat description of the data source.
- min [int] the minimum number of this type to request from the user default 1
- max [int] the maximum number of this type to request from the user default 1
- allow-notification-of-new-sources [Boolean] should the cm notify and grant permissions to the app when new data sources of this type are available

Available in SLA to the app after install:

- type [string] the databox data source type
- name [string] data source name
- required [bool]
- clientid [string] the id provided by the app to assign this data source to
- granularities [array] not used yet
- hypercat [json/text] the full hypercat item provided by the driver for this data source
- allow-notification-of-new-sources

### White listed hosts (Drivers only)

An JSON object formatted as follows.

'''json
"external-whitelist": [
		{
			"urls": [
				"https://api.twitter.com/",
				"https://stream.twitter.com/1.1/",
				"https://userstream.twitter.com/1.1/",
				"https://sitestream.twitter.com/1.1/",
				"https://upload.twitter.com/1.1/"
			],
			"description": "Used by node package `twit` to access Twitter API"
		}
	],
'''

Allows the container-manager to grant access to external hosts for drivers.


### Export Destination (Apps only)

An JSON object formatted as follows.

```json
    {
        'url': SOME_HTTPS_URL,
        'description': "Human readable description"
    }
```

Here, the URL is an HTTPs URL to an external server that an app may export data to. This must be full URL that is matched exactly. Once approved by a user, an app can query the `\export` endpoint on the Databox export service (documented [here](https://github.com/me-box/databox-export-service#api)) to emit results to a remote host.

### Granularity

"Granularity" of allowed access to the data source.
May have different facets, but initially considering only time. See also HotNets 2016 submission.
The presumption is that at courser granularity the app is being provided with statistics of the underlying data. For time-series numerical data this would normally be minimum, maximum, average and count (of samples).

Object with:

For time-series data sources:

- maximum-sample-interval: [[duration](https://www.w3.org/TR/xmlschema-2/#duration)]

Needed in Manifest (only):

- required: [Boolean]

Plus in SLA, not present in Manifest:

- enabled: [Boolean] \(default false)
- minimum-sample-interval: [[duration](https://www.w3.org/TR/xmlschema-2/#duration)] \(minimum allowed)

Notes:

- We should probably propose some preferred sample intervals for consistency between apps/data sources, e.g. [duration](https://www.w3.org/TR/xmlschema-2/#duration) PT1S, PT1M, PT5M, PT1H, P1D, P7D, P1M, P3M, P1Y

## Permissions

The standard caveats will be (based on part on [arbiter spec](https://github.com/me-box/databox-arbiter)) as are listed [here](token-auth.md).
