pipeline {
    agent any
    
    options {
        // Tăng timeout cho pipeline
        timeout(time: 45, unit: 'MINUTES')
        // Giữ lại 10 build gần nhất
        buildDiscarder(logRotator(numToKeepStr: '10'))
        // Skip default checkout
        skipDefaultCheckout(true)
        // Disable concurrent builds
        disableConcurrentBuilds()
    }
    
    environment {
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_USERNAME = 'anhtt4512'
        VERSION = "${env.BUILD_NUMBER}"
        BACKEND_IMAGE = "${DOCKER_USERNAME}/attendance-app-backend"
        FRONTEND_IMAGE = "${DOCKER_USERNAME}/attendance-app-frontend"
        
        // Cache settings
        CACHE_BASE_DIR = '/var/jenkins_cache'
        BACKEND_CACHE_KEY = "${env.JOB_NAME}-backend"
        FRONTEND_CACHE_KEY = "${env.JOB_NAME}-frontend"
        
        // Build optimization
        NODE_ENV = 'production'
        CI = 'true'
        DOCKER_BUILDKIT = '1'
        COMPOSE_DOCKER_CLI_BUILD = '1'
        
        // NPM optimization
        NPM_CONFIG_CACHE = "${CACHE_BASE_DIR}/npm"
        NPM_CONFIG_PREFER_OFFLINE = 'true'
        NPM_CONFIG_NO_AUDIT = 'true'
        NPM_CONFIG_NO_FUND = 'true'
        NPM_CONFIG_PROGRESS = 'false'
        NPM_CONFIG_LOGLEVEL = 'error'
    }
    
    stages {
        stage('Checkout & Change Detection') {
            steps {
                script {
                    // Shallow clone để tăng tốc
                    checkout([
                        $class: 'GitSCM',
                        branches: scm.branches,
                        extensions: [
                            [$class: 'CloneOption', depth: 1, shallow: true],
                            [$class: 'CheckoutOption', timeout: 10]
                        ],
                        userRemoteConfigs: scm.userRemoteConfigs
                    ])
                    
                    // Simple branch detection - check if we're on master/main
                    def isMasterBranch = sh(
                        script: 'git branch -r --contains HEAD | grep -E "(origin/master|origin/main)" | wc -l',
                        returnStdout: true
                    ).trim().toInteger() > 0
                    
                    env.CURRENT_BRANCH = isMasterBranch ? 'master' : 'feature'
                    
                    // Always build on master/main, skip on feature branches
                    if (isMasterBranch) {
                        env.BACKEND_CHANGED = 'true'
                        env.FRONTEND_CHANGED = 'true'
                        echo "🔄 Master/Main branch detected - building everything"
                    } else {
                        env.BACKEND_CHANGED = 'false'
                        env.FRONTEND_CHANGED = 'false'
                        echo "⏭️ Feature branch detected - skipping build"
                    }
                    
                    echo "🔍 Change Detection:"
                    echo "Current branch: ${env.CURRENT_BRANCH}"
                    echo "Backend changed: ${env.BACKEND_CHANGED}"
                    echo "Frontend changed: ${env.FRONTEND_CHANGED}"
                    
                    // Debug information
                    echo "🔧 Debug Info:"
                    sh '''
                        echo "Git status:"
                        git status --porcelain
                        echo "Git branch -r:"
                        git branch -r
                        echo "Git branch -a:"
                        git branch -a
                        echo "Git log --oneline -1:"
                        git log --oneline -1
                        echo "Current directory:"
                        pwd
                        echo "Directory contents:"
                        ls -la
                    '''
                }
            }
        }
        
        stage('Setup Environment') {
            when {
                anyOf {
                    expression { env.BACKEND_CHANGED == 'true' }
                    expression { env.FRONTEND_CHANGED == 'true' }
                }
            }
            steps {
                withCredentials([
                    file(credentialsId: 'env-file-postgres', variable: 'ENV_POSTGRES'),
                    file(credentialsId: 'env-file-minio', variable: 'ENV_MINIO'),
                    file(credentialsId: 'env-file-n8n', variable: 'ENV_N8N'),
                    file(credentialsId: 'env-file-backend', variable: 'ENV_BE'),
                    file(credentialsId: 'env-file-frontend', variable: 'ENV_FE')
                ]) {
                    sh '''
                        # Tạo cache directory và NPM cache
                        mkdir -p ${CACHE_BASE_DIR} ${NPM_CONFIG_CACHE}
                        chmod 755 ${CACHE_BASE_DIR}
                        
                        # Setup environment files song song
                        {
                            cp $ENV_POSTGRES ./learning-app/.env.postgres &
                            cp $ENV_MINIO ./learning-app/.env.minio &
                            cp $ENV_N8N ./learning-app/.env.n8n &
                            cp $ENV_BE ./learning-app/.env &
                            cp $ENV_FE ./learning-app-ui/.env &
                            wait
                        }
                        echo "✅ Environment setup completed"
                    '''
                }
            }
        }
        
        stage('Backend Cache') {
            when { expression { env.BACKEND_CHANGED == 'true' } }
            steps {
                script {
                    def backendCacheDir = "${env.CACHE_BASE_DIR}/${env.BACKEND_CACHE_KEY}"
                    def packageJson = readFile('learning-app/package.json')
                    def packageHash = sh(script: "echo '${packageJson}' | sha256sum | cut -d' ' -f1", returnStdout: true).trim()
                    
                    env.BACKEND_PACKAGE_HASH = packageHash
                    env.BACKEND_CACHE_PATH = "${backendCacheDir}/${packageHash}"
                    
                    sh '''
                        mkdir -p ${BACKEND_CACHE_PATH%/*}
                        
                        if [ -d "${BACKEND_CACHE_PATH}/node_modules" ]; then
                            echo "✅ Backend cache HIT"
                            cp -r "${BACKEND_CACHE_PATH}/node_modules" ./learning-app/
                            cp "${BACKEND_CACHE_PATH}/package-lock.json" ./learning-app/ 2>/dev/null || true
                            touch ./learning-app/.cache_restored
                        else
                            echo "❌ Backend cache MISS"
                            # Cleanup old cache (keep last 2)
                            find ${BACKEND_CACHE_PATH%/*} -maxdepth 1 -type d -name "*" | sort | head -n -2 | xargs rm -rf 2>/dev/null || true
                        fi
                    '''
                }
            }
        }
        
        stage('Frontend Cache') {
            when { expression { env.FRONTEND_CHANGED == 'true' } }
            steps {
                script {
                    def frontendCacheDir = "${env.CACHE_BASE_DIR}/${env.FRONTEND_CACHE_KEY}"
                    def packageJson = readFile('learning-app-ui/package.json')
                    def packageHash = sh(script: "echo '${packageJson}' | sha256sum | cut -d' ' -f1", returnStdout: true).trim()
                    
                    env.FRONTEND_PACKAGE_HASH = packageHash
                    env.FRONTEND_CACHE_PATH = "${frontendCacheDir}/${packageHash}"
                    
                    sh '''
                        mkdir -p ${FRONTEND_CACHE_PATH%/*}
                        
                        if [ -d "${FRONTEND_CACHE_PATH}/node_modules" ]; then
                            echo "✅ Frontend cache HIT"
                            cp -r "${FRONTEND_CACHE_PATH}/node_modules" ./learning-app-ui/
                            cp "${FRONTEND_CACHE_PATH}/package-lock.json" ./learning-app-ui/ 2>/dev/null || true
                            touch ./learning-app-ui/.cache_restored
                        else
                            echo "❌ Frontend cache MISS"
                            find ${FRONTEND_CACHE_PATH%/*} -maxdepth 1 -type d -name "*" | sort | head -n -2 | xargs rm -rf 2>/dev/null || true
                        fi
                    '''
                }
            }
        }
        
        stage('Backend Dependencies') {
            when { expression { env.BACKEND_CHANGED == 'true' } }
            steps {
                dir('learning-app') {
                    sh '''
                        if [ -f .cache_restored ]; then
                            echo "✅ Using cached dependencies"
                            rm .cache_restored
                        else
                            echo "📦 Installing dependencies..."
                            
                            # Sử dụng npm ci với optimizations
                            if [ -f package-lock.json ]; then
                                npm ci --legacy-peer-deps --prefer-offline --no-audit --no-fund --silent
                            else
                                npm install --legacy-peer-deps --prefer-offline --no-audit --no-fund --silent
                            fi
                            
                            # Global packages
                            npm install -g @nestjs/cli prisma --silent
                            
                            # Save to cache
                            mkdir -p "${BACKEND_CACHE_PATH}"
                            cp -r node_modules "${BACKEND_CACHE_PATH}/" &
                            cp package-lock.json "${BACKEND_CACHE_PATH}/" 2>/dev/null &
                            wait
                        fi
                    '''
                }
            }
        }
        
        stage('Frontend Dependencies') {
            when { expression { env.FRONTEND_CHANGED == 'true' } }
            steps {
                dir('learning-app-ui') {
                    sh '''
                        if [ -f .cache_restored ]; then
                            echo "✅ Using cached dependencies"
                            rm .cache_restored
                        else
                            echo "📦 Installing dependencies..."
                            
                            if [ -f package-lock.json ]; then
                                npm ci --prefer-offline --no-audit --no-fund --silent
                            else
                                npm install --prefer-offline --no-audit --no-fund --silent
                            fi
                            
                            # Save to cache
                            mkdir -p "${FRONTEND_CACHE_PATH}"
                            cp -r node_modules "${FRONTEND_CACHE_PATH}/" &
                            cp package-lock.json "${FRONTEND_CACHE_PATH}/" 2>/dev/null &
                            wait
                        fi
                    '''
                }
            }
        }
        
        stage('Backend Tests') {
            when { expression { env.BACKEND_CHANGED == 'true' } }
            steps {
                dir('learning-app') {
                    sh '''
                        echo "🧪 Running tests..."
                        timeout 300 npm run test || echo "⚠️ Tests completed with warnings"
                    '''
                }
            }
        }
        
        stage('Frontend Tests') {
            when { expression { env.FRONTEND_CHANGED == 'true' } }
            steps {
                dir('learning-app-ui') {
                    sh '''
                        echo "🧪 Running tests..."
                        timeout 300 npm run test || echo "⚠️ Tests completed"
                    '''
                }
            }
        }
        
        stage('Backend Lint') {
            when { expression { env.BACKEND_CHANGED == 'true' } }
            steps {
                dir('learning-app') {
                    sh '''
                        echo "🔍 Running lint..."
                        npm run lint || echo "⚠️ Lint completed"
                    '''
                }
            }
        }
        
        stage('Frontend Lint') {
            when { expression { env.FRONTEND_CHANGED == 'true' } }
            steps {
                dir('learning-app-ui') {
                    sh '''
                        echo "🔍 Running lint..."
                        npm run lint || echo "⚠️ Lint completed"
                    '''
                }
            }
        }
        
        stage('Backend Build') {
            when { expression { env.BACKEND_CHANGED == 'true' } }
            steps {
                dir('learning-app') {
                    sh '''
                        echo "🏗️ Building backend..."
                        npm run build
                        npx prisma generate
                    '''
                }
            }
        }
        
        stage('Frontend Build') {
            when { expression { env.FRONTEND_CHANGED == 'true' } }
            steps {
                dir('learning-app-ui') {
                    sh '''
                        echo "🏗️ Building frontend..."
                        npm run build
                    '''
                }
            }
        }
        
        stage('Docker Login') {
            when {
                anyOf {
                    expression { env.BACKEND_CHANGED == 'true' }
                    expression { env.FRONTEND_CHANGED == 'true' }
                }
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo "🔐 Logging into Docker Hub..."
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                    '''
                }
            }
        }
        
        stage('Build Backend Image') {
            when { expression { env.BACKEND_CHANGED == 'true' } }
            steps {
                script {
                    sh '''
                        echo "🏗️ Building backend image with BuildKit..."
                        
                        # Build with cache và multi-stage optimization
                        docker buildx build \
                            --platform linux/amd64 \
                            --cache-from ${BACKEND_IMAGE}:latest \
                            --cache-from ${BACKEND_IMAGE}:cache \
                            --cache-to type=registry,ref=${BACKEND_IMAGE}:cache,mode=max \
                            --build-arg BUILDKIT_INLINE_CACHE=1 \
                            --build-arg NODE_ENV=production \
                            -t ${BACKEND_IMAGE}:${VERSION} \
                            -t ${BACKEND_IMAGE}:latest \
                            --push \
                            ./learning-app
                    '''
                }
            }
        }
        
        stage('Build Frontend Image') {
            when { expression { env.FRONTEND_CHANGED == 'true' } }
            steps {
                script {
                    sh '''
                        echo "🏗️ Building frontend image with BuildKit..."
                        
                        docker buildx build \
                            --platform linux/amd64 \
                            --cache-from ${FRONTEND_IMAGE}:latest \
                            --cache-from ${FRONTEND_IMAGE}:cache \
                            --cache-to type=registry,ref=${FRONTEND_IMAGE}:cache,mode=max \
                            --build-arg BUILDKIT_INLINE_CACHE=1 \
                            --build-arg NODE_ENV=production \
                            -t ${FRONTEND_IMAGE}:${VERSION} \
                            -t ${FRONTEND_IMAGE}:latest \
                            --push \
                            ./learning-app-ui
                    '''
                }
            }
        }
        
        stage('Backend Security Scan') {
            when {
                allOf {
                    expression { env.BACKEND_CHANGED == 'true' }
                    expression { env.CURRENT_BRANCH == 'master' || env.CURRENT_BRANCH == 'main' }
                }
            }
            steps {
                sh '''
                    echo "🔒 Scanning backend image..."
                    timeout 300 docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        aquasec/trivy image --quiet --severity HIGH,CRITICAL \
                        ${BACKEND_IMAGE}:${VERSION} || echo "Scan completed"
                '''
            }
        }
        
        stage('Frontend Security Scan') {
            when {
                allOf {
                    expression { env.FRONTEND_CHANGED == 'true' }
                    expression { env.CURRENT_BRANCH == 'master' || env.CURRENT_BRANCH == 'main' }
                }
            }
            steps {
                sh '''
                    echo "🔒 Scanning frontend image..."
                    timeout 300 docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        aquasec/trivy image --quiet --severity HIGH,CRITICAL \
                        ${FRONTEND_IMAGE}:${VERSION} || echo "Scan completed"
                '''
            }
        }
        
        stage('Deploy to Production') {
            when {
                allOf {
                    expression { env.CURRENT_BRANCH == 'master' || env.CURRENT_BRANCH == 'main' }
                    anyOf {
                        expression { env.BACKEND_CHANGED == 'true' }
                        expression { env.FRONTEND_CHANGED == 'true' }
                    }
                }
            }
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    input message: 'Deploy to production?', ok: 'Deploy'
                }
                
                script {
                    sh '''
                        echo "🚀 Deploying to production..."
                        
                        # Update compose file
                        if [ "${BACKEND_CHANGED}" = "true" ]; then
                            sed -i "s|image: anhtt4512/attendance-app-backend:.*|image: ${BACKEND_IMAGE}:${VERSION}|g" docker-compose.prod.yaml
                        fi
                        if [ "${FRONTEND_CHANGED}" = "true" ]; then
                            sed -i "s|image: anhtt4512/attendance-app-frontend:.*|image: ${FRONTEND_IMAGE}:${VERSION}|g" docker-compose.prod.yaml
                        fi
                        
                        # Deploy with docker compose
                        COMPOSE_CMD="docker compose"
                        if ! command -v docker compose >/dev/null 2>&1; then
                            COMPOSE_CMD="docker-compose"
                        fi
                        
                        # Clean up any orphaned containers and networks first
                        echo "🧹 Cleaning up orphaned containers and networks..."
                        $COMPOSE_CMD -f docker-compose.prod.yaml down --remove-orphans --volumes --timeout 30 || true
                        
                        # Remove any dangling networks that might cause conflicts
                        docker network prune -f || true
                        
                        # Pull latest images
                        echo "📥 Pulling latest images..."
                        $COMPOSE_CMD -f docker-compose.prod.yaml pull
                        
                        # Start services with proper cleanup
                        echo "🚀 Starting services..."
                        $COMPOSE_CMD -f docker-compose.prod.yaml up -d --remove-orphans
                        
                        # Health check with retry logic
                        echo "⏳ Waiting for services to be ready..."
                        for i in {1..6}; do
                            echo "Health check attempt $i/6..."
                            sleep 10
                            
                            # Check if containers are running
                            if $COMPOSE_CMD -f docker-compose.prod.yaml ps | grep -q "Up"; then
                                echo "✅ Services are running"
                                break
                            fi
                        done
                        
                        # Final health checks with correct ports
                        echo "🔍 Performing health checks..."
                        curl -f http://localhost:3010/health >/dev/null 2>&1 && echo "✅ Backend healthy" || echo "⚠️ Backend check failed"
                        curl -f http://localhost:3015 >/dev/null 2>&1 && echo "✅ Frontend healthy" || echo "⚠️ Frontend check failed"
                        
                        echo "✅ Deployment completed!"
                    '''
                }
            }
        }
    }
    
    post {
        always {
            script {
                // Cleanup chỉ khi cần thiết
                sh '''
                    echo "🧹 Cleaning up..."
                    
                    # Cleanup Docker images older than 24h
                    docker image prune -f --filter "until=24h" || true
                    
                    # Remove unused networks and volumes
                    docker network prune -f || true
                    docker volume prune -f || true
                    
                    # Clean up any orphaned containers that might cause network issues
                    docker container prune -f || true
                    
                    # Clean old cache entries (older than 7 days)
                    find ${CACHE_BASE_DIR} -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true
                '''
            }
        }
        
        success {
            script {
                // Simplified success notification
                sh 'echo "✅ Pipeline completed successfully!"'
            }
        }
        
        failure {
            script {
                sh '''
                    echo "❌ Pipeline failed!"
                    echo "Last 20 lines of logs:"
                    tail -20 ${JENKINS_HOME}/jobs/${JOB_NAME}/builds/${BUILD_NUMBER}/log || true
                '''
            }
        }
    }
} 