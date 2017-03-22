Delegated Authorisation in Databox
==================================

[Macaroons](http://macaroons.io/) are a standard for bearer tokens that are similar to signed cookies. Encoded within, are a list of so-called _caveats_ which are conditions that must all be satisfied for a macaroon to be considered valid. The main advancement that macaroons provided over other credential systems for delegated authorisation are that these caveats can be stacked, letting bearers narrow down a macaroon's permissions even further before handing it off to a third party, allowing distributed and decentralized authorisation. This is done by nesting and chaining HMACs.

In some cases we treat a set of caveats as a "product of sums", in the sense that each caveat is a conjunct that is ANDed with all other caveats, while individual caveats may define disjunctions in the form of whitelists with each contained disjunct ORed. Crucially, any combination of conditions can be expressed in this manner, making this extension of macaroons flexible enough to cover any expression of permissions.

App/driver developers do not need to be aware of the fact that we use macaroons — they just request a token and see a serialsed string that they then include in requests to stores. As such, the arbiter endpoint for requesting macaroons is simply at `/token`.

In this document we define the caveats that are checked for by stores. Caveats are by definition optional, so we define a minimum set of caveats that are always encoded into macaroons minted by the arbiter. Tokens are per-datasource.

Universal Caveats
-----------------

### target = _store-hostname_

Defines the target store with which this token can be used.

### path = _/datasource/api_

Defines the endpoint with which this store can be used, which covers datasources as well as other apis such as logging, notifications, or catalogues. Simple formatting can be used within paths such as wildcards or conditionals, defined [here](https://github.com/pillarjs/path-to-regexp#parameters) and testable [here](http://forbeslindesay.github.io/express-route-tester/).

### method = _(GET|POST)_

HTTP methods where `GET` requests map to `read` operations, while `POST` requests map to `write` operations. This caveat should be included in all tokens, as a macaroon would otherwise be too permissive to allow both read and write.

### TBD
- time < _timestamp_
- universal granularity caveats (e.g. rate limiting)


Caveats Unique to Time Series Datasource Paths
----------------------------------------------

Time series datasource paths are store API endpoints that match `/[datasource]/ts/*`. NB: These are **not** a substitute for API parameters. API parameters are simply checked against this caveat if it exists. If not, it is implied that the token does not restrict these parameters.

### startTimestamp >= _[timestamp]_

This caveat applies to `/ts` endpoints that take start timestamp parameters (`since`, `range`) and must be satisfied by start time. No other endpoints can satisfy this caveat (the request would fail with a 401 Unauthorized).

### endTimestamp <= _[timestamp]_

This caveat applies to `/ts` endpoints that take end timestamp parameters (`range`) and must be satisfied by end time. No other endpoints can satisfy this caveat (the request would fail with a 401 Unauthorized).

### TBD
- Limiting by number of samples rather than time
- Limiting by frequency of samples or temporal resolution
- Etc

Caveats Unique to Hypercat Catalogue Paths
------------------------------------------

Some apps might need to query store catalogues. Provided the have a tokens for store `/cat` endpoints, these tokens can also have additional caveats that a store can inspect to filter its response.

### datasources = _[JSON-formatted whitelist array of datasource IDs]_

Controls the visibility (not accessibility) of datasource items and their metadata in a queried store catalogue. If includeded, store catalogues are filtered to only include resources contained in the caveat whitelist.

TBC
---
