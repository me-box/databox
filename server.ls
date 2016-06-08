require! {
  http
  dockerode: Docker
  express
  'body-parser'
  request
  fs
  \socket.io : io
  \docker-events : DockerEvents
  \http-proxy-middleware : proxy
  crypto
  ursa
}

const server-port  = process.env.PORT or 8080
const registry-url = 'amar.io:5000'

app = express!
server = http.create-server app
io := io server

console.log 'Establishing communication with Docker daemon'

docker = new Docker!

# Quit if Docker daemon is not already running
err, data <-! docker.ping!
if err?
  console.error 'Unable to connect to Docker daemon; check if running.'
  console.error err
  return

# Kill any already running Databox containers
console.log 'Killing any already running Databox containers'

<-! kill-all = (callback) !->
  err, containers <-! docker.list-containers all: true filters: '{ "label": [ "databox.type" ] }'
  promises = containers.map (container) ->
    id = container.Id
    name = container.Names[0]
    resolve, reject <-! new Promise!
    container = docker.get-container id
    console.log "Stopping #name"
    err, data <-! container.stop
    console.log "Removing #name"
    err, data <-! container.remove
    resolve!

  Promise.all promises .then callback

/*
# Clean up on exit
clean-up = !->
  console.log 'Cleaning up'
  # TODO: Find a way to do this
  # kill-all ->

process
  ..on \exit clean-up
  ..on \SIGINT clean-up
  #..on \uncaughtException !->
*/

# Create networks if they do not already exist
console.log 'Checking driver and app networks'

err, networks <-! docker.list-networks {}
driver-net = null
app-net    = null

networks.for-each (network) !->
  if      network.Name is \driver-net then driver-net := docker.get-network network.Id
  else if network.Name is \app-net    then app-net    := docker.get-network network.Id

<-! (callback) !->
  if driver-net?
    console.log 'Driver network already exists'
    callback!
    return
  console.log 'Creating driver network'
  err, network <-! docker.create-network do
    Name: \databox-driver-net
    Driver: \bridge
    #Internal: true
    #IPAM:
    #  Config:
    #    * Subnet: '172.20.0.0/16'
    #      IP-range: '172.20.10.0/24'
    #      Gateway: '172.20.10.11'
    #    ...
  driver-net := network
  callback!

<-! (callback) !->
  if app-net?
    console.log 'App network already exists'
    callback!
    return
  console.log 'Creating app network'
  err, network <-! docker.create-network do
    Name: \databox-app-net
    Driver: \bridge
    #Internal: true
    #IPAM:
    #  Config:
    #    * Subnet: '172.20.0.0/16'
    #      IP-range: '172.20.10.0/24'
    #      Gateway: '172.20.10.11'
    #    ...
  app-net := network
  callback!

# Define util functions
# TODO: Unused now
get-container = (name, callback) !->
  err, containers <-! docker.list-containers all: true
  for container in containers
    if ~container.Names.index-of name
      container.Id |> docker.get-container |> callback
      return
  callback!

proxy-container = (name, port) !->
  app.use proxy name, do
    target: "http://localhost:#port"
    ws: true
    path-rewrite:
      "^#name": '/'
    on-proxy-res: !->
      it.headers['Access-Control-Allow-Origin'] = \*
      it.headers['Access-Control-Allow-Headers'] = 'X-Requested-With'

# Launch Arbiter
var key-pair

<-! (callback) !->
  # Pull latest Arbiter image
  console.log 'Pulling Arbiter container'
  err, stream <-! docker.pull "#registry-url/databox-arbiter:latest"
  err, output <-! docker.modem.follow-progress stream

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
  # TODO: Save all logs to files
  #err, stream <-! arbiter.attach stream: true stdout: true stderr: true
  #stream.pipe process.stdout

  # Start Arbiter container
  console.log 'Starting Arbiter container'
  err, data <-! arbiter.start!

  console.log 'Connecting Arbiter container to driver network'
  err, data <-! driver-net.connect Container: arbiter.id

  console.log 'Connecting Arbiter container to app network'
  err, data <-! app-net.connect Container: arbiter.id

  console.log 'Setting up proxy to Arbiter'
  err, data <-! arbiter.inspect
  proxy-container \/arbiter parse-int data.NetworkSettings.Ports['8080/tcp'][0].HostPort

  callback!


# Create server
console.log 'Initializing server'

app.enable 'trust proxy'

app.use express.static \www

app.set \views \www
app.set 'view engine' \pug

app.get \/ (req, res) !->
  res.render \index

app.get \/close (req, res) !->
  res.render \close

app.use body-parser.urlencoded extended: false

io.on \connection (socket) !->
  emitter = new DockerEvents { docker }
    ..on \connect    !-> socket.emit \docker-connect
    ..on \disconnect !-> socket.emit \docker-disconnect
    ..on \_message   !-> socket.emit \docker-_message   it
    ..on \create     !-> socket.emit \docker-create     it
    ..on \start      !-> socket.emit \docker-start      it
    ..on \stop       !-> socket.emit \docker-stop       it
    ..on \die        !-> socket.emit \docker-die        it
    ..on \destroy    !-> socket.emit \docker-destroy    it
    # TODO: Inform of container status changes
    ..start!

  socket.on \disconnect !-> emitter.stop!

  socket.on \echo !-> socket.emit \echo it

app.post '/get-arbiter-status' (req, res) !->
  arbiter <-! get-arbiter
  err, data <-! arbiter.inspect
  res.end data.State?.Status

app.post '/list-containers' (req, res) !->
  err, containers <-! docker.list-containers all: req.body.all, filters: '{ "label": [ "databox.type" ] }'
  containers |> JSON.stringify |> res.end

app.post '/list-images' (req, res) !->
  err, images <-! docker.list-images filters: '{ "label": [ "databox.type" ] }'
  images |> JSON.stringify |> res.end

app.post '/list-store' (req, res) !->
  (error, response, body) <-! request "https://#registry-url/v2/_catalog"
  if error
    error |> JSON.stringify |> res.end
    return

  repositories = body |> JSON.parse |> (.repositories)
  repo-count = repositories.length

  manifests = []

  repositories.for-each (repository) !->
    error, response, body <-! request.post do
      url: "https://datashop.amar.io/app/get/"
      form: name: repository

    body = JSON.parse body

    # Silently ignore if app not found (no manifest, or special)
    unless body.error? and body.error is 23
      manifests.push body

    if --repo-count < 1
      manifests |> JSON.stringify |> res.send

app.post '/pull-app' (req, res) !->
  name = req.body.name
  tag  = req.body.tag or \latest
  err, stream <-! docker.pull "#registry-url/#name:#tag"
  stream.pipe res

app.post '/launch-container' do ->
  repo-tag-to-name = (.match /\/.+(?=:)/ .[0])

  update-arbiter = (params, callback) !->
    error, response, body <-! request.post do
      url: "http://localhost:#server-port/arbiter/update"
      form: params

    console.log body

    # TODO: Error handling
    body |> JSON.parse |> callback

  launch-container = (repo-tag, callback) !->
    # Pull to install or for updates first
    console.log "Pulling image from #repo-tag"
    err, stream <-! docker.pull repo-tag
    err, output <-! docker.modem.follow-progress stream
    # TODO: Handle potential namespace collisions
    name = repo-tag |> repo-tag-to-name
    console.log "Creating #name container"
    err, container <-! docker.create-container Image: repo-tag, name: name
    err, data <-! container.inspect

    type = data.Config.Labels[\databox.type]

    console.log "Generating Arbiter token for #name container"
    err, buffer <-! crypto.random-bytes 32
    token = buffer.to-string \hex

    console.log "Passing #name token to Arbiter"
    update = JSON.stringify { type, token }

    sig = key-pair.hash-and-sign \md5 new Buffer update

    #res <-! update-arbiter { update, sig }

    config =
      NetworkMode: if type is \driver then \databox-driver-net else \databox-app-net
      Env: [ "ARBITER_TOKEN=#token" ]
      #Binds: [ "#__dirname/apps/#name:/./:rw" ]

    # Abort if container tried to expose more than just port 8080
    console.log "Checking ports exposed by #name container"
    exposed-ports = data.Config.ExposedPorts
    exposed-port-count = 0
    for i of exposed-ports then ++exposed-port-count

    if exposed-port-count > 1
      container.remove !-> callback error: 'Container not launched due to attempts to expose multiple ports.'
      return

    if exposed-port-count is 0 and type is \driver
      container.remove !-> callback error: 'Driver not launched due to not exposing any ports.'
      return

    if exposed-port-count is 1
      if '8080/tcp' not of exposed-ports
        container.remove !-> callback error: 'Container not launched due to attempting to expose a port other than port 8080.'
        return
      config.PublishAllPorts = true

    console.log "Starting #name container"
    err, data <-! container.start config
    err, data <-! container.inspect
    port = parse-int data.NetworkSettings.Ports['8080/tcp'][0].HostPort

    proxy-container name, port
    # TODO: Error handling
    callback { name , port }

  (req, res) !->
    response <-! launch-container req.body.repo-tag
    response |> JSON.stringify |> res.send

server.listen server-port
