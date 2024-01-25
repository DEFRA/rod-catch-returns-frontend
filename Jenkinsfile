@Library('defra-shared@master') _
def codeArtifact

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
                        codeArtifact = defraCodeArtifact()
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
                    DIST_FILE = codeArtifact.createDistributionFile(env.WORKSPACE, "rcr_web")
                }
            }
        }
        stage('Upload distribution') {
            steps {
                script {
                    codeArtifact.uploadArtifact("rcr-snapshots/web/", "rcr_web", BUILD_TAG, DIST_FILE)
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
