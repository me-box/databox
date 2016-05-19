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
}

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

container-exists = (name, callback) !->
  err, containers <-! docker.list-containers  all: true
  for container in containers
    if ~container.Names.index-of name
      container.Id |> docker.get-container |> callback
      return
  callback!

get-broker = (callback) !->
  container <-! container-exists \/broker
  if container?
    callback container
    return
  err, stream <-! docker.pull "#registry-url/databox-data-broker:latest"
  stream.pipe process.stdout
  <-! stream.on \end
  err, broker <-! docker.create-container Image: "#registry-url/databox-data-broker:latest" name: \broker Tty: true
  err, stream <-! broker.attach stream: true stdout: true stderr: true
  stream.pipe process.stdout
  callback broker

# Proxy already running apps and drivers
console.log 'Creating proxies to already running apps and drivers'

proxy-container = (name, port) !->
  app.use proxy name, do
    target: "http://localhost:#port"
    ws: true
    path-rewrite:
      "^#name": '/'
    on-proxy-res: !->
      it.headers['Access-Control-Allow-Origin'] = \*
      it.headers['Access-Control-Allow-Headers'] = 'X-Requested-With'

err, containers <-! docker.list-containers  all: true
containers.for-each (container) !->
  return unless \databox.type of container.Labels
  type = container.Labels[\databox.type]
  return unless type is \driver or type is \app
  # TODO: Error handling
  proxy-container container.Names[0], container.Ports[0].PublicPort

# Create networks if they do not already exist
console.log 'Checking driver and app networks'

err, networks <-! docker.list-networks {}
driver-net = null
app-net    = null

networks.for-each (network) !->
  if      network.Name is \driver-net then driver-net := network
  else if network.Name is \app-net    then app-net    := network

<-! (callback) !->
  if driver-net?
    console.log 'Driver network already exists'
    callback!
    return
  console.log 'Creating driver network'
  err, driver-net <-! docker.create-network do
    Name: \driver-net
    Driver: \bridge
    #IPAM:
    #  Config:
    #    * Subnet: '172.20.0.0/16'
    #      IP-range: '172.20.10.0/24'
    #      Gateway: '172.20.10.11'
    #    ...
  callback!

<-! (callback) !->
  if app-net?
    console.log 'App network already exists'
    callback!
    return
  console.log 'Creating app network'
  err, app-net <-! docker.create-network do
    Name: \app-net
    Driver: \bridge
    #IPAM:
    #  Config:
    #    * Subnet: '172.20.0.0/16'
    #      IP-range: '172.20.10.0/24'
    #      Gateway: '172.20.10.11'
    #    ...
  callback!


# Create server
console.log 'Initializing server'

app.enable 'trust proxy'

app.use express.static \www

app.set \views \www
app.set 'view engine' \pug

app.get \/ (req, res) !->
  res.render \index

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
    ..start!

  socket.on \disconnect !-> emitter.stop!

  socket.on \echo !-> socket.emit \echo it

app.use proxy \/broker do
  target: \http://localhost:7999
  ws: true
  path-rewrite:
    '^/broker': '/'

app.post '/get-broker-status' (req, res) !->
  broker <-! get-broker
  err, data <-! broker.inspect
  res.end data.State?.Status

app.post '/toggle-broker-status' (req, res) !->
  broker <-! get-broker
  err, data <-! broker.inspect
  if data.State.Status is \created or data.State.Status is \exited
    err, data <-! broker.start PortBindings: '7999/tcp': [ HostPort: \7999 ]
    err, data <-! broker.inspect
    res.end data.State.Status
  else
    err, data <-! broker.stop
    err, data <-! broker.inspect
    res.end data.State.Status

app.post '/list-containers' (req, res) !->
  err, containers <-! docker.list-containers all: req.body.all
  containers |> JSON.stringify |> res.end

app.post '/list-images' (req, res) !->
  err, images <-! docker.list-images
  images |> JSON.stringify |> res.end

app.post '/list-store' (req, res) !->
  (error, response, body) <-! request "https://#registry-url/v2/_catalog"
  if error
    error |> JSON.stringify |> res.end
    return
  res.end body

app.post '/pull-app' (req, res) !->
  name = req.body.name
  tag  = req.body.tag or \latest
  err, stream <-! docker.pull "#registry-url/#name:#tag"
  stream.pipe res

repo-tag-to-name = (.match /\/.+(?=:)/ .[0])

launch-container = (repo-tag, callback) !->
  # Pull to install or for updates first
  err, stream <-! docker.pull repo-tag
  err, output <-! docker.modem.follow-progress stream
  # TODO: Handle potential namespace collisions
  name = repo-tag |> repo-tag-to-name
  err, container <-! docker.create-container Image: repo-tag, name: name
  err, data <-! container.inspect

  type = data.Config.Labels[\databox.type]

  config =
    NetworkMode: if type is \driver then \driver-net else \app-net
    #Binds: [ "#__dirname/apps/#name:/./:rw" ]

  # Abort if container tried to expose more than just port 8080
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

  err, data <-! container.start config
  err, data <-! container.inspect
  port = parse-int data.NetworkSettings.Ports['8080/tcp'][0].HostPort

  proxy-container name, port
  # TODO: Error handling
  callback { name , port }

app.post '/launch-container' (req, res) !->
  response <-! launch-container req.body.repo-tag
  response |> JSON.stringify |> res.send

server.listen (process.env.PORT or 8080)
