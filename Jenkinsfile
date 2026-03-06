pipeline {
    agent any

    environment {
        SONARQUBE_SERVER = 'sonarqube-server'
        DEPENDENCY_CHECK = 'dependency-check'
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

        stage('Build Application') {
            steps {
                sh '''
                    cd "Rest Api"
                    mvn clean package -DskipTests
                '''
            }
        }

        stage('SonarQube Code Analysis') {
            steps {
                withSonarQubeEnv("${SONARQUBE_SERVER}") {
                    sh '''
                        cd "Rest Api"
                        mvn sonar:sonar \
                          -Dsonar.projectKey=hotel-booking-service \
                          -Dsonar.projectName="Hotel Booking Service" \
                          -Dsonar.java.binaries=target/classes

                        cd "React App"
                        mvn sonar:sonar \
                          -Dsonar.projectKey=hotel-booking-service \
                          -Dsonar.projectName="Hotel Booking Service" \
                          -Dsonar.java.binaries=target/classes
                    '''
                }
            }
        }

        stage('OWASP Dependency Check') {
        steps {
            sh 'mkdir -p dependency-check-report'
    
            dependencyCheck additionalArguments: '''
                --scan .
                --format XML
                --format HTML
                --out dependency-check-report
            ''',
            odcInstallation: 'dependency-check'
    
            dependencyCheckPublisher pattern: 'dependency-check-report/dependency-check-report.xml'
           }
        }
/*
        stage('Sonar Quality Gate') {
            steps {
                timeout(time: 20, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
*/
        stage('Trivy Filesystem Scan') {
           steps {
              sh '''
              mkdir -p trivy-reports
              trivy fs \
              --scanners vuln,secret,misconfig \
              --severity HIGH,CRITICAL \
              --exit-code 0 \
              --format table \
              --output trivy-reports/trivy-fs-report.txt .
              '''
           }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                '''
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh '''
                    trivy image \
                      --severity HIGH,CRITICAL \
                      --exit-code 1 \
                      --format table \
                      ${IMAGE_NAME}:${IMAGE_TAG}
                '''
            }
        }

        stage('Deploy Container') {
            steps {
                sh '''
                    docker stop hotel-app || true
                    docker rm hotel-app || true

                    docker run -d \
                      --name hotel-app \
                      -p 8081:8080 \
                      ${IMAGE_NAME}:${IMAGE_TAG}
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
                attachmentsPattern: 'dependency-check-report/*, trivy-reports/*'
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
                attachmentsPattern: 'dependency-check-report/*, trivy-reports/*'
            )
        }

        always {
            archiveArtifacts artifacts: 'dependency-check-report/*, trivy-reports/*', allowEmptyArchive: true
        }
    }
}