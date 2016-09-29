require! {
  os
  crypto
  request
  ursa
  dockerode: Docker
  \docker-events : DockerEvents
}

export const registry-url = 'registry.upintheclouds.org'

# Get local IP for env
# TODO: Maybe find a different solution
ifaces = os.network-interfaces!
var ip
do ->
  for ifname in Object.keys ifaces
    continue unless ifname.starts-with \w
    for iface in ifaces[ifname]
      continue unless iface.family is \IPv4 #and iface.internal
      ip := iface.address
      console.log "Local IP to use set as #ip"
      return

var docker
var docker-emitter

var key-pair
networks = {}

# Define util functions
# TODO: Promise
get-container = (name, callback) !->
  err, containers <-! docker.list-containers
  if err? then callback err; return
  for container in containers
    if ~container.Names.index-of "/#name"
      container.Id |> docker.get-container |> callback null _
      return
  callback new Error "Container #name does not exist locally"

# TODO: Don't do this; it's bad
export get-docker = -> docker
export get-docker-emitter = -> docker-emitter

export connect = ->
  resolve, reject <-! new Promise!

  #docker ?= new Docker!
  #docker-emitter ?= new DockerEvents { docker }

  docker := docker or new Docker!
  docker-emitter := docker-emitter or new DockerEvents { docker }

  # Quit if Docker daemon is not already running
  err, data <-! docker.ping!
  if err?
    console.error 'Unable to connect to Docker daemon; check if running.'
    reject err
    return

  resolve!

export kill-all = ->
  resolve, reject <-! new Promise!

  err, containers <-! docker.list-containers all: true filters: '{ "label": [ "databox.type" ] }'
  promises = containers.map (container) ->
    id = container.Id
    name = container.Names[0].substring 1
    resolve, reject <-! new Promise!
    container = docker.get-container id
    console.log "Stopping #name"
    err, data <-! container.stop
    console.log "Removing #name"
    err, data <-! container.remove
    resolve!

  Promise.all promises .then resolve, reject


export init-networks = ->
  resolve, reject <-! new Promise!

  # Create networks if they do not already exist
  console.log 'Checking driver and app networks'

  load-network = (name) ->
    resolve, reject <-! new Promise!

    err, nets <-! docker.list-networks {}
    if err?
      console.log 'Unable to list Docker networks'
      reject err
      return
    var network
    for net in nets
      if net.Name is name
        network := docker.get-network net.Id
        # TODO: Don't
        networks[name] = network
        break

    if network?
      console.log "Network #name already exists"
      resolve network
      return

    console.log "Creating network #name"
    err, network <-! docker.create-network do
      Name: name
      Driver: \bridge
      #Internal: true
      #IPAM:
      #  Config:
      #    * Subnet: '172.20.0.0/16'
      #      IP-range: '172.20.10.0/24'
      #      Gateway: '172.20.10.11'
      #    ...
    if err?
      console.error 'Unable to create driver network'
      reject err
      return

    # TODO: Don't
    networks[name] = network
    resolve network

  Promise.all [
    load-network \databox-driver-net
    load-network \databox-app-net
  ] .then resolve, reject


export launch-arbiter = ->
  resolve, reject <-! new Promise!

  # Pull latest Arbiter image
  console.log 'Pulling Arbiter container'
  err, stream <-! docker.pull "#registry-url/databox-arbiter:latest"
  if err? then reject err; return
  stream.pipe process.stdout
  err, output <-! docker.modem.follow-progress stream
  if err? then reject err; return

  # Generating CM Key Pair
  console.log 'Generating CM key pair'
  key-pair := ursa.generate-private-key!
  public-key = key-pair.to-public-pem \base64

  # Create Arbiter container
  console.log 'Creating Arbiter container'
  err, arbiter <-! docker.create-container do
    name: \arbiter
    Image: "#registry-url/databox-arbiter:latest"
    #PortBindings: '8080/tcp': [ HostPort: \8081 ]
    PublishAllPorts: true
    Env: [ "CM_PUB_KEY=#public-key" ]
    #Tty: true
  if err? then reject err; return
  # TODO: Save all logs to files
  #err, stream <-! arbiter.attach stream: true stdout: true stderr: true
  #stream.pipe process.stdout

  # TODO: Denodify all this stuff?

  # Start Arbiter container
  console.log 'Starting Arbiter container'
  err, data <-! arbiter.start!
  if err? then reject err; return

  console.log 'Connecting Arbiter container to driver network'
  err, data <-! networks[\databox-driver-net].connect Container: arbiter.id
  if err? then reject err; return

  console.log 'Connecting Arbiter container to app network'
  err, data <-! networks[\databox-app-net].connect Container: arbiter.id
  if err? then reject err; return

  console.log 'Checking Arbiter port'
  err, data <-! arbiter.inspect
  if err? then reject err; return

  resolve name: \arbiter port: parse-int data.NetworkSettings.Ports['8080/tcp'][0].HostPort

export launch-directory = ->
  resolve, reject <-! new Promise!

  # Pull latest directory image
  console.log 'Pulling directory container'
  err, stream <-! docker.pull "#registry-url/databox-directory:latest"
  if err? then reject err; return
  stream.pipe process.stdout
  err, output <-! docker.modem.follow-progress stream
  if err? then reject err; return

  # Create directory container
  console.log 'Creating directory container'
  err, directory <-! docker.create-container do
    name: \directory
    Image: "#registry-url/databox-directory:latest"
    PublishAllPorts: true
  if err? then reject err; return
  
  # Start directory container
  console.log 'Starting directory container'
  err, data <-! directory.start!
  if err? then reject err; return

  console.log 'Connecting directory container to driver network'
  err, data <-! networks[\databox-driver-net].connect Container: directory.id
  if err? then reject err; return

  console.log 'Connecting directory container to app network'
  err, data <-! networks[\databox-app-net].connect Container: directory.id
  if err? then reject err; return

  console.log 'Checking directory port'
  err, data <-! directory.inspect
  if err? then reject err; return

  resolve name: \directory port: parse-int data.NetworkSettings.Ports['3000/tcp'][0].HostPort

export launch-container = do ->
  repo-tag-to-name = (.match /(?:.*\/)?([^/:\s]+)(?::.*|$)/ .[1])

  update-arbiter = (params, callback) !->
    err, arbiter <-! get-container \arbiter
    if err? then callback err; return
    err, data <-! arbiter.inspect
    if err? then callback err; return

    port = parse-int data.NetworkSettings.Ports['8080/tcp'][0].HostPort

    error, response, body <-! request.post do
      url: "http://localhost:#port/update"
      form: params

    if error? then callback error; return

    # TODO: Error handling
    body |> JSON.parse |> callback null _

  # NOTE: Name is optional and will override default
  # NOTE: Env is optional and additive
  (repo-tag, name, env = []) ->
    resolve, reject <-! new Promise!

    # Pull to install or for updates first
    console.log "Pulling image from #repo-tag"
    err, stream <-! docker.pull repo-tag
    if err? then reject err; return
    stream.pipe process.stdout
    err, output <-! docker.modem.follow-progress stream
    if err? then reject err; return
    # TODO: Handle potential namespace collisions
    name := name or repo-tag-to-name repo-tag

    console.log "Generating Arbiter token for #name container"
    err, buffer <-! crypto.random-bytes 32
    if err? then reject err; return
    token = buffer.to-string \base64

    console.log "Creating #name container"
    err, container <-! docker.create-container do
      name: name
      Image: repo-tag
      Env: [ "DATABOX_IP=#ip" "ARBITER_TOKEN=#token" ] ++ env
      PublishAllPorts: true
    if err? then reject err; return

    err, data <-! container.inspect
    if err? then reject err; return

    type = data.Config.Labels[\databox.type]
    result <-! (callback) !->
      # TODO: WARNING: Disable this whole bit for the tests
      # TODO: Change this based on what Mort says
      # TODO: Don't hardcode this
      unless type is \driver and ~name.index-of \driver
        callback {}
        return
      # TODO: Don't hardcode store type
      console.log "Launching passthrough store for #name driver"
      # TODO: Is launching store before driver a security risk (driver hostname getting hijacked)?
      launch-container 'registry.upintheclouds.org/databox-store-passthrough:latest' "#name.store" [ "HOSTNAME=#name.store" "DRIVER_HOSTNAME=#name" ]
        .then callback

    if result.error?
      container.remove !-> resolve result.error
      return
    console.log "Passing #name token to Arbiter"
    update = JSON.stringify { name, token, type }

    sig = key-pair.hash-and-sign \md5 new Buffer update .to-string \base64

    err, res <-! update-arbiter { data: update, sig }
    # TODO: Error handling
    if err? then reject err; return

    # Abort if container tried to expose more than just port 8080
    console.log "Checking ports exposed by #name container"
    exposed-ports = data.Config.ExposedPorts
    exposed-port-count = 0
    for i of exposed-ports then ++exposed-port-count

    if exposed-port-count > 1
      container.remove !-> resolve error: 'Container not launched due to attempts to expose multiple ports.'
      return

    if exposed-port-count is 0 and type is \driver
      container.remove !-> resolve error: 'Driver not launched due to not exposing any ports.'
      return

    #if exposed-port-count is 1
      # TODO: Only if databox type
      #if '8080/tcp' not of exposed-ports
      #  container.remove !-> resolve error: 'Container not launched due to attempting to expose a port other than port 8080.'
      #  return

    console.log "Starting #name container"
    err, data <-! container.start
    # TODO: Handle error properly
    if err? then reject err; return

    # FIXME: Very weird race condition when connecting to networks after starting
    <-! (callback) !->
      if type is \app
        callback!
        return
      console.log "Connecting #name to driver network"
      err, data <-! networks[\databox-driver-net].connect Container: container.id
      if err? then console.log err
      # TODO: Error handling
      callback!

    <-! (callback) !->
      if type is \driver
        callback!
        return
      console.log "Connecting #name to app network"
      err, data <-! networks[\databox-app-net].connect Container: container.id
      if err? then console.log err
      # TODO: Error handling
      callback!

    err, data <-! container.inspect
    if err? then reject err; return

    # TODO: Hack
    if name.starts-with \mongo
      port = parse-int data.NetworkSettings.Ports['27017/tcp'][0].HostPort
    else
      port = parse-int data.NetworkSettings.Ports['8080/tcp'][0].HostPort

    # TODO: Error handling
    resolve { name , port }

export get-container-stats-stream = (name) ->
  resolve, reject <-! new Promise!
  err, container <-! get-container name
  if err?
    reject err
    return
  # TODO: Error handling
  err, stream <-! container.stats
  resolve { name, err, stream }
