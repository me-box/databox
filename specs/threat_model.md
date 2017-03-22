# Databox Threat Model

Initial working notes. (2017-02-08)

Some of the items are "usability threats" rather than traditional security threats, i.e. issues which need to be considered carefully to avoid significant usability barriers. They are included here as they tend to push back on strict security requirements and shape the same technical mechanisms.

## Threats from Apps and Drivers

Apps and Drivers are the primary extension points of the platform.

### Malicious Apps

Malicious apps may be created, installed and run on the databox. These may attempt:
- denial of service, e.g. exhaust CPU, local bandwidth, memory or storage
- send personal data off box without or beyond consent 
- malicious physical action via databox actuators
- bridgehead attack of databox, databox apps, databox services
- bridgehead attack of other devces/systems on the home network
- interact with external services in support of any of the above

Technical mitigations:
- Apps will have limited resource quotas for CPU and memory (and other resources?!)
- Apps will flag high resource use to users via the dashboard
- Apps will have no direct access to the home network or to the Internet
- Apps will only have internal network access to the Datastores they have permission to use
- Datastores will enforce App permission in relation to actuators and data sources (so an app will only be able to actuate something for which it has permissions)
- Apps will have to use the external request service to send data off the box (subject to logging and inspection)
- App interactions with datastores will be logged and auditable
- Apps can only be installed by authorised users
- Apps can be disabled or uninstalled by authorised users

Sociotechnical mitigations:
- App stores will have rating and comment systems which allow users to share information about their experiences of apps
- (future) activities of Apps may be compared across a cohort of installation to detect anomalous activity.

### Malicious App UIs

Apps may have browser-based UIs, served out of the installed app.

A malicious apps UI may attempt to contact others servers or devices, e.g. to send data avoiding the export service or to attack other local devices of services.

Mitigations: 
- the App UI can only be accessed via a databox reverse proxy
- the proxy introduces headers to instruct the browser to prevent access to other servers/urls
- users will be advised to use compliant browsers

Out of scope:
- if the browser (which is under the user's control) is non-compliant or malicious 

### Buggy Apps

Buggy or poorly designed apps may be created, installed and run on the databox. These may attempt to do similar things to malicious apps.

Malicious drivers may be created, installed and run on the databox. 

Note: unlike normal Apps many Drivers require for correct operation some level of access to (a) devices on the home network and/or (b) external Internet services.

Technical mitigations (additional to apps):
- Drivers will require additional certification in order to access home network and/or external Internet services.

Sociotechnical mitigations:
- The core project or other specific parties will review and certify drivers.
- There will be a framework (cf PKI root certificates) and processes for managing trust roots on a databox.

### Imposter Apps

Malicious apps may be created with seek to replace trusted apps. E.g.
- masquerading as a new version of an existing app
- replacing an existing app in a compromised app store
- masquerading as an existing or trusted app

Technical mitigations:
- Apps will be signed, and new versions of the same app will have to use the same key.
- App Stores will be secure and uploading new versions will be controlled.

Socitechnical mitigations:
- ?? what about brands and claims ??

### Malicious App stores

(in the multi-appstore world...)


## Platform threats

### Bugs

:-)

### Malicious code contributions



## UI Threats

All user interface are (currently) interacting with the databox primarily over the network, i.e. from mobile browser apps or native apps.

Note that principals can be:
- user accounts, i.e. individuals or shared/role accounts
- devices, i.e. specific hardware device irrespective of who is using it, c.f. a TV remote control (= anonymous user but specified device)

### New Databox 

A new databox is introduced into a home; what can it do, what devices can interface to or control it, what principals exist, how are they authenticated and what authorisation do they have?

- a new databox is in a distinct and well-defined new/resurrected state
- there is one initial management/admin account
- initial credentials are physically bundled with the databox, e.g. default password, physical key(s)
- initial access must be from a device on the local network, and initial credentials must be entered on that device
- network traffic will be encrypted
- initial security/access settings can then be established for: future access to the default admin account (e.g. change password, (recovery codes,) specific devices, trusted devices; guest access; ??

### New (user) Device

A new device is introduced to be used when interacting with the databox.

(the first device is introduced as in New Databox (above))

Subsequent devices:

(a) using an existing device
- an authorised account requests to add a device and receives an authorisation code (for a device or for a device/account pair)
- optional the device must be on the home network
- optional an account key must be present
- the code is entered into the new device
- the account is notified of the new trusted device

(b) without using an existing device
- the user enters an account/credential directly on the new device
- optional the device must be on the home network
- optional an account key must be present
- optional 2FA confirmation step, e.g. code notification sent to account and entered on the new device
- the account is notified of the new trusted device

### New Principal

A new user/principal is introduced to use the databox.

- an authorised account creates the new account, notification channel(s) (e.g. initial email) and specifies initial group membership(s)
- an initial credential or one-time token is sent or given 
- the user authenticates on a device

### Authenticate principal

A user wants to access the databox via some device.

(a) new device or existing device (untrusted)
- as New (user) device (a) (if already authenticated on existing device) Or (b), above
- user can set device as trusted and specify device-specific authentication short-cut (e.g. just select, pin, ...)

(b) existing device, trusted
- device-specific authentication short-cut (e.g. just select account, pin, ...)

### Malicious device

A device with network access seeks to comprimise the databox, e.g.
- gain access to unauthorised apps, services, etc..
- assume a principal's identity
- cause damage e.g. data corruption
- denial of service


### Lost credentials

A user has lost/forgotten their usual authentication credentials.
- optional device must be on home network
- optional key must be present
- optional device must be trusted
(a) 
- user requests credential reset token to be sent over trusted notification channel (email, SMS, etc.)
- user enters credential reset token 
- user sets/updates credential
(b) 
- user enters previously generated one-time recovery token
...
(c)
- user enters previously established security challenge
...
(d) ??
- another user with suitable authorisation (admin? specific nomination?) requests credential reset token for this user
...

### Stolen/changed credentials

A user's credentials (e.g. password) have been stolen and subsequently changed.

- see lost credentials
Note: can one-time recovery token be invalidated, or security challenges or nominated backups changed by the imposter?  

### Lost device

An authenticated device has been lost.

- user authenticates via another device
- user revokes trust of lost device
- optional user blocks lost device
- optional user requests wipe of data on lost device

### Stolen device

An authenticated device has been stolen.

### "Greedy" user or guest

A user (or guest) makes use of apps and services to an extent that compromises the experiece of other users due to shared resource limitation, but with no particular malice.

A user (or guest) attempt to access apps and services which they are not authorised to, but with no particular malice.

### "Forgotten" user

A user or guest has a legitimate (social) claim to some app or data source but this is not reflected in the system as configured by other users. (e.g. an unexpected guest)

- guest password??


### Guest / temporary user

A guest of visitor has a short-term reason for using particular apps (e.g. smart home controls) but should not be given long-term or general access.

- use shared devices?
- create guest device/account?


### Incompetent user

A user accidentally or unwittingly requests operations that would compromise the operation of the databox or other user's experiences.

### Malicious user

More generally, a user/account deliberately attempts to e.g.
- obtain data about other users
- control other user's actuators
- denial of service on other users
- destruction of oter user's data or apps, including resetting the device

### Malicious non-user

Someone without an account attempting to gain access or cause problems.
- via their own device(s) within the home
- via shared devices in the home
- via other users' personal devices
- via their own device(s) outside the home

### Lost / missing user

A former user is no longer present or available, but they have data sources, apps, etc.

- admin user can delete / un-own apps and datasources and close/remove accounts
- actions generate user notifications 
- user can have their own backup ?!

## Local device threats

E.g. IoT devices, other computers on the home network

### Malicious device

Malicious or compromised device on the home network...

## Physical Threats

Where there is physical access to the databox...

### Theft

Someone may steal the databox, e.g. to
- attempt to extract credentials or personal data from it
- ransom it
- cause damage/inconvenience

Technical mitigations:
- data encrypted at rest
- specific interaction (giving access to key material) required during every boot 
- data can be backed up encrypted elsewhere and a replacement databox created from it

Out of scope:
- someone may sell it/reuse it; there is nothing to prevent someone wiping it starting from scratch after stealing it. (And mitigating other threats may suggest making this easy.)

### Loss/Destruction/Physical failure

The databox may be lost, destroyed or break
- all data and configuration on the box is lost

Technical mitigations:
- data can be backed up encrypted elsewhere and a replacement databox created from it

### Disposal

The databox is being thrown away or recycled.

Technical mitigations:
- an authorised user can factory reset the databox, wiping all personal data and configuration.

### Copying

Someone copies information (e.g. default credentials) from the databox or databox keys.

### Tampering

Someone may tamper with the databox, e.g. 
- copy the files off it
- directly modify the files on it
- change/deface the associated printed details

Technical mitigations:
- as for Theft (encryption of data at rest, boot process, backup)
- ? file system integrity checks 

Out of scope:
- someone may attach hardware diagnostic systems to a live running databox and extract credentials, etc from direct monitoring of bus activity, etc. 

## Threats to App Providers / Third Parties

E.g.
- how does the app provider know what the app is receiving correct data?
- how does the app provider's data processer recieving data over HTTP know that it has come from their app?
- how does the app provider know that their app has not been tampered with?
- how are legally enforceable agreements made and audited, including user's undertakings to app providers as well as app provider's undertakings to users?
