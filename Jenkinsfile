@Library('defra-shared@master') _
def arti = defraArtifactory()
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
                    sh  """
                        . /var/lib/jenkins/.bashrc && nvm install 20.17.0
                        npm ci
                    """
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
                    arti.uploadArtifact("rcr-snapshots/web/", "rcr_web", BUILD_TAG, DIST_FILE)
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
