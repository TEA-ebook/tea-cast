#!/bin/bash
sed \
  -e 's/^\(rlimit\)/#\1/g' \
  -i /etc/avahi/avahi-daemon.conf
rm -rf /run/avahi-daemon/{pid,socket}
exec avahi-daemon --no-rlimits
