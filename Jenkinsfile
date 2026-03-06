pipeline {
    agent any

    tools {
        nodejs 'nodejs'
    }

    environment {
        SONARQUBE_SERVER = 'sonarqube-server'
        EMAIL_RECIPIENTS = 'chayansamanta8@gmail.com'
        IMAGE_NAME = 'hotel-booking-service'
        IMAGE_TAG = "v${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout Source Code') {
            steps {
                git branch: 'main', url: 'https://github.com/chayan0104/hotel_booking_pipeline.git'
            }
        }

        stage('Build Backend') {
            steps {
                dir('Rest Api') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('React App') {
                    sh '''
                        npm install
                        npm run build
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            parallel {

                stage('Backend Scan') {
                    steps {
                        withSonarQubeEnv("${SONARQUBE_SERVER}") {
                            dir('Rest Api') {
                                sh '''
                                mvn sonar:sonar \
                                  -Dsonar.projectKey=hotel-booking-backend \
                                  -Dsonar.projectName="Hotel Booking Backend" \
                                  -Dsonar.java.binaries=target/classes
                                '''
                            }
                        }
                    }
                }

                stage('Frontend Scan') {
                    steps {
                        withSonarQubeEnv("${SONARQUBE_SERVER}") {
                            dir('React App') {
                                sh '''
                                npx sonar-scanner \
                                  -Dsonar.projectKey=hotel-booking-frontend \
                                  -Dsonar.projectName="Hotel Booking Frontend" \
                                  -Dsonar.sources=src
                                '''
                            }
                        }
                    }
                }

            }
        }

        stage('Trivy Filesystem Scan') {
            steps {
                sh '''
                mkdir -p trivy-reports
                trivy fs \
                  --scanners vuln,misconfig \
                  --severity HIGH,CRITICAL \
                  --exit-code 0 \
                  --format table \
                  --output trivy-reports/trivy-fs-report.txt .
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                docker compose build
                '''
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh '''
                mkdir -p trivy-reports

                trivy image \
                  --severity HIGH,CRITICAL \
                  --exit-code 0 \
                  --format table \
                  --output trivy-reports/trivy-image-report.txt \
                  mysql:8.4 || true
                '''
            }
        }

        stage('Deploy Application') {
            steps {
                sh '''
                docker compose down || true
                docker compose up -d
                '''
            }
        }
    }

    post {

        success {
            emailext(
                subject: "SUCCESS: ${JOB_NAME} Build #${BUILD_NUMBER}",
                body: """
Build completed successfully.

Job Name: ${JOB_NAME}
Build Number: ${BUILD_NUMBER}
Build URL: ${BUILD_URL}

Application deployed successfully.
""",
                to: "${EMAIL_RECIPIENTS}",
                attachmentsPattern: 'trivy-reports/*'
            )
        }

        failure {
            emailext(
                subject: "FAILED: ${JOB_NAME} Build #${BUILD_NUMBER}",
                body: """
Build FAILED.

Job Name: ${JOB_NAME}
Build Number: ${BUILD_NUMBER}
Build URL: ${BUILD_URL}

Please check the Jenkins logs.
""",
                to: "${EMAIL_RECIPIENTS}",
                attachmentsPattern: 'trivy-reports/*'
            )
        }

        always {
            archiveArtifacts artifacts: 'trivy-reports/*', allowEmptyArchive: true
        }
    }
}