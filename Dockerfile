FROM node:latest

ADD ./package.json /package.json
RUN npm install --production

ADD ./src /src
RUN mkdir /slaStore && mkdir /certs

VOLUME ["/slaStore","/certs"]

LABEL databox.type="container-manager"

EXPOSE 8989

CMD ["npm", "start"]
