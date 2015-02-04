FROM zaha/pyserv

MAINTAINER Davo d@davo.io

ENV TERM dumb

RUN apt-get install -qy ffmpeg

## add launcher and set execute property
ADD scripts /scripts
RUN chmod +x /scripts/launch.sh

# Replace daemon to be run by runit.
RUN rm /etc/service/flask/run && ln -s /scripts/launch.sh /etc/service/flask/run

RUN pip install -r /scripts/requirements.txt

EXPOSE 5000

VOLUME ["/src"]
WORKDIR /src

# Use baseimage-docker's init system.
CMD ["/sbin/my_init"]

