#!/bin/sh

echo "Starting ClamAV daemon..."
clamd &

# Wait for ClamAV to be fully up
while ! ps aux | grep '[c]lamd' > /dev/null; do
    echo "Waiting for clamd..."
    sleep 2
done

echo "ClamAV is running! Starting application..."
exec pm2-dev ecosystem.config.yml
