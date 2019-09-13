# rod-catch-returns-frontend

[![Build Status](https://travis-ci.org/DEFRA/rod-catch-returns-frontend.svg?branch=master)](https://travis-ci.org/DEFRA/rod-catch-returns-frontend)
[![Maintainability](https://api.codeclimate.com/v1/badges/ab06e6ad0035b726aed5/maintainability)](https://codeclimate.com/github/DEFRA/rod-catch-returns-frontend/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/ab06e6ad0035b726aed5/test_coverage)](https://codeclimate.com/github/DEFRA/rod-catch-returns-frontend/test_coverage)

When you purchase a migratory salmon and sea trout rod licence, you are legally required to submit a catch return, which is a log of the fish caught that season. Users are sent a paper copy of the catch return form with their licence, and also directed towards the catch return website.

Users are asked to submit details of the fish they caught (species, weight, number etc) and where they caught them.

## To build
Vresion 8.9.1 or above of Node.js is required to run the service 
```
npm install
npm run build
```

If you need to run a local version of REDIS you can do so using docker. Ensure you have the appropriate docker version installed for your architecture and type;

```
docker-compose up -d
```

## Environment file
The service will require a `.env` file in the root directory. Below is an example

```
# Node mode
NODE_ENV=development

# Interface context - FMT or ANGLER
CONTEXT=ANGLER

# Redis
REDIS_HOSTNAME=0.0.0.0
REDIS_PORT=6379

# Logging level
LOG_LEVEL=debug

# Cookie **CHANGE THIS** encryption key for the user authorization cookie session key
COOKIE_PW=562fhgfqaj626ba87212ausaiqjqw112

# **CHANGE THIS** Cypher key for authorization details in redis - requires 16 byte key
AUTH_PW=1234567890123456

# Set true in secure environments
HTTPS=false

# Time to live, the server authentication cache entries in milliseconds. 1 Hour
SESSION_TTL_MS=3600000

# The logging setup
AIRBRAKE_HOST=<<airbrake host>>
AIRBRAKE_PROJECT_KEY=<<airbrake key>>

# The API setup
API_HOSTNAME=localhost
API_PORT=9580
API_PATH=/api
API_REQUEST_TIMEOUT_MS=60000

# AWS Credentials
# Note that the AWS-SDK expects to find the credentialis from the credentials provider chain, 
# See https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html. 
# Where running locally it is not sufficient to set these variables in the .env file - they need to be added 
# to the parent shell.
AWS_ACCESS_KEY_ID=AAAAAAAAAAAAAAAAAAAA
AWS_SECRET_ACCESS_KEY=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
AWS_DEFAULT_REGION=eu-west-1

# Proxy settings - do not use locally
http_proxy=http://defra-proxy:3128
https_proxy=http://defra-proxy:3128
no_proxy=localhost

# Report locations - The FMT system expects to find the reports in this location
# A metadata tag of 'decription' can be used to give the report a name otherwise
# the name will be derived from the filename
REPORTS_S3_LOCATION_BUCKET=devrcrs3bkt001
REPORTS_S3_LOCATION_FOLDER=reports 

# LRU Cache
LRU_ITEMS=200000
LRU_TTL=1800000 # Half an hour

# Google analytics and tag manager 
GA_TRACKING_ID=UA-000000000-1
GA_TAG_MANAGER=GTM-AAAAAAA

# Catch return entry point on GOV.UK
CATCH_RETURNS_GOV_UK=https://www.gov.uk/catch-return

# Max file upload size - 1Mb
MAX_FILE_UPLOAD_BYTES=1000000

```
## To Run
```
npm start
http://localhost:3000
```

For automated testing, to force the user to choose this or the previous year run with the --force-year-choose argument
```
node index.js --force-year-choose
```
