#!/usr/bin/env lsc

require! [ request, byline ]

const samples = 1000

count = 0

byline request.post "http://localhost:8080/databox-driver-mobile/api/#{process.argv[2]}"
  ..on \data !->
    process.exit! if count >= samples
    console.log "#{count++},#{process.argv[2]},#{Date.now!},#{it.to-string!}"
