'use strict'

/**
 * Handle the s3 bucket functions used for the FMT reports
 */
const { logger } = require('defra-logging-facade')
const AWS = require('aws-sdk')
const Mime = require('./mime-desc')

// If the proxy details are set up then include them in the AWS configuration
if (Object.keys(process.env).find(k => k === 'https_proxy')) {
  try {
    logger.debug(`Using proxy: ${process.env.https_proxy}`)
    const proxy = require('proxy-agent')
    AWS.config.update({
      httpOptions: {
        agent: proxy(process.env.https_proxy)
      }
    })
  } catch (err) {
    logger.error('Bad proxy specification: ' + err)
  }
}

const s3Region = process.env.AWS_REGION || 'eu-west-1'
AWS.config.update({ region: s3Region })
const s3 = new AWS.S3({ apiVersion: '2006-03-01' })

// Convert the file name to a description
const fileNameToDesc = (filename) => {
  const desc = filename.replace(process.env.REPORTS_S3_LOCATION_FOLDER + '/', '').replace(/_/g, ' ').split('.')[0]
  return desc.charAt(0).toUpperCase() + desc.substr(1).toLowerCase()
}

/*
 * Get the report metadata for a given key. Use either a description tag
 * Or convert the filename to a description
 */
const getReportDescription = (key) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.REPORTS_S3_LOCATION_BUCKET,
      Key: key
    }

    s3.getObjectTagging(params, (err, data) => {
      if (err) {
        logger.error('Cannot retrieve report description: ' + err)
        reject(err)
      }
      const descTag = data.TagSet.find(k => k.Key.toLowerCase() === 'description')
      resolve({
        key: key,
        description: descTag ? descTag.Value.trim() : fileNameToDesc(key)
      })
    })
  })
}

/*
 * Get the report metadata for a given key. Use either a description tag
 * Or convert the filename to a description
 */
const getReportMetaData = (key) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.REPORTS_S3_LOCATION_BUCKET,
      Key: key
    }

    s3.getObject(params, (err, data) => {
      if (err) {
        logger.error('Cannot retrieve report metadata: ' + err)
        reject(err)
      }
      resolve({
        key: key,
        length: Math.round(data.ContentLength / 1000),
        lastModified: data.LastModified.toDateString(),
        contentType: ((t) => {
          return Object.keys(Mime).includes(t) ? Mime[t] : t
        })(data.ContentType)
      })
    })
  })
}

module.exports = {
  // Test that the specified S3 bucket exists
  reportLocationExists: () => {
    return new Promise((resolve, reject) => {
      s3.headBucket({ Bucket: process.env.REPORTS_S3_LOCATION_BUCKET }, function (err) {
        if (err) {
          logger.error('Cannot find report location: ' + err)
          reject(err)
        }

        resolve(process.env.REPORTS_S3_LOCATION_BUCKET)
      })
    })
  },

  // List the available reports in the specified location.
  listReports: () => {
    return new Promise((resolve, reject) => {
      const params = {
        Bucket: process.env.REPORTS_S3_LOCATION_BUCKET,
        Prefix: process.env.REPORTS_S3_LOCATION_FOLDER,
        StartAfter: process.env.REPORTS_S3_LOCATION_FOLDER + '/'
      }

      s3.listObjectsV2(params, (err, data) => {
        if (err) {
          logger.error('Cannot retrieve report listing: ' + err)
          reject(err)
        }

        Promise.all(data.Contents.map(c => getReportDescription(c.Key))).then((details) => {
          Promise.all(details.map(d => getReportMetaData(d.key))).then((reportMetaData) => {
            resolve(details.map(d => {
              return Object.assign(d, reportMetaData.find(m => m.key === d.key))
            }))
          })
        })
      })
    })
  },

  // Get a report by key
  getReport: (key) => {
    return new Promise((resolve, reject) => {
      const params = {
        Bucket: process.env.REPORTS_S3_LOCATION_BUCKET,
        Key: key
      }
      s3.getObject(params, (err, data) => {
        if (err) {
          logger.error('Cannot retrieve report: ' + err)
          reject(err)
        }

        resolve(data)
      })
    })
  }
}
