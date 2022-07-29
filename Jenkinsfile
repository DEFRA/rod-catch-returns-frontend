@Library('defra-shared@feature/iwtf-2874-s3-interface') _
def arti = defraArtifactory()

pipeline {
    agent any
    stages {
        stage('Preparation') {
            steps {
                script {
                    BUILD_TAG = buildTag.updateJenkinsJob()
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
                    DIST_FILE = arti.createDistributionFile(env.WORKSPACE, "rcr_web")
                }
            }
        }
        stage('Upload distribution') {
            steps {
                script {
                    arti.uploadArtifact("rcr-snapshots/web/", "rcr_web", BUILD_TAG, DIST_FILE)
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
