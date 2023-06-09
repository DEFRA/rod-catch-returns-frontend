'use strict'

/**
 * Handle the s3 bucket functions used for the FMT reports
 */
const { logger } = require('defra-logging-facade')
const AWS = require('aws-sdk')
const { S3 } = require('@aws-sdk/client-s3')
const Mime = require('./mime-desc')

// If the proxy details are set up then include them in the AWS configuration
logger.debug('checking for https proxy')
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

logger.debug('initialising s3')
const s3 = new S3({ region: process.env.AWS_REGION || 'eu-west-1' })

// Convert the file name to a description
const fileNameToDesc = (filename) => {
  const desc = filename.replace(process.env.REPORTS_S3_LOCATION_FOLDER + '/', '').replace(/_/g, ' ').split('.')[0]
  return desc.charAt(0).toUpperCase() + desc.substr(1).toLowerCase()
}

const s3GetObjectTagging = async Key => {
  try {
    return await s3.getObjectTagging({
      Bucket: process.env.REPORTS_S3_LOCATION_BUCKET,
      Key
    })
  } catch (e) {
    logger.error(`Cannot retrieve report description: ${e}`)
    throw e
  }
}

/*
 * Get the report metadata for a given key. Use either a description tag
 * Or convert the filename to a description
 */
const getReportDescription = async key => {
  const data = await s3GetObjectTagging(key)
  const descTag = data.TagSet.find(k => k.Key.toLowerCase() === 'description')
  return {
    key,
    description: descTag ? descTag.Value.trim() : fileNameToDesc(key)
  }
}

const s3GetObject = async Key => {
  try {
    return await s3.getObject({
      Bucket: process.env.REPORTS_S3_LOCATION_BUCKET,
      Key
    })
  } catch (e) {
    logger.error(`Cannot retrieve report metadata: ${e}`)
    throw e
  }
}

/*
 * Get the report metadata for a given key. Use either a description tag
 * Or convert the filename to a description
 */
const getReportMetaData = async key => {
  const data = await s3GetObject(key)
  return {
    key,
    length: Math.round(data.ContentLength / 1000),
    lastModified: data.LastModified.toDateString(),
    contentType: Object.keys(Mime).includes(data.ContentType) ? Mime[data.ContentType] : data.ContentType
  }
}

const s3ListObjectsV2 = async () => {
  try {
    return await s3.listObjectsV2({
      Bucket: process.env.REPORTS_S3_LOCATION_BUCKET,
      Prefix: process.env.REPORTS_S3_LOCATION_FOLDER,
      StartAfter: `${process.env.REPORTS_S3_LOCATION_FOLDER}/`
    })
  } catch (e) {
    logger.error(`Cannot retrieve report listing ${e}`)
    throw e
  }
}

module.exports = {
  // Test that the specified S3 bucket exists
  reportLocationExists: async () => {
    try {
      logger.debug('report location exists', process.env.REPORTS_S3_LOCATION_BUCKET)
      const reportsLocationExtant = await s3.headBucket({ Bucket: process.env.REPORTS_S3_LOCATION_BUCKET })
      logger.debug('report location exists:', reportsLocationExtant)
      return reportsLocationExtant
    } catch (e) {
      logger.error(`Cannot find report location: ${e}`)
      throw e
    }
  },

  // List the available reports in the specified location.
  listReports: async () => {
    const data = await s3ListObjectsV2()
    const details = await Promise.all(data.Contents.map(c => getReportDescription(c.Key)))
    const reportMetaData = await Promise.all(details.map(d => getReportMetaData(d.key)))
    return details.map(d => Object.assign(d, reportMetaData.find(m => m.key === d.key)))
  },

  // Get a report by key
  getReport: async key => {
    try {
      return await s3.getObject({
        Bucket: process.env.REPORTS_S3_LOCATION_BUCKET,
        Key: key
      })
    } catch (e) {
      logger.error(`Cannot retrieve report: ${e}`)
      throw e
    }
  }
}
