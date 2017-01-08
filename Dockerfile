#FROM node:argon
FROM node:alpine

#RUN apk update && apk add ca-certificates wget unzip

#RUN wget https://github.com/me-box/databox-container-manager/archive/Hypercat.zip && unzip Hypercat.zip -d /

#WORKDIR /databox-container-manager-Hypercat

#RUN npm install --production

#RUN apk del ca-certificates wget unzip && rm -rf /etc/apk/cache
ADD ./src /src
ADD ./package.json /package.json
RUN mkdir /slaStore && mkdir /certs
RUN npm install --production

VOLUME ["/slaStore","/certs"]

LABEL databox.type="container-manager"

EXPOSE 8989

CMD ["sh"]
