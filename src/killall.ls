require! {
  './container-manager.ls': con-man
}

const server-port = process.env.PORT or 8080

con-man.connect!
  .then ->
    # Kill any already running Databox containers
    console.log 'Killing any already running Databox containers'
    con-man.kill-all!