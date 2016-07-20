FROM mhart/alpine-node:base-4.4.7
MAINTAINER ioannis.koutras@gmail.com

ADD . .

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
