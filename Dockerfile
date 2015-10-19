FROM mhart/alpine-node:base-4.2.1
MAINTAINER ioannis.koutras@gmail.com

ADD . .

EXPOSE 3000
CMD ["node", "app.js"]
