@Library('defra-shared@master') _
def arti = defraArtifactory()
def s3

pipeline {
    agent any
    stages {
        stage('Preparation') {
            steps {
                script {
                    BUILD_TAG = buildTag.updateJenkinsJob()
                    withCredentials([
                        [
                            $class: 'AmazonWebServicesCredentialsBinding', 
                            credentialsId: 'aps-rcr-user',
                            accessKeyVariable: 'AWS_ACCESS_KEY_ID',
                            secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
                        ]
                    ]) {
                        s3 = defraS3('apsldnrcrsrv001')
                    }
                }
            }
        }
        stage('Build') {
            steps {
                script {
                    sh  "npm install"
                }
            }
        }
        stage('Archive distribution') {
            steps {
                script {
                    DIST_FILE = s3.createDistributionFile(env.WORKSPACE, "rcr_web")
                }
            }
        }
        stage('Upload distribution') {
            steps {
                script {
                    arti.uploadArtifact("rcr-snapshots/web/", "rcr_web", BUILD_TAG, DIST_FILE)
                    s3.uploadArtifact("rcr-snapshots/web/", "rcr_web", BUILD_TAG, DIST_FILE)
                }
            }
        }
    }
    post {
        cleanup {
            cleanWs cleanWhenFailure: false
        }
    }
}
