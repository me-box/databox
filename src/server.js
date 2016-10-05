var Promise = require('promise');
var Config = require('./config.json');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var io = require('socket.io');
var proxy = require('http-proxy-middleware');

var app = express();


exports.proxyContainer = function (name, port) {
    return new Promise( (resolve, reject) =>  {

        var onProxyRes = function(proxyRes, req, res) {
            console.log(proxyRes, req, res);
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Content-Length, X-Requested-With';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
        };

        var p = proxy("/"+name, {logLevel: 'debug', target: "http://localhost:" + port, ws: true, pathRewrite:{ ["^/"+name]: '/'}, proxyRes: onProxyRes });

        app.use(p);
        resolve();
    });
};


exports.launch = function (port, conman) {
    server = http.createServer(app);
    installingApps = [];
    io = io(server);

    app.enable('trust proxy');
    app.set('views', 'src/www');
    app.set('view engine','pug');
    app.use(express.static('src/www'));

    app.use(bodyParser.urlencoded({extended: false}));

    app.get('/',(req,res) => { res.render('index') });
	app.get('/slayer',(req,res) => { res.render('slayer') });

	app.get('/manifest', (req, res) => {
		request.post({'url': Config.storeUrl + '/app/get/', 'form': {'name': req.query.name}}, (err, data) => {
			if (err) {
				//do nothing
				return;
			}

			res.json(JSON.parse(data.body));
		});
	});

    app.get('/list-containers',(req,res) => {
        conman.listContainers()
        .then( (containers) => {
            for(appName of installingApps) {
              found = false;
              for(app of containers) {
                if(app.Names.indexOf(appName) != -1){
                  found = true;
                }
              }
              if(!found){
                containers.push({Names:[appName], State: "installing"});
              }
            }
            res.json(containers);
        });
        //.catch()
    });

    app.get('/list-store',(req,res) => {
        request('https://' + Config.registryUrl + '/v2/_catalog', (error,response,body) => {
           if(error) {
                res.json(error);
                return
            }
            var repositories = JSON.parse(body).repositories;
            var repocount = repositories.length;
            var manifests = [];

            repositories.map((repo) => {
                request.post( {'url':Config.storeUrl+'/app/get/', 'form':{'name':repo}}, (err,data) => {

                    if(err) {
                        //do nothing
                        return ;
                    }

                    body = JSON.parse(data.body);
                    if( typeof body.error == 'undefined' || body.error != 23) {
                        manifests.push(body);
                    }
                    repocount--;
                    if(repocount <= 0) {
                        res.json(manifests);
                    }
                });
            });

        });
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
        var sla = JSON.parse(req.body.sla);
        var name = sla.name;
        console.log(JSON.stringify(installingApps));
        repoTag =  '/' + name;
        installingApps.push("/"+name);

        io.emit('docker-create',repoTag);
        conman.launchContainer(repoTag)
          .then((info) => {
            var index = installingApps.indexOf('/'+name)
            if(index != -1) {
              installingApps.splice(index, 1)
            }
            proxyContainer(info.name, info.port);
            res.json(info);
          });
    });

    app.post('/restart', (req,res) => {
        name = req.body.name || req.body.id
        console.log("Restarting " + req.body.id);
        conman.getContainer(req.body.id)
        .then( (container) => {
            console.log("Restarting " + container.id);
            container.stop((err,data) => {

                if(err && err['statusCode'] != 304) {
                    res.json(err)
                    return
                }
                console.log("Stoped " + container.id);

                container.start((err,data) => {
                    if(err) {
                        res.json(err);
                        return;
                    }
                    console.log("Restarted " + container.id);
                    res.json(data)
                })
            })
        })
    });

    app.post('/uninstall', (req,res) => {
        name = req.body.name || req.body.id
        conman.getContainer(req.body.id)
        .then( (container) => {
            console.log("Uninstalling " + container.id);
            container.stop((err,data) => {

                if(err && err['statusCode'] != 304) {
                    res.json(err);
                    return;
                }
                console.log("Stoped " + container.id);

                container.remove((err,data) => {
                    if(err) {
                        res.json(err);
                        return;
                    }
                    console.log("Removed " + container.id);
                    res.json(data);
                })
            })
        })
    });

    io.on('connection',(socket)=>{

        var emitter = conman.getDockerEmitter();

        emitter.on("connect", function() {
          socket.emit('docker-connect');
        });
        emitter.on("disconnect", function() {
          socket.emit('docker-disconnect');
        });
        emitter.on("_message", function(message) {
          socket.emit('docker-_message',message);
        });
        emitter.on("create", function(message) {
          socket.emit('docker-create',message);
        });
        emitter.on("start", function(message) {
          socket.emit('docker-star',message);
        });
        emitter.on("start", function(message) {
          socket.emit('docker-stop',message);
        });
        emitter.on("die", function(message) {
          socket.emit('docker-die',message);
        });
        emitter.on("destroy", function(message) {
          socket.emit('docker-destroy',message);
        });
        emitter.start();

    })

    server.listen(port);
}

