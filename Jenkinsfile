pipeline {
    agent any

    environment {
        SONARQUBE_SERVER = 'sonarqube-server'
        DEPENDENCY_CHECK_TOOL = 'dependency-check'
        EMAIL_RECIPIENTS = 'devops-team@example.com'
    }

    stages {
        stage('Clone Code from GitHub') {
            steps {
                checkout scm
            }
        }

        stage('SonarQube Quality Analysis') {
            steps {
                withSonarQubeEnv("${SONARQUBE_SERVER}") {
                    sh '''
                        cd "Rest Api"
                        mvn -B -DskipTests clean verify sonar:sonar \
                          -Dsonar.projectKey=hotel-booking-service \
                          -Dsonar.projectName="Hotel Booking Service" \
                          -Dsonar.java.binaries=target/classes
                    '''
                }
            }
        }

        stage('OWASP Dependency Check') {
            steps {
                dependencyCheck additionalArguments: '--scan . --format XML --format HTML --out dependency-check-report',
                    odcInstallation: "${DEPENDENCY_CHECK_TOOL}"
                dependencyCheckPublisher pattern: '**/dependency-check-report/dependency-check-report.xml'
            }
        }

        stage('Sonar Quality Gate Scan') {
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Trivy File System Scan') {
            steps {
                sh '''
                    mkdir -p trivy-reports
                    trivy fs --scanners vuln,secret,misconfig \
                      --severity HIGH,CRITICAL \
                      --exit-code 1 \
                      --format table \
                      --output trivy-reports/trivy-fs.txt .
                '''
            }
        }
        stage('Trivy Image Scan') {
             steps {
               sh 'trivy image hotel-booking-service'
           }
        }

        stage('Docker Build') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('Deploy Container') {
            steps {
                sh '''
                    docker compose down || true
                    docker compose up -d
                    docker compose ps
                '''
            }
        }
    }

    post {
        success {
            emailext(
                subject: "SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER} deployed",
                body: """
                    Build Status: SUCCESS
                    Job: ${env.JOB_NAME}
                    Build: #${env.BUILD_NUMBER}
                    URL: ${env.BUILD_URL}

                    Deployment completed successfully.
                    Attached reports include OWASP dependency report and Trivy scan output.
                """.stripIndent(),
                to: "${EMAIL_RECIPIENTS}",
                mimeType: 'text/plain',
                attachmentsPattern: 'dependency-check-report/*, trivy-reports/*'
            )
        }
        failure {
            emailext(
                subject: "FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                    Build Status: FAILED
                    Job: ${env.JOB_NAME}
                    Build: #${env.BUILD_NUMBER}
                    URL: ${env.BUILD_URL}

                    Please check failed stage logs.
                    Attached reports (if generated) are included.
                """.stripIndent(),
                to: "${EMAIL_RECIPIENTS}",
                mimeType: 'text/plain',
                attachmentsPattern: 'dependency-check-report/*, trivy-reports/*'
            )
        }
        always {
            archiveArtifacts artifacts: 'trivy-reports/*, dependency-check-report/*', allowEmptyArchive: true
        }
    }
}
