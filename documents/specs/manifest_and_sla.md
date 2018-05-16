# Manifest and SLA

2016-07-21, based on initial discussion at Nottingham with Chris, Tom, Tosh, Kevin and James.

Strategy: the SLA is a refinement of the Manifest, i.e. essentially the same file format but with extra information filled in, and sometimes irrelevant/sensitive parts elided.


## Overview of SLA Creation 

The [container manager](https://github.com/me-box/databox-container-manager) UI will download the Manifest from the [databox app server](https://github.com/me-box/databox-app-server). It will take the user through the process of selecting packages to enable (and marking these), selecting (abstraint) datasources to enable, and mapping these to specific datasources. 

The container manager will then push the completed SLA to the [arbiter](https://github.com/me-box/databox-arbiter). This will be via a new parameter, 'sla', to [`/update`](https://github.com/me-box/databox-arbiter#update).

The container manager can then (download the application image if required and) start the app container.

The app's first action should normally be to contact the [arbiter](https://github.com/me-box/databox-arbiter) and get its SLA. Logically this should be a new version of the [`/register`](https://github.com/me-box/databox-arbiter#register) call, returning a JSON-encoded object with keys `sla` (the SLA) and `secret` (the current return value - base64-encoded secret for verifying container macaroons)

## Types


### Manifest

Manifest general metadata, following [databox-app-server /app/list](https://github.com/me-box/databox-app-server#applist):

- manifest-version: [Number]
- name: [String] \(one unique word)
- version: [String] \([semver](http://semver.org/))
- databox-type: [String] \(top-level type field to distinguish apps from drivers)
- description: [String] \(single line description)
- author: [[Person](https://docs.npmjs.com/files/package.json#people-fields-author-contributors)]
- license: [[License](https://docs.npmjs.com/files/package.json#license)]
- tags: [Array of strings]
- homepage: [String]
- repository: [[Repository](https://docs.npmjs.com/files/package.json#repository)]

- packages: [Array of [Package](#package)]
- allowed-combinations: [Array of [package-id, package-id]] indicating pair-wise combinations of packages that can be enabled at the same time.

- datasources: [Array of [Datasource](#datasource)]
- export-whitelist: [Array of [Export Destinations](#export-destination)]

Notes:

- allowed-combinations are enforced at Manifest -> SLA conversion and do not need to be checked later.
- what markup should be allowed/assumed/required for human-readable UI strings, e.g. [Manifest](#manifest) description, [Package](#package) purpose, risks, benefits?
- At some point it should allow different copies of the same app to be run.

### Package

A selectable 'package' of functionality within an app. E.g. see [SLA v2](https://github.com/me-box/docs/blob/master/prototypes/ui/sla-v2.docx): 'basic' vs 'standard' vs 'enhanced' operation, each with different datasource requirements, risks and benefits.
 
Based on the initial [node RED author](https://github.com/me-box/iot.red/blob/09795e81bbbe3be4235f58e99e6ca0154f727152/red-server/routes/github.js), with 'driver-permissions' factored out to the top level.

Object with:

- id: [Integer(Tom ?)] \(unique within application)
- name: [String]
- purpose: [String]
- required: [Boolean], i.e. package is compulsory
- risks: [String]
- benefits: [String]

- datasources: [Array of [Datasource](#datasource) ids]

Plus in SLA, not present in Manifest:

- enabled: [Boolean] \(default false)


### Datasource

An array of datasources to be accessed by an application.

Manifest Object with:

- type: [String] \(basis for compatibility test, like current data store / node type names) 
- clientid: [String] used by the app to distinguish datasources of the same type (e.g. 'main-bulb')
- granularities: [Array of [Granularity](#granularity)]
- required: [Boolean]

Available in SLA to the app after install:

- type [string] the databox datasource type
- name [string] datasource name
- required [bool]
- clientid [string] the id provided by the app to assign this datasource to
- granularities [array] not used yet 
- endpoint [string] href pointing to the datasource endpoint,
- datasource [string] the datasource name,
- description [string] human readable description
- location [string] human readable location ed "living room"
- hypercat [json/text] the full hypercat item provided by the driver for this datasource

Notes:

- Should datasource types be based on (reverse?) domain names for uniqueness / namespace management?

### Export Destination

An JSON object formatted as follows.

    {
        'url': SOME_HTTPS_URL,
        'description': "Human readable description"
    }

Here, the URL is an HTTPs URL to an external server that an app may export data to. This must be full URL that is matched exactly. Once approved by a user, an app can query the `\export` enpoint on the Databox export service (documented [here](https://github.com/me-box/databox-export-service#api)) to emit results to a remote host.

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
