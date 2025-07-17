pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_USERNAME = 'anhtt4512'
        VERSION = "${env.BUILD_NUMBER}"

        BACKEND_IMAGE = "${DOCKER_USERNAME}/attendance-app-backend"
        FRONTEND_IMAGE = "${DOCKER_USERNAME}/attendance-app-frontend"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup Environment') {
            steps {
                script {
                    // Create necessary environment files if they don't exist
                    sh '''
                        if [ ! -f learning-app/.env ]; then
                            echo "Creating .env file for backend"
                            cp learning-app/.env.example learning-app/.env || echo "No .env.example found"
                        fi
                        
                        if [ ! -f learning-app-ui/.env ]; then
                            echo "Creating .env file for frontend"
                            cp learning-app-ui/.env.example learning-app-ui/.env || echo "No .env.example found"
                        fi
                    '''
                }
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('learning-app') {
                            sh '''
                                npm ci --only=production
                                npm install -g @nestjs/cli
                                npm install -g prisma
                            '''
                        }
                    }
                }
                
                stage('Frontend Dependencies') {
                    steps {
                        dir('learning-app-ui') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }
        
        stage('Run Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('learning-app') {
                            sh '''
                                npm run test
                                npm run test:e2e
                            '''
                        }
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'learning-app/coverage/**/*.xml'
                        }
                    }
                }
                
                stage('Frontend Tests') {
                    steps {
                        dir('learning-app-ui') {
                            sh '''
                                npm run test
                                npm run test:e2e
                            '''
                        }
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'learning-app-ui/coverage/**/*.xml'
                        }
                    }
                }
            }
        }
        
        stage('Code Quality') {
            parallel {
                stage('Backend Lint') {
                    steps {
                        dir('learning-app') {
                            sh 'npm run lint'
                        }
                    }
                }
                
                stage('Frontend Lint') {
                    steps {
                        dir('learning-app-ui') {
                            sh 'npm run lint'
                        }
                    }
                }
            }
        }
        
        stage('Build Applications') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('learning-app') {
                            sh '''
                                npm run build
                                npx prisma generate
                            '''
                        }
                    }
                }
                
                stage('Build Frontend') {
                    steps {
                        dir('learning-app-ui') {
                            sh 'npm run build'
                        }
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                script {
                    // Build backend image
                    docker.build("${BACKEND_IMAGE}:${VERSION}", "./learning-app")
                    docker.build("${BACKEND_IMAGE}:latest", "./learning-app")
                    
                    // Build frontend image
                    docker.build("${FRONTEND_IMAGE}:${VERSION}", "./learning-app-ui")
                    docker.build("${FRONTEND_IMAGE}:latest", "./learning-app-ui")
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                script {
                    // Scan Docker images for vulnerabilities
                    sh '''
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy image ${BACKEND_IMAGE}:${VERSION}
                        
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy image ${FRONTEND_IMAGE}:${VERSION}
                    '''
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                branch 'master'
            }
            steps {
                script {
                    // Login to Docker Hub
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    }
                    
                    // Push images
                    sh '''
                        docker push ${BACKEND_IMAGE}:${VERSION}
                        docker push ${BACKEND_IMAGE}:latest
                        docker push ${FRONTEND_IMAGE}:${VERSION}
                        docker push ${FRONTEND_IMAGE}:latest
                    '''
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'master'
            }
            steps {
                script {
                    // Deploy to staging environment
                    sh '''
                        # Update docker-compose with new image versions
                        sed -i "s|image: ${DOCKER_USERNAME}/learning-app-backend:.*|image: ${BACKEND_IMAGE}:${VERSION}|g" docker-compose.staging.yaml
                        sed -i "s|image: ${DOCKER_USERNAME}/learning-app-frontend:.*|image: ${FRONTEND_IMAGE}:${VERSION}|g" docker-compose.staging.yaml
                        
                        # Deploy using docker-compose
                        docker-compose -f docker-compose.staging.yaml down
                        docker-compose -f docker-compose.staging.yaml pull
                        docker-compose -f docker-compose.staging.yaml up -d
                    '''
                }
            }
        }
        
        stage('Integration Tests') {
            when {
                branch 'master'
            }
            steps {
                script {
                    // Wait for services to be ready
                    sh 'sleep 30'
                    
                    // Run integration tests
                    sh '''
                        # Test backend health
                        curl -f http://staging-backend:3010/health || exit 1
                        
                        # Test frontend
                        curl -f http://staging-frontend:3000 || exit 1
                    '''
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'master'
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                script {
                    // Deploy to production environment
                    sh '''
                        # Update docker-compose with new image versions
                        sed -i "s|image: ${DOCKER_USERNAME}/learning-app-backend:.*|image: ${BACKEND_IMAGE}:${VERSION}|g" docker-compose.prod.yaml
                        sed -i "s|image: ${DOCKER_USERNAME}/learning-app-frontend:.*|image: ${FRONTEND_IMAGE}:${VERSION}|g" docker-compose.prod.yaml
                        
                        # Deploy using docker-compose
                        docker-compose -f docker-compose.prod.yaml down
                        docker-compose -f docker-compose.prod.yaml pull
                        docker-compose -f docker-compose.prod.yaml up -d
                    '''
                }
            }
        }
    }
    
    post {
        always {
            // Clean up Docker images
            sh '''
                docker image prune -f
                docker system prune -f
            '''
        }
        
        success {
            script {
                // Send success notification
                emailext (
                    subject: "Pipeline Successful: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    body: "Build ${env.BUILD_NUMBER} completed successfully. View details at: ${env.BUILD_URL}",
                    to: "${env.BUILD_USER_EMAIL}"
                )
            }
        }
        
        failure {
            script {
                // Send failure notification
                emailext (
                    subject: "Pipeline Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    body: "Build ${env.BUILD_NUMBER} failed. View details at: ${env.BUILD_URL}",
                    to: "${env.BUILD_USER_EMAIL}"
                )
            }
        }
        
        cleanup {
            // Clean workspace
            cleanWs()
        }
    }
} 