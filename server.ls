require! {
  http
  dockerode: Docker
  express
  'body-parser'
  request
  fs
  portfinder
  \socket.io : io
  \docker-events : DockerEvents
  \http-proxy-middleware : proxy
}

const registry-url = 'amar.io:5000'

docker = new Docker!

app = express!
server = http.create-server app
io = io server

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

proxy-container = (name, port) !->
  app.use proxy name, do
    target: "http://localhost:#port"
    ws: true
    path-rewrite:
      "^#name": '/'
    on-proxy-res: !->
      it.headers['Access-Control-Allow-Origin'] = \*
      it.headers['Access-Control-Allow-Headers'] = 'X-Requested-With'

# Proxy already running apps and drivers
err, containers <-! docker.list-containers  all: true
containers.for-each (container) !->
  return unless \databox.type of container.Labels
  type = container.Labels[\databox.type]
  return unless type is \driver or type is \app
  # TODO: Error handling
  proxy-container container.Names[0], container.Ports[0].PublicPort

err, driver-net <-! docker.create-network do
  Name: \driver-net
  Driver: \bridge
  IPAM:
    Config:
      * Subnet: '172.20.0.0/16'
        IP-range: '172.20.10.0/24'
        Gateway: '172.20.10.11'
      ...

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
  # TODO: Handle potential namespace collisions
  name = repo-tag |> repo-tag-to-name
  err, port <-! portfinder.get-port
  err, container <-! docker.create-container Image: repo-tag, name: name
  err, data <-! container.inspect
  type = data.Config.Labels[\databox.type]
  err, data <-! container.start do
    PortBindings: '8080/tcp': [ HostPort: "#port" ]
    NetworkMode: if type is \driver then \driver-net else \app-net
    #Binds: [ "#__dirname/apps/#name:/./:rw" ]
  proxy-container name, port
  # TODO: Error handling
  callback { name, port }

app.post '/launch-container' (req, res) !->
  info <-! launch-container req.body.repo-tag
  info |> JSON.stringify |> res.send

server.listen (process.env.PORT or 8080)
