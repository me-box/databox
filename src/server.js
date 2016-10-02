
var Config = require('./config.json');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var io = require('socket.io');
var proxy = require('http-proxy-middleware');

var app = express();




exports.launch = function (port, conman) { 
    server = http.createServer(app);
    installingApps = [];
    //io = io(app);
    
    app.enable('trust proxy');
    app.set('views', 'src/www');
    app.set('view engine','pug');
    app.use(express.static('src/www'));
    app.use(bodyParser.urlencoded({extended: false}));

    app.get('/',(req,res) => { res.render('index') });
    app.get('/slayer',(req,res) => { res.render('slayer') });
    app.get('/close',(req,res) => { res.render('close') });

    app.get('/list-containers',(req,res) => { 
        conman.listContainers()
        .then( (containers) => {

            //TODO: deal with installing containers

            res.end(JSON.stringify(containers));
        })
        //.catch()
    });

    app.get('/list-images',(req,res) => { 
        conman.listImages()
        .then( (images) => {            
            res.end(JSON.stringify(images));
        })
        //.catch()
    });

    app.get('/list-store',(req,res) => { 
        res.end(JSON.stringify("ERROR: NOT IMPLIMENTED YET!!"));
    });


    app.post('/pull-app', (req,res) => {
        name = req.body.name
        tag  = req.body.tag
        conman.pullImage(Config.registryUrl +  name + ':' + tag)
        .then((err, data) => {
            if(err) {
                return;
            }
            stream.pipe(data)
        })
    });


    app.post('/install', (req,res) => {
        res.end(JSON.stringify("ERROR: NOT IMPLIMENTED YET!!"));
    });

    app.post('/restart', (req,res) => {
        name = req.body.name || req.body.id
        conman.getContainer(req.body.id)
        .then( (container) => {
            console.log("Restarting " + container.Name);
            container.stop((err,data) => {
                
                if(err) {
                    res.send(JSON.stringify(err))
                    return
                }
                console.log("Stoped " + container.Name);

                container.start((err,data) => {
                    if(err) {
                        res.send(JSON.stringify(err))
                        return
                    }
                    console.log("Restarted " + container.Name);
                    res.send(JSON.stringify(data))
                })
            })
        }) 
    });

    app.post('/uninstall', (req,res) => {
        name = req.body.name || req.body.id
        conman.getContainer(req.body.id)
        .then( (container) => {
            console.log("Uninstalling " + container.Name);
            container.stop((err,data) => {
                
                if(err) {
                    res.send(JSON.stringify(err))
                    return
                }
                console.log("Stoped " + container.Name);

                container.remove((err,data) => {
                    if(err) {
                        res.send(JSON.stringify(err))
                        return
                    }
                    console.log("Removed " + container.Name);
                    res.send(JSON.stringify(data))
                })
            })
        }) 
    });

    io.on('connection',(socket)=>{

        conman.getDockerEmitter();

    //TODO: NOT SURE HOW TO DO THIS IN JS YET

    /*con-man.get-docker-emitter!
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

    socket.on \echo !-> socket.emit \echo it*/
        
    })
    server.listen(port);
}

