# rod-catch-returns-frontend

[![Build Status](https://github.com/defra/rod-catch-returns-frontend/workflows/build/badge.svg)](https://github.com/defra/rod-catch-returns-frontend/actions)
[![Maintainability](https://api.codeclimate.com/v1/badges/ab06e6ad0035b726aed5/maintainability)](https://codeclimate.com/github/DEFRA/rod-catch-returns-frontend/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/ab06e6ad0035b726aed5/test_coverage)](https://codeclimate.com/github/DEFRA/rod-catch-returns-frontend/test_coverage)

When you purchase a migratory salmon and sea trout rod licence, you are legally required to submit a catch return, which is a log of the fish caught that season. Users are sent a paper copy of the catch return form with their licence, and also directed towards the catch return website.

Users are asked to submit details of the fish they caught (species, weight, number etc) and where they caught them.

## To build

Version 22 or above of Node.js is required to run the service.

```
npm install
```

If you need to run a local version of REDIS you can do so using docker. Ensure you have the appropriate docker version installed for your architecture and type;

```
docker-compose up -d
```

## Environment file

The service will require a `.env` file in the root directory. This can be obtained from the rod-catch-returns-env-vars repo in GitLab.

## To Run

```
npm start && open http://localhost:3000
```

For automated testing, to force the user to choose this or the previous year run with the --force-year-choose argument

```
node index.js --force-year-choose
```

### Virus Scanner

The file uploader may use the ClamAV daemon if it is available.

See https://www.clamav.net/ for details

In order to installer the scanner type:

`sudo apt-get install clamav`

Install the daemon

`sudo apt-get install clamav-daemon`

The daemon can be started and stopped as follows
`sudo systemctl start clamav-daemon`
`sudo systemctl stop clamav-daemon`

Check that the daemon is running

`ps ax | grep [c]lamd`

And the version

`clamdscan --version`

The configuration for the daemon can be found here

`/etc/clamav/clamd.conf`

Find the LocalSocket file and use to set the clam variables - if these are not set then clam will run in local binary mode. There is no fallback

```
CLAMD_SOCK=/var/run/clamav/clamd.ctl
CLAMD_PORT=3310
```

Note: the program creates a ./temp directory on startup for the temporary storage of uploaded files before passing them to the API. Please ensure the clamd user can read, write and execute on that directory.

`chmod 777 ./temp`

When running locally the daemon will not be able to read files in the user area. In this case the location temporary directory can be moved by setting TEMP_DIR. It may also be necessary to disable AppArmor - see https://help.ubuntu.com/lts/serverguide/apparmor.html

## Installing clamav on a mac

It is difficult to build from source; the homebrew process is outlined here: https://gist.github.com/zhurui1008/4fdc875e557014c3a34e

1. Install from brew

`brew install clamav`

OR

`brew upgrade clamav `

2. Configure

`cd /usr/local/etc/clamav`

Edit /usr/local/etc/clamav/freshclam.conf

- Remove or comment the ‘Example’ line
- Note the database location: DatabaseDirectory /var/lib/clamav – make sure it exists (ls -ld /var/lib/clamav)

3. Download the virus database

- /usr/local/Cellar/clamav/0.102.4/bin/freshclam

4. Configure the daemon

- cp clamd.conf.sample clamd.conf
- Remove or comment the ‘Example’ line
- Set the database location as above
- Set the socket location; LocalSocket /usr/local/var/run/clamav/clamd.sock
- Make sure the directory exists: mkdir -p /usr/local/var/run/clamav

5. Run the clam daemon

- /usr/local/sbin/clamd
- Go to the activity monitor and make sure its running.

6. Configure RCR

- The the .env file ensure you have the following:

```
CLAMD_SOCK=/usr/local/var/run/clamav/clamd.sock
CLAMD_PORT=3310
TEMP_DIR=/tmp
```

7. Test it

Fire up RCR in admin mode – a console log should print indicating it has found clam via the socket
Log in using admin1@example.com/admin
Go to file uploads and load test/files/age-weigth-key (valid).csv

## Lab Tests

1. Run RCR API in 'standard' mode (i.e. not with in memory database)
2. Ensure you have the .env file pointing at your local env (`API_HOSTNAME=localhost`) and set to run in admin mode (`CONTEXT=FMT`)
3. Start the frontend (`npm start`)
4. Run the tests (`npm run test:lab`)
