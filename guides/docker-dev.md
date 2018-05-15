Advanced Databox Development
============================

Some developers may find that what they want to create goes beyond what they can use the SDK for. Expecially when designing drivers or tweaking system components, it becomes necessary to get your hands dirty and develop at the container level.

The workflow for writing, testing, and debugging code that runs in Docker containers can be a painful and arduous process. This guide describes a practical development cycle, with a focus on writing drivers and apps for Databox.

Preparing a Staging Container
-----------------------------

Depending on the language and framework you want to develop in, you may find some template Dockerfiles already provided. The following instructions can apply to any language, but for the purpose of this guide, we'll use a basic Dockerfile for a Databox app written in Node.js from `databox-app-template-node`.

    # Use node:alpine base image
    FROM node:alpine

    # Copy files from working directory to container root
    COPY . .
    # Install dependencies
    RUN npm install

    # Add Databox container type label
    LABEL databox.type="app"

    # Start program
    CMD ["npm","start"]

Note three things:
  - Our working directory within the container is the default (root). You may prefer to `ADD`/`COPY` files elsewhere and set a new working directory with `WORKDIR`. If so, make note of the location.
  - Because this is an interpreted language, we have no compliation step. If you are using a compiled language (e.g. based off of the Java template) make note of the compilation command.
  - The container will start running with `npm start` and exit when that command exits.

Normally, in this dev environment, if we want to modify, rebuild, and rerun our program, we would have to stop and remove the container first, build a new container image, push it to the local registry, then re-launch it, and cross our fingers that we didn't make a stupid mistake when querying Docker logs. This is too impractical.

We want to launch this container once, and be limited at most by the time it takes to build our code. One way we can achieve this is by setting up a container for staging. To do so, have the container start and keep itself alive, by for example changing the last line in the Dockerfile to:

    CMD ["sleep","2147483647"]

Now build and push this container as usual to the local registry. If you're using a template repo, refer to its documentation as it may have scripts built in to do this automatically. Otherwise, you can use the Docker CLI in the following manner, replacing the container name with what your component is called:

    docker build -t databox-app-template-node .
    docker tag databox-app-template-node localhost:5000/databox-app-template-node
    docker push localhost:5000/databox-app-template-node

Similarly, if you're deploying your container on a different host (such as an actual Databox) replace `localhost` with its hostname or IP address.

Before you can launch the container, you must also upload its manifest to a local development manifest server, in the same way you would when publishing an app or driver. Browse to port 8181 on the host (e.g. http://localhost:8181) and follow the instructions there. As long as you don't need to update your container manifest, you will only need to do this once.

Now you can launch your container through the dashboard by browsing to the URL indicated by the Databox system. If you're deploying on the same host that you're developing on, this will likely be http://localhost:8989.

Once launched the container should do nothing yet.

Running your Code
-----------------

Having set up this container, you can now manually have it launch your program through the Docker CLI. For the above example:

    docker exec -it databox-app-template-node npm start

Program output will be written straight to stdout, and on exiting, the container will remain alive.

Modifying and Rerunning your Code
---------------------------------

So you had some errors, did some debugging, and want your latest source code to run in that same container. To do so, we use the Docker CLI to copy some or all files in our working directory, to the container working directory. In the above Dockerfile, the latter is the root directory.

    docker cp . databox-app-template-node:/

This is the point at which if you were programming in a compiled language, you would recompile inside the container before rerunning it, e.g.

    docker exec -it databox-app-template-node javac *.java

For our example, we only need to rerun it:

    docker exec -it databox-app-template-node npm start

Build Systems
-------------

It may be possible to instead launch a program that watches for file changes (`watch`, `nodemon`, `forever`, etc) and triggers a build script and/or relaunches your program inside Docker. To do this, you would simply need to replace the `CMD` command in your Dockerfile with one that starts the file watcher.

Then you can have the same host-side that triggers `docker cp` when you've changed your source code. This would make it so that every time you hit save on your source code, the the Docker container in Databox automatically "hot-swaps" your program.

Doing so may not always work however, as most of these tools rely on `inotify` to detect file changes, which can be feeble in Docker containers. They may fall back to polling files, which is slow, inefficient, and wastes resources.

Tweaking UIs
------------

> :warning: Warning: The way UIs work may change soon, so this may become deprecated

In most cases, you will not need to relaunch your program to update a web UI. Once you copy your modified files over, you can simply refresh the UI page, i.e. after something like:

    docker cp ./www databox-app-template-node:/www

Debugging Container Permissions
-------------------------------

This should be rare, but if somehow you find that stores are rejecting your requests even though you think your container has the correct permissions, you can check Arbiter records by browsing to the Arbiter UI in the dashboard, and hopefully narrow down what's missing.

Mock Containers
---------------

> :construction: Coming soon!
