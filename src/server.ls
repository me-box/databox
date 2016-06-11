require! {
  http
  express
  'body-parser'
  request
  \socket.io : io
  \http-proxy-middleware : proxy
}

app = express!

export proxy-container = (name, port) !->
  app.use proxy name, do
    target: "http://localhost:#port"
    ws: true
    path-rewrite:
      "^#name": ''
    on-proxy-res: !->
      it.headers['Access-Control-Allow-Origin'] = \*
      it.headers['Access-Control-Allow-Headers'] = 'X-Requested-With'

export launch = (port, con-man) !->
  server = http.create-server app
  io := io server

  app
    ..enable 'trust proxy'
    ..set \views \src/www
    ..set 'view engine' \pug
    ..use express.static \src/www
    ..use body-parser.urlencoded extended: false

    ..get \/ (req, res) !->
      res.render \index

    ..get \/close (req, res) !->
      res.render \close

    ..post '/list-containers' (req, res) !->
      err, containers <-! con-man.get-docker!.list-containers all: req.body.all, filters: '{ "label": [ "databox.type" ] }'
      containers |> JSON.stringify |> res.end

    ..post '/list-images' (req, res) !->
      err, images <-! con-man.get-docker!.list-images filters: '{ "label": [ "databox.type" ] }'
      images |> JSON.stringify |> res.end

    ..post '/list-store' (req, res) !->
      (error, response, body) <-! request "https://#{con-man.registry-url}/v2/_catalog"
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

    ..post '/pull-app' (req, res) !->
      name = req.body.name
      tag  = req.body.tag or \latest
      err, stream <-! con-man.get-docker!.pull "#{con-man.registry-url}/#name:#tag"
      stream.pipe res

    ..post '/launch-container' (req, res) !->
      con-man.launch-container req.body.repo-tag
        .then (info) !->
          proxy-container info.name, info.port
          info |> JSON.stringify |> res.send

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
