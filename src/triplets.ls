require! {
  fs
  readline
  request
  \stats-lite
  './container-manager.ls': con-man
}

const server-port = process.env.PORT or 8080

running-containers = []

aggregate-stats = do
  gather-stat = (info) ->
    resolve, reject <-! new Promise!

    result <- con-man.get-container-stats-stream info.name .then

    data = []

    rl = readline.create-interface input: result.stream
      ..on \line !->
        it = JSON.parse it

        # Sum across all network interfaces
        rx-sum = 0
        tx-sum = 0
        for name, network of it.networks
          rx-sum += network.rx_bytes
          tx-sum += network.tx_bytes

        row =
          time: it.read
          name: info.name
          type: info.type
          rx:   rx-sum
          tx:   tx-sum
          mem:  it.memory_stats.usage

        cpu-delta = it.cpu_stats.cpu_usage.total_usage - it.precpu_stats.cpu_usage.total_usage
        system-delta = it.cpu_stats.system_cpu_usage - it.precpu_stats.system_cpu_usage
        row.cpu = (cpu-delta / system-delta) * it.cpu_stats.cpu_usage.percpu_usage.length

        data.push row

        if data.length > 10
          rl.close!
          delete data.time
          resolve data

  ->
    resolve, reject <-! new Promise!
    console.log 'Aggregating stats'

    gather-stats =
      running-containers
      |> (.map gather-stat)
      |> Promise.all

    gather-stats
      .then (stats) -> [].concat.apply [] stats
      .then resolve
      .catch reject

run-test = do ->
  out = fs.create-write-stream 'data/triplets.csv'
    ..write 'triplets,name,type,rx,tx,mem,cpu\n'

  (triplet-count, triplet-count-max) ->
    resolve, reject <-! new Promise!
    if triplet-count >= triplet-count-max
      resolve!
      return

    running-containers
      ..push name: "databox-store-mock-#triplet-count"  type: \store
      ..push name: "databox-driver-mock-#triplet-count" type: \driver
      ..push name: "databox-app-mock-#triplet-count"    type: \app

    launch-store  = "databox-store-mock-#triplet-count"
      |> -> con-man.launch-container 'amar.io:5000/databox-store-mock:latest',  it, [ "HOSTNAME=#it" ]

    <-! launch-store.then

    launch-driver = "databox-driver-mock-#triplet-count"
      |> -> con-man.launch-container 'amar.io:5000/databox-driver-mock:latest', it, [ "HOSTNAME=#it" ]

    launch-app    = "databox-app-mock-#triplet-count"
      |> -> con-man.launch-container 'amar.io:5000/databox-app-mock:latest',    it, [ "HOSTNAME=#it" ]

    Promise.all [ launch-driver, launch-app ]
      .then -> aggregate-stats!
      .then (stats) ->
        for stat in stats
          out.write "#{triplet-count + 1},#{stat.name},#{stat.type},#{stat.rx},#{stat.tx},#{stat.mem},#{stat.cpu}\n"
      .then -> run-test ++triplet-count, triplet-count-max
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
    running-containers.push name: \arbiter type: \arbiter
    con-man.launch-arbiter!
  .then (result) ->
    # TODO: Reject and catch
    throw new Error result.err if result.err?
    run-test 0 100
  .then ->
    console.log 'Done'
  .catch !-> console.log it

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
