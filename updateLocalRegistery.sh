docker pull toshdatabox/databox-arbiter && docker tag toshdatabox/databox-arbiter databox.registry:5000/databox-arbiter && docker push databox.registry:5000/databox-arbiter
docker pull toshdatabox/databox-app-server && docker tag toshdatabox/databox-app-server databox.registry:5000/databox-app-server && docker push databox.registry:5000/databox-app-server
docker pull toshdatabox/databox-store-blob && docker tag toshdatabox/databox-store-blob databox.registry:5000/databox-store-blob && docker push databox.registry:5000/databox-store-blob
docker pull toshdatabox/databox-driver-twitter-stream && docker tag toshdatabox/databox-driver-twitter-stream databox.registry:5000/databox-driver-twitter-stream && docker push databox.registry:5000/databox-driver-twitter-stream
