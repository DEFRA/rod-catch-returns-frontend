@Library('defra-shared@feature/iwtf-2874-s3-interface') _
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
                        s3 = defraS3()
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
                    // DIST_FILE = arti.createDistributionFile(env.WORKSPACE, "rcr_web")
                    DIST_FILE = s3.createDistributionFile(env.WORKSPACE, "rcr_web")
                }
            }
        }
        stage('Upload distribution') {
            steps {
                // script {
                //     withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aps-rcr-user']]) {
                //         // arti.uploadArtifact("rcr-snapshots/web/", "rcr_web", BUILD_TAG, DIST_FILE)
                //         s3.uploadArtifact("rcr-snapshots/web/", "rcr_web", BUILD_TAG, DIST_FILE)
                //     }
                // }
                script {
                    s3.uploadArtifact("rcr-snapshots/web/", "rcr_web", BUILD_TAG, DIST_FILE)
                    // sh """
                    //     echo hello > abc.txt 
                    //     aws s3 cp abc.txt s3://apsldnrcrsrv001
                    //     aws s3 cp ${DIST_FILE} s3://apsldnrcrsrv001
                    // """
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
