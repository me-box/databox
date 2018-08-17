# Testing

This document contains information on how to test Databox.

# Integration tests

The main databox repository contains the integration tests for Databox.
These are in early development but are still useful. Run

      make test

These test will build databox and install a driver and app pair to check
functionality. More work is required but it is a start.


# Unit tests

Most core components also have unit tests these are language specific.
See the [core-arbiter](https://github.com/me-box/core-arbiter/tree/master/test)
for an example.
