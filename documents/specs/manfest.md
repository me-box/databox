### Manifest

Updated: 32rd oct 2018 databox version 0.5.1

Manifest general metadata:

- manifest-version: [Number] \(manifest version e.g 0.2.0)
- store-url: [URL] \(the app store this app is published on)
- name: [String] \(one unique word human readable name.)
- docker-image (Optional: docker image name  e.g my-cool-app (-amd64 or -amd64v8 will be added depending on the platform) defaults to Name from above)
- docker-registry (Optional: docker registry e.g myDockerRegistry defaults to datboxsystems)
- docker-image-tag (Optional: docker image tag e.g latest or v0.5.1 etc defaults to the running version of databox)- version: [String] \([semver](http://semver.org/) the version of the image to install e.g 0.3.0 or latest)
- databox-type: [String] \(top-level type field to distinguish apps from drivers)
- description: [string] \(text description)
- author: [[Person](https://docs.npmjs.com/files/package.json#people-fields-author-contributors)]
- license: [[License](https://docs.npmjs.com/files/package.json#license)]
- tags: [Array of strings]
- homepage: [String]
- repository: [[Repository](https://docs.npmjs.com/files/package.json#repository)]

Fields specific to App
- export-whitelist: [Array of [Export Destinations](#export-destination)]

Fields specific to driver
- provides: \(Array of [Datasource](#datasource) offered by this driver)
- external-whitelist: [Array of [external-whitelist](#external-whitelist)]  \(External hosts that need to be contacted by this driver)


### Datasource (app only)

An array of datasources to be accessed by an application.

Manifest Object with:

- type: [String] \(basis for compatibility test, like current data store / node type names)
- clientid: [String] used by the app to distinguish datasources of the same type (e.g. 'main-bulb')
- granularities: [Array of [Granularity](#granularity)]
- required: [Boolean]
- min: [Number] \(minimum required number of this sensor type, defaults to 1),
- max: [Number] \(maximum required number of this sensor type, defaults to 1, -1 for no upper limit)
- allow-notification-of-new-sources [Boolean] should the cm notify and grant permissions to the app when new data sources of this type are available

#### Granularity

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


### Export Destination (App only)

An JSON object formatted as follows.

```json
    {
        'url': SOME_HTTPS_URL,
        'description': "Human readable description"
    }
```

Here, the URL is an HTTPs URL to an external server that an app may export data to. This must be full URL that is matched exactly. Once approved by a user, an app can query the `\export` enpoint on the Databox export service (documented [here](https://github.com/me-box/databox-export-service#api)) to emit results to a remote host.


### External Service Whitelist (Driver only)

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
