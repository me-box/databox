require! {
  './container-manager.ls': con-man
  './server.ls'
}

const server-port  = process.env.PORT or 8080

console.log 'Establishing communication with Docker daemon'
con-man.connect!
  .then ->
    # Kill any already running Databox containers
    console.log 'Killing any already running Databox containers'
    con-man.kill-all!
  .then ->
    # Create networks if they do not already exist
    console.log 'Checking driver and app networks'
    con-man.init-networks!
  .then ->
    # Launch Arbiter
    console.log 'Launching Arbiter container'
    con-man.launch-arbiter!
  .then (info) ->
    console.log 'Setting up proxy to Arbiter'
    server.proxy-container info.name, info.port
  .then ->
    # Launch server
    console.log 'Launching server'
    server.launch server-port, con-man
  .then ->
    console.log 'Done'
  .catch !-> throw new Error it

/*
# Clean up on exit
clean-up = !->
  console.log 'Cleaning up'
  # TODO: Find a way to do this
  # con-man.kill-all ->

process
  ..on \exit clean-up
  ..on \SIGINT clean-up
  #..on \uncaughtException !->
*/
