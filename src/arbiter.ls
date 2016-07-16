require! {
  fs
  readline
  child_process
  request
  \stats-lite
  './container-manager.ls': con-man
}

const server-port = process.env.PORT or 8080

run-test = do ->
  out = fs.create-write-stream 'data/arbiter.csv'
    ..write 'timestamp,stores\n'

  (store-count, store-count-max) ->
    resolve, reject <-! new Promise!
    if store-count >= store-count-max
      resolve!
      return

    launch-store = "databox-store-sqlite3-#store-count"
      |> -> con-man.launch-container 'amar.io:5000/databox-store-sqlite3:latest',  it, [ "HOSTNAME=#it" ]

    launch-store
      .then (info) !-> out.write "#{new Date!},#{store-count + 1}\n"
      .then -> run-test ++store-count, store-count-max
      .then resolve
      .catch reject

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
  .then (result) ->
    # TODO: Reject and catch
    throw new Error result.err if result.err?
    <-! set-timeout _, 1000
    run-test 0 100
  .then ->
    console.log 'Done'
  .catch !-> console.log it
