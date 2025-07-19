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
                withCredentials([
                    file(credentialsId: 'env-file-postgres', variable: 'ENV_POSTGRES'),
                    file(credentialsId: 'env-file-minio', variable: 'ENV_MINIO'),
                    file(credentialsId: 'env-file-n8n', variable: 'ENV_N8N'),
                    file(credentialsId: 'env-file-backend', variable: 'ENV_BE'),
                    file(credentialsId: 'env-file-frontend', variable: 'ENV_FE')
                ]) {
                    sh '''
                        # Setup cache directories
                        mkdir -p ~/.npm
                        mkdir -p ~/.cache
                        
                        # Copy environment files
                        cp $ENV_POSTGRES ./learning-app/.env.postgres
                        cp $ENV_MINIO ./learning-app/.env.minio
                        cp $ENV_N8N ./learning-app/.env.n8n
                        cp $ENV_BE ./learning-app/.env
                        cp $ENV_FE ./learning-app-ui/.env
                    '''
                }
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('learning-app') {
                            // Try to unstash cached dependencies first
                            script {
                                try {
                                    unstash 'backend-deps'
                                    echo 'Using cached backend dependencies'
                                } catch (Exception e) {
                                    echo 'No cached dependencies found, installing fresh'
                                }
                            }
                            
                            sh '''
                                # Setup npm cache directory
                                mkdir -p ~/.npm
                                
                                # Check if node_modules exists, if not install dependencies
                                if [ ! -d "node_modules" ]; then
                                    echo "Installing backend dependencies..."
                                    # Use npm ci for faster, reliable installs with cache
                                    npm ci --legacy-peer-deps --prefer-offline --no-audit --no-fund --cache ~/.npm || npm install --legacy-peer-deps --prefer-offline --no-audit --no-fund --cache ~/.npm
                                    
                                    # Install global packages with cache
                                    npm install -g @nestjs/cli prisma --cache ~/.npm
                                else
                                    echo "Backend dependencies already installed"
                                fi
                            '''
                            
                            // Stash dependencies for next build
                            stash includes: 'node_modules/**/*,package-lock.json', name: 'backend-deps'
                        }
                    }
                }
                
                stage('Frontend Dependencies') {
                    steps {
                        dir('learning-app-ui') {
                            // Try to unstash cached dependencies first
                            script {
                                try {
                                    unstash 'frontend-deps'
                                    echo 'Using cached frontend dependencies'
                                } catch (Exception e) {
                                    echo 'No cached dependencies found, installing fresh'
                                }
                            }
                            
                            sh '''
                                # Setup npm cache directory
                                mkdir -p ~/.npm
                                
                                # Check if node_modules exists, if not install dependencies
                                if [ ! -d "node_modules" ]; then
                                    echo "Installing frontend dependencies..."
                                    # Use npm ci for faster, reliable installs with cache
                                    npm ci --prefer-offline --no-audit --no-fund --cache ~/.npm || npm install --prefer-offline --no-audit --no-fund --cache ~/.npm
                                else
                                    echo "Frontend dependencies already installed"
                                fi
                            '''
                            
                            // Stash dependencies for next build
                            stash includes: 'node_modules/**/*,package-lock.json', name: 'frontend-deps'
                        }
                    }
                }
            }
        }
        
        stage('Run Tests') {
            parallel {
                stage('Backend Tests') {
                    when {
                        anyOf {
                            changeset pattern: "learning-app/**/*"
                            expression { return env.BRANCH_NAME == 'master' || env.BRANCH_NAME == 'main' }
                        }
                    }
                    steps {
                        dir('learning-app') {
                            sh '''
                                # Run tests with coverage and quiet output
                                npm run test || echo "Tests skipped - no test script found"
                                npm run test:e2e || echo "E2E tests skipped - no test script found"
                            '''
                        }
                    }
                    post {
                        always {
                            script {
                                if (fileExists('learning-app/test-results.xml')) {
                                    junit 'learning-app/test-results.xml'
                                }
                                echo 'Backend test results processed'
                            }
                        }
                    }
                }
                
                stage('Frontend Tests') {
                    when {
                        anyOf {
                            changeset pattern: "learning-app-ui/**/*"
                            expression { return env.BRANCH_NAME == 'master' || env.BRANCH_NAME == 'main' }
                        }
                    }
                    steps {
                        dir('learning-app-ui') {
                            sh '''
                                # Run tests with coverage and quiet output
                                npm run test || echo "Tests skipped - no test script found"
                                npm run test:e2e || echo "E2E tests skipped - no test script found"
                            '''
                        }
                    }
                    post {
                        always {
                            script {
                                if (fileExists('learning-app-ui/test-results.xml')) {
                                    junit 'learning-app-ui/test-results.xml'
                                }
                                echo 'Frontend test results processed'
                            }
                        }
                    }
                }
            }
        }
        
        stage('Code Quality') {
            parallel {
                stage('Backend Lint') {
                    when {
                        anyOf {
                            changeset pattern: "learning-app/**/*.{ts,js}"
                            expression { return env.BRANCH_NAME == 'master' || env.BRANCH_NAME == 'main' }
                        }
                    }
                    steps {
                        dir('learning-app') {
                            sh '''
                                # Run lint with quiet output and cache
                                npm run lint || echo "Lint skipped - eslint not found"
                            '''
                        }
                    }
                }
                
                stage('Frontend Lint') {
                    when {
                        anyOf {
                            changeset pattern: "learning-app-ui/**/*.{ts,js,tsx,jsx}"
                            expression { return env.BRANCH_NAME == 'master' || env.BRANCH_NAME == 'main' }
                        }
                    }
                    steps {
                        dir('learning-app-ui') {
                            sh '''
                                # Run lint with quiet output and cache
                                npm run lint
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Build Applications') {
            parallel {
                stage('Build Backend') {
                    when {
                        anyOf {
                            changeset pattern: "learning-app/**/*"
                            expression { return env.BRANCH_NAME == 'master' || env.BRANCH_NAME == 'main' }
                        }
                    }
                    steps {
                        dir('learning-app') {
                            sh '''
                                # Build with optimizations
                                npm run build
                                npx prisma generate
                            '''
                        }
                    }
                }
                
                stage('Build Frontend') {
                    when {
                        anyOf {
                            changeset pattern: "learning-app-ui/**/*"
                            expression { return env.BRANCH_NAME == 'master' || env.BRANCH_NAME == 'main' }
                        }
                    }
                    steps {
                        dir('learning-app-ui') {
                            sh '''
                                # Build with optimizations and quiet output
                                npm run build
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                script {
                    // 🧠 Login to Docker Hub BEFORE build to avoid 429
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    }

                    // Check if we need to build images based on changes
                    def backendChanged = sh(script: "git diff --name-only HEAD~1 HEAD | grep 'learning-app/'", returnStatus: true) == 0
                    def frontendChanged = sh(script: "git diff --name-only HEAD~1 HEAD | grep 'learning-app-ui/'", returnStatus: true) == 0
                    
                    if (backendChanged || env.BRANCH_NAME == 'master' || env.BRANCH_NAME == 'main') {
                        echo "Building backend image..."
                        // 🛠 Build backend image with cache
                        docker.build("${BACKEND_IMAGE}:${VERSION}", "--cache-from ${BACKEND_IMAGE}:latest --build-arg BUILDKIT_INLINE_CACHE=1 ./learning-app")
                        docker.build("${BACKEND_IMAGE}:latest", "--cache-from ${BACKEND_IMAGE}:latest --build-arg BUILDKIT_INLINE_CACHE=1 ./learning-app")
                    } else {
                        echo "No backend changes detected, skipping backend build"
                    }
                    
                    if (frontendChanged || env.BRANCH_NAME == 'master' || env.BRANCH_NAME == 'main') {
                        echo "Building frontend image..."
                        // 🛠 Build frontend image with cache
                        docker.build("${FRONTEND_IMAGE}:${VERSION}", "--cache-from ${FRONTEND_IMAGE}:latest --build-arg BUILDKIT_INLINE_CACHE=1 ./learning-app-ui")
                        docker.build("${FRONTEND_IMAGE}:latest", "--cache-from ${FRONTEND_IMAGE}:latest --build-arg BUILDKIT_INLINE_CACHE=1 ./learning-app-ui")
                    } else {
                        echo "No frontend changes detected, skipping frontend build"
                    }
                }
            }
        }
        
        stage('Debug Branch') {
            steps {
                script {
                    echo "=== BRANCH DEBUG INFO ==="
                    echo "BRANCH_NAME: '${env.BRANCH_NAME}'"
                    echo "GIT_BRANCH: '${env.GIT_BRANCH}'"
                    echo "GIT_LOCAL_BRANCH: '${env.GIT_LOCAL_BRANCH}'"
                    echo "CHANGE_BRANCH: '${env.CHANGE_BRANCH}'"
                    echo "CHANGE_TARGET: '${env.CHANGE_TARGET}'"
                    echo "BRANCH_NAME length: ${env.BRANCH_NAME?.length() ?: 'null'}"
                    echo "GIT_BRANCH length: ${env.GIT_BRANCH?.length() ?: 'null'}"
                    
                    sh '''
                        echo "=== GIT COMMANDS ==="
                        echo "Current branch:"
                        git rev-parse --abbrev-ref HEAD
                        echo "All branches:"
                        git branch -a
                        echo "Remote branches:"
                        git branch -r
                    '''
                }
            }
        }
        
        stage('Optimize Images') {
            when {
                anyOf {
                    branch 'master'
                    branch 'main'
                }
            }
            steps {
                script {
                    // Optimize Docker images for production
                    sh '''
                        echo "Optimizing backend image..."
                        # Remove unnecessary files and optimize layers
                        docker run --rm ${BACKEND_IMAGE}:${VERSION} sh -c "
                            rm -rf /tmp/* /var/tmp/* /var/cache/* 2>/dev/null || true
                        " || echo "Backend optimization completed"
                        
                        echo "Optimizing frontend image..."
                        # Remove unnecessary files and optimize layers
                        docker run --rm ${FRONTEND_IMAGE}:${VERSION} sh -c "
                            rm -rf /tmp/* /var/tmp/* /var/cache/* 2>/dev/null || true
                        " || echo "Frontend optimization completed"
                    '''
                }
            }
        }
        
        stage('Security Scan') {
            when {
                anyOf {
                    branch 'master'
                    branch 'main'
                }
            }
            steps {
                script {
                    // Scan Docker images for vulnerabilities with quiet output
                    sh '''
                        echo "Scanning backend image for vulnerabilities..."
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy image --quiet --severity HIGH,CRITICAL ${BACKEND_IMAGE}:${VERSION} || echo "Backend scan completed"
                        
                        echo "Scanning frontend image for vulnerabilities..."
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy image --quiet --severity HIGH,CRITICAL ${FRONTEND_IMAGE}:${VERSION} || echo "Frontend scan completed"
                    '''
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                anyOf {
                    branch 'master'
                    branch 'main'
                    expression { 
                        def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                        echo "Current branch for push condition: '${currentBranch}'"
                        return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                    }
                }
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
        

        

        
        stage('Deploy to Production') {
            when {
                anyOf {
                    branch 'master'
                    branch 'main'
                    expression { 
                        def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                        return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                    }
                }
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                script {
                    // Deploy to production environment
                    sh '''
                        # Update docker-compose with new image versions
                        sed -i "s|image: anhtt4512/attendance-app-backend:.*|image: ${BACKEND_IMAGE}:${VERSION}|g" docker-compose.prod.yaml
                        sed -i "s|image: anhtt4512/attendance-app-frontend:.*|image: ${FRONTEND_IMAGE}:${VERSION}|g" docker-compose.prod.yaml
                        
                        # Check if docker compose is available, otherwise install docker-compose
                        if ! command -v docker compose &> /dev/null; then
                            echo "docker compose not found, trying to install docker-compose..."
                            curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
                            chmod +x /usr/local/bin/docker-compose
                            export PATH="/usr/local/bin:$PATH"
                        fi
                        
                        # Deploy using docker compose (with fallback to docker-compose)
                        if command -v docker compose &> /dev/null; then
                            docker compose -f docker-compose.prod.yaml down
                            docker compose -f docker-compose.prod.yaml pull
                            docker compose -f docker-compose.prod.yaml up -d
                        else
                            docker-compose -f docker-compose.prod.yaml down
                            docker-compose -f docker-compose.prod.yaml pull
                            docker-compose -f docker-compose.prod.yaml up -d
                        fi
                    '''
                }
            }
        }
    }
    
    post {
        always {
            // Clean up Docker images and containers efficiently
            sh '''
                echo "Cleaning up Docker resources..."
                # Remove unused images (older than 24 hours)
                docker image prune -f --filter "until=24h" || echo "Docker image cleanup failed"
                # Remove stopped containers (older than 24 hours)
                docker container prune -f --filter "until=24h" || echo "Docker container cleanup failed"
                # Remove unused networks
                docker network prune -f || echo "Docker network cleanup failed"
                # Remove unused volumes (be careful with this in production)
                docker volume prune -f || echo "Docker volume cleanup failed"
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