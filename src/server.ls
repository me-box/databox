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
  app.use proxy "/#name" do
    target: "http://localhost:#port"
    ws: true
    path-rewrite:
      "^/#name": '/'
    on-proxy-res: !->
      it.headers['Access-Control-Allow-Origin'] = \*
      it.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Content-Length, X-Requested-With'
      it.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'

export launch = (port, con-man) !->
  server = http.create-server app
  installingApps = []
  io := io server

  app
    ..enable 'trust proxy'
    ..set \views \src/www
    ..set 'view engine' \pug
    ..use express.static \src/www
    # FIXME: Using this before proxy is the reason POSTs break -- bad design! See: http://stackoverflow.com/questions/25207333/socket-hang-up-error-with-nodejs/25651651#25651651
    ..use body-parser.urlencoded extended: false

    ..get '/' (req, res) !->
      res.render \index

    ..get '/slayer' (req, res) !->
      res.render \slayer

    ..get '/close' (req, res) !->
      res.render \close

    ..get '/list-containers' (req, res) !->
      err, containers <-! con-man.get-docker!.list-containers all: true, filters: '{ "label": [ "databox.type" ] }'
      for appName in installingApps
        found = false
        for app in containers
          if app.Names.indexOf(appName) != -1
            found = true
        if !found
          containers.push({Names:[appName], Status: "Installing"})
      containers |> JSON.stringify |> res.end

    ..get '/list-images' (req, res) !->
      err, images <-! con-man.get-docker!.list-images filters: '{ "label": [ "databox.type" ] }'
      images |> JSON.stringify |> res.end

    ..get '/list-store' (req, res) !->
      (error, response, body) <-! request "https://#{con-man.registry-url}/v2/_catalog"
      if error
        error |> JSON.stringify |> res.end
        return

      repositories = body |> JSON.parse |> (.repositories)
      repo-count = repositories.length

      manifests = []

      repositories.for-each (repository) !->
        error, response, body <-! request.post do
          url: "http://store.upintheclouds.org/app/get/"
          form: name: repository

        # TODO: Notify if app server is down

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

    ..post '/install' (req, res) !->
      sla = JSON.parse(req.body.sla)
      name = sla.name
      console.log(JSON.stringify(installingApps))
      repo-tag = "#{con-man.registry-url}/#name:latest"
      installingApps.push("/"+name)
      io.emit \docker-create repo-tag
      con-man.launch-container repo-tag
        .then (info) !->
          index = installingApps.indexOf("/"+name)
          if index != -1
            delete installingApps[index]
          console.log("Installing: " + JSON.stringify(installingApps))
          proxy-container info.name, info.port
          info |> JSON.stringify |> res.send

    ..post '/restart' (req, res) !->
      name = req.body.name || req.body.id
      container = con-man.get-docker!.get-container req.body.id
      console.log "Stopping #name"
      err, data <-! container.stop
      console.log "Starting #name"
      err, data <-! container.start
      data |> JSON.stringify |> res.send

    ..post '/uninstall' (req, res) !->
      name = req.body.name || req.body.id
      container = con-man.get-docker!.get-container req.body.id
      console.log "Stopping #name"
      err, data <-! container.stop
      console.log "Removing #name"
      err, data <-! container.remove
      data |> JSON.stringify |> res.send

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
