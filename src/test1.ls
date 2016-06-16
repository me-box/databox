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
  gather-stat = (name) ->
    resolve, reject <-! new Promise!

    result <- con-man.get-container-stats-stream name .then

    data = {}

    rl = readline.create-interface input: result.stream
      ..on \line !->
        it = JSON.parse it

        # Sum across all network interfaces
        rx-sum = 0
        tx-sum = 0
        for name, network of it.networks
          rx-sum += network.rx_bytes
          tx-sum += network.tx_bytes

        data
          ..[]time.push it.read
          ..[]rx.push   rx-sum
          ..[]tx.push   tx-sum
          ..[]mem.push  it.memory_stats.usage

        cpu-delta = it.cpu_stats.cpu_usage.total_usage - it.precpu_stats.cpu_usage.total_usage
        system-delta = it.cpu_stats.system_cpu_usage - it.precpu_stats.system_cpu_usage
        data.[]cpu.push (cpu-delta / system-delta) * it.cpu_stats.cpu_usage.percpu_usage.length

        if data.time.length > 10
          rl.close!
          delete data.time
          data
            ..rx  = stats-lite.median ..rx
            ..tx  = stats-lite.median ..tx
            ..mem = stats-lite.median ..mem
            ..cpu = stats-lite.median ..cpu
          resolve data

  ->
    resolve, reject <-! new Promise!
    console.log 'Aggregating stats'

    gather-stats =
      running-containers
      |> (.map gather-stat)
      |> Promise.all

    gather-stats
      .then (stats) ->
        arbiter-stats = stats.shift!
        driver-stats  = stats.shift!
        arbiter-rx:  arbiter-stats.rx
        arbiter-tx:  arbiter-stats.tx
        arbiter-mem: arbiter-stats.mem
        arbiter-cpu: arbiter-stats.cpu
        driver-rx:   driver-stats.rx
        driver-tx:   driver-stats.tx
        driver-mem:  driver-stats.mem
        driver-cpu:  driver-stats.cpu
        stores-rx:   stats-lite.sum  stats.map -> it.rx
        stores-tx:   stats-lite.sum  stats.map -> it.tx
        stores-mem:  stats-lite.sum  stats.map -> it.mem
        stores-cpu:  stats-lite.mean stats.map -> it.cpu
      .then resolve
      .catch reject

trigger-scan = (driver-port) ->
  resolve, reject <-! new Promise!
  console.log 'Triggering mock driver store scan'
  # TODO: Remove dirty hack to wait for the store to set up
  <-! set-timeout _, 2000
  err, res, body <-! request "http://localhost:#driver-port/scan"
  if err?
    reject err
    return
  resolve body

run-test = do ->
  out = fs.create-write-stream 'data/test-1.csv'
    ..write 'Stores, Arbiter RX, Arbiter TX, Arbiter Mem, Arbiter CPU, Driver RX, Driver TX, Driver Mem, Driver CPU, Store Sum RX, Store Sum TX, Store Sum Mem, Store Mean CPU\n'

  (store-count, store-count-max, driver-port) ->
    resolve, reject <-! new Promise!
    if store-count >= store-count-max
      resolve!
      return

    running-containers.push "databox-store-mock-#store-count"
    launch-store = "databox-store-mock-#store-count"
      |> -> con-man.launch-container 'amar.io:5000/databox-store-mock:latest', it, [ "HOSTNAME=#it" ]

    launch-store
      .then -> trigger-scan driver-port
      .then -> aggregate-stats!
      .then (stats) ->
        out.write "#{store-count + 1}, #{stats.arbiter-rx}, #{stats.arbiter-tx}, #{stats.arbiter-mem}, #{stats.arbiter-cpu}, #{stats.driver-rx}, #{stats.driver-tx}, #{stats.driver-mem}, #{stats.driver-cpu}, #{stats.stores-rx}, #{stats.stores-tx}, #{stats.stores-mem}, #{stats.stores-cpu}\n"
      .then -> run-test ++store-count, store-count-max, driver-port
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
    running-containers.push \arbiter
    con-man.launch-arbiter!
  .then ->
    # Launch mock driver
    console.log 'Launching mock driver'
    running-containers.push \databox-driver-mock
    con-man.launch-container 'amar.io:5000/databox-driver-mock:latest'
  .then (result) ->
    # TODO: Reject and catch
    throw new Error result.err if result.err?
    run-test 0 100 result.port
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
