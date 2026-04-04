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

        AWS_REGION = 'ap-south-1'
        ECR_REPO = 'hotel-booking-service'
        ECR_REGISTRY = '123456789012.dkr.ecr.ap-south-1.amazonaws.com'

        EKS_CLUSTER = 'hotel-booking-cluster'
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

        stage('Build Docker Images') {
            steps {
                sh '''
                docker compose build
                '''
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

        stage('Trivy Image Scan') {
            steps {
                sh '''
                mkdir -p trivy-reports

                images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -v "<none>")

                for image in $images
                do
                    echo "Scanning $image"

                    trivy image \
                    --severity HIGH,CRITICAL \
                    --exit-code 0 \
                    --format table \
                    --output trivy-reports/$(echo $image | tr '/' '_').txt \
                    $image
                done
                '''
            }
        }

        stage('Deploy Application Locally') {
            steps {
                sh '''
                docker compose down || true
                docker compose up -d
                '''
            }
        }

        stage('Login to AWS ECR') {
            steps {
                sh '''
                aws ecr get-login-password \
                --region $AWS_REGION | \
                docker login \
                --username AWS \
                --password-stdin $ECR_REGISTRY
                '''
            }
        }

        stage('Push Image to ECR') {
            steps {
                sh '''
                docker tag ${IMAGE_NAME}:latest $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG
                docker push $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG
                '''
            }
        }

        stage('Deploy to EKS') {
            steps {
                sh '''
                aws eks update-kubeconfig \
                --region $AWS_REGION \
                --name $EKS_CLUSTER

                kubectl set image deployment/hotel-booking \
                hotel-booking=$ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG

                kubectl rollout status deployment/hotel-booking
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
