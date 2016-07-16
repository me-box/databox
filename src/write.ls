require! mongodb

const PORT = process.env.PORT or 27017

err, db <-! mongodb.MongoClient.connect "mongodb://localhost:#PORT/store"
throw err if err?

#rand = -> Math.floor Math.random! * max

count = 0

write = ->
  <-! db.collection \entries .insert-one value: 12345, {}
  process.send 1
  write!# if ++count < 100

write!
