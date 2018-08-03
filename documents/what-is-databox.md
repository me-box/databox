# What is Databox?

Databox is designed as a safe and private place to process personal data;
Databox is a computing appliance owned and operated by the individual. Data may
come from many sources: online services, e.g. email or social media accounts, or
from sources inside the home, e.g. IoT devices, or personal devices, e.g.
tablets and mobile phones.

# How does Databox support apps in processing data?

Apps on the Databox are offered to consumers by 3rd parties via a Databox App
Store - the Databox Project will run an app store, but others are free to do so.
Apps for Databox come supplied with a manifest detailing processing purpose
along with the data sources used, data generated and whether any data is to be
exported - it is worth noting here that an app is not permitted to make any
direct network connections, rather data must be shipped via an export driver.
The operator of a Databox App Store should implement policies that confirm that
the manifest and the app behaviour code correspond, in extremis, by code
inspection. At install time, the user is asked to confirm that the app may
access the data it has requested. At run time Databox enforces the manifest as
an access control policy but also logs all accesses to data and export
activities. These logs can be audited to ensure the dynamic behaviour of the app
does not deviate from the expected behaviour defined in the manifest.

A new data source will require a Databox “driver” - this are named in similar
style to operating systems drivers, as they are privileged code - in particular
they can make network connections. As with apps, drivers come with a manifest,
including a list of external connections they need to make, which is also
enforced at runtime by the Databox platform. As privileged code, drivers needs
to undergo extensive testing and verification. Hence, for inclusion in Databox
software releases, drivers must be submitted to the Databox Project team for
validation, and for now will only be available for installation from the Databox
Project App Store.

# What constraints does Databox impose on apps?

The Databox Project pursues a policy of extreme data minimisation and purpose
limitation, as a route to building trust with users. Hence some polices for the
Databox Project App Store:

- Many apps supplied by 3rd parties via an App Store can operate on data and
  provide value to the customer without any sharing of underlying or derived
  data, and hence, with care, can operate under the personal use exception of
  GDPR - e.g. central heating controls. This represents extreme “Privacy by
  Design and Default” and is encouraged - of note then for app suppliers is that
  in doing this, they can ensure they are not data controllers or processors
  with the obligations and risks inherent in those roles.

- Some apps may offer functions that require the gathering of anonymous or
  pseudonymous statistics - e.g. compare your energy consumption to other
  families in 3 bedroom houses with 2 kids. Inline with a philosophy of data
  minimisation and purpose limitation - developers of apps wishing to process
  data from Databox, must perform as much processing of the data in the app on
  Databox as possible and export the minimum amount of derived data to achieve
  the stated purpose.

- Finally some apps will need to export personally identifiable information, but
  should still pursue the same data minimisation techniques as above, by maximal
  processing of data on Databox and minimal exporting.

- In general, data minimisation and purpose limitation precludes sweeping
  statement of the need of data “for research purposes” or “product improvement”
  or generalised onward data sharing. Rather if this required, recruit specific
  research participants for your beta apps, rather than expect to use the
  general population of Databox consumers as research subjects; and
  notwithstanding directed data processor functions via subcontracts (e.g.
  online retailer giving delivery company your address), if other parties need
  access to the consumer’s data, then they should engage directly with the
  consumer through an app.
