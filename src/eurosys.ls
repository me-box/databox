#!/usr/bin/env lsc

require! [ request, byline ]

byline request.post "http://localhost:8080/databox-driver-mobile/api/#{process.argv[2]}"
  ..on \data !-> console.log process.argv[2] + \, + Date.now! + \, + it.to-string!
