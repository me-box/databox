# Mirror databoxsystems from docker hub

When running demos and hack days there can be issues with external network connectivity. Instilling databox and the SDK requires around 3GB per install.

These scripts will let you quickly set up a local mirror and distribute the image locally to the participants.

## Create a local mirror of the databox registry

First chose the machine you wish to use as a mirror and run

```
    docker run -d -p 5000:5000 --restart always --name registry registry:2

    then

    ./mirror 127.0.0.1:500
```

This will seed all the needed image in to a local registry. Your participants should than be instructed to install databox using the instructions. But before running databox-start they should run

```
    ./scripts/scripts/registry/seedFromMirror [IP-AND-PORT-OF-YOUR-MIRROR]

```

This will pre populate their local image caches with the images required from your local registry.
