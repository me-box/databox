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

app = express!
server = http.create-server app
io = io server

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

app.post '/launch-app' (req, res) !->
  # TODO: Handle potential namespace collisions
  name = req.body.repo-tag.match /\/.+(?=:)/ .[0]
  err, port <-! portfinder.get-port
  err, container <-! docker.create-container Image: req.body.repo-tag, name: name
  err, data <-! container.start Links: [ \broker ], PortBindings: '8080/tcp': [ HostPort: "#port" ] #Binds: [ "#__dirname/apps/#name:/./:rw" ]
  app.use proxy name, do
    target: "http://localhost:#port"
    ws: true
    path-rewrite:
      "^#name": '/'
    on-proxy-res: !->
      it.headers['Access-Control-Allow-Origin'] = \*
      it.headers['Access-Control-Allow-Headers'] = 'X-Requested-With'
  { name, port } |> JSON.stringify |> res.end

app.post '/400' (req, res) !->
  res.write-head 400
  res.end!

server.listen (process.env.PORT or 8080)
