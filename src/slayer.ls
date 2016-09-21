require! {
  http
  express
  'body-parser'
  request
  \socket.io : io
  \http-proxy-middleware : proxy
}

app = express!

const port = process.env.PORT or 8080
export proxy-container = (name, port) !->
  app.use proxy "/#name" do
    target: "http://localhost:#port"
    ws: true
    path-rewrite:
      "^/#name": '/'
    on-proxy-res: !->
      it.headers['Access-Control-Allow-Origin'] = \*
      it.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Content-Length, X-Requested-With'
      it.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'

server = http.create-server app
io := io server

app
  ..enable 'trust proxy'
  ..set \views \src/www
  ..set 'view engine' \pug
  ..use express.static \src/www
  # FIXME: Using this before proxy is the reason POSTs break -- bad design! See: http://stackoverflow.com/questions/25207333/socket-hang-up-error-with-nodejs/25651651#25651651
  ..use body-parser.urlencoded extended: false

  ..get \/ (req, res) !->
    res.render \index

  ..get \/slayer (req, res) !->
    res.render \slayer

  ..get \/close (req, res) !->
    res.render \close

  ..post '/list-images' (req, res) !->
    err, images <-! con-man.get-docker!.list-images filters: '{ "label": [ "databox.type" ] }'
    images |> JSON.stringify |> res.end

io.on \connection (socket) !->
  # TODO: Error handling
  con-man.get-docker-emitter!
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

    socket.on \disconnect !-> ..stop!

  socket.on \echo !-> socket.emit \echo it

server.listen port
