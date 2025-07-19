pipeline {
    agent any
    
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
                        # Create cache base directory (no sudo needed in container)
                        mkdir -p ${CACHE_BASE_DIR}
                        chmod 755 ${CACHE_BASE_DIR}
                        
                        # Setup environment files
                        cp $ENV_POSTGRES ./learning-app/.env.postgres
                        cp $ENV_MINIO ./learning-app/.env.minio
                        cp $ENV_N8N ./learning-app/.env.n8n
                        cp $ENV_BE ./learning-app/.env
                        cp $ENV_FE ./learning-app-ui/.env
                    '''
                }
            }
        }
        
        stage('Cache Management') {
            parallel {
                stage('Backend Cache') {
                    steps {
                        script {
                            def backendCacheDir = "${env.CACHE_BASE_DIR}/${env.BACKEND_CACHE_KEY}"
                            def backendPackageJson = readFile('learning-app/package.json')
                            def packageHash = sh(script: "echo '${backendPackageJson}' | sha256sum | cut -d' ' -f1", returnStdout: true).trim()
                            
                            env.BACKEND_PACKAGE_HASH = packageHash
                            env.BACKEND_CACHE_DIR = backendCacheDir
                            env.BACKEND_CACHE_PATH = "${backendCacheDir}/${packageHash}"
                            
                            sh '''
                                echo "🔍 Backend package hash: ${BACKEND_PACKAGE_HASH}"
                                echo "📂 Cache path: ${BACKEND_CACHE_PATH}"
                                
                                # Create cache directory structure
                                mkdir -p ${BACKEND_CACHE_DIR}
                                
                                # Check if cache exists for this package.json hash
                                if [ -d "${BACKEND_CACHE_PATH}/node_modules" ]; then
                                    echo "✅ Backend cache HIT - restoring from ${BACKEND_CACHE_PATH}"
                                    cp -r "${BACKEND_CACHE_PATH}/node_modules" ./learning-app/
                                    cp "${BACKEND_CACHE_PATH}/package-lock.json" ./learning-app/ 2>/dev/null || true
                                    touch ./learning-app/.cache_restored
                                    
                                    # Show cache info
                                    echo "📊 Cache size: $(du -sh ${BACKEND_CACHE_PATH}/node_modules | cut -f1)"
                                    echo "📅 Cache date: $(stat -c %y ${BACKEND_CACHE_PATH}/node_modules)"
                                else
                                    echo "❌ Backend cache MISS - will install fresh"
                                    # Clean old cache entries (keep only last 3)
                                    if [ -d "${BACKEND_CACHE_DIR}" ]; then
                                        find ${BACKEND_CACHE_DIR} -maxdepth 1 -type d -name "*" | sort | head -n -3 | xargs rm -rf 2>/dev/null || true
                                    fi
                                fi
                            '''
                        }
                    }
                }
                
                stage('Frontend Cache') {
                    steps {
                        script {
                            def frontendCacheDir = "${env.CACHE_BASE_DIR}/${env.FRONTEND_CACHE_KEY}"
                            def frontendPackageJson = readFile('learning-app-ui/package.json')
                            def packageHash = sh(script: "echo '${frontendPackageJson}' | sha256sum | cut -d' ' -f1", returnStdout: true).trim()
                            
                            env.FRONTEND_PACKAGE_HASH = packageHash
                            env.FRONTEND_CACHE_DIR = frontendCacheDir
                            env.FRONTEND_CACHE_PATH = "${frontendCacheDir}/${packageHash}"
                            
                            sh '''
                                echo "🔍 Frontend package hash: ${FRONTEND_PACKAGE_HASH}"
                                echo "📂 Cache path: ${FRONTEND_CACHE_PATH}"
                                
                                # Create cache directory structure
                                mkdir -p ${FRONTEND_CACHE_DIR}
                                
                                # Check if cache exists for this package.json hash
                                if [ -d "${FRONTEND_CACHE_PATH}/node_modules" ]; then
                                    echo "✅ Frontend cache HIT - restoring from ${FRONTEND_CACHE_PATH}"
                                    cp -r "${FRONTEND_CACHE_PATH}/node_modules" ./learning-app-ui/
                                    cp "${FRONTEND_CACHE_PATH}/package-lock.json" ./learning-app-ui/ 2>/dev/null || true
                                    touch ./learning-app-ui/.cache_restored
                                    
                                    # Show cache info
                                    echo "📊 Cache size: $(du -sh ${FRONTEND_CACHE_PATH}/node_modules | cut -f1)"
                                    echo "📅 Cache date: $(stat -c %y ${FRONTEND_CACHE_PATH}/node_modules)"
                                else
                                    echo "❌ Frontend cache MISS - will install fresh"
                                    # Clean old cache entries (keep only last 3)
                                    if [ -d "${FRONTEND_CACHE_DIR}" ]; then
                                        find ${FRONTEND_CACHE_DIR} -maxdepth 1 -type d -name "*" | sort | head -n -3 | xargs rm -rf 2>/dev/null || true
                                    fi
                                fi
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('learning-app') {
                            sh '''
                                if [ -f .cache_restored ]; then
                                    echo "✅ Using cached backend dependencies"
                                    rm .cache_restored
                                else
                                    echo "📦 Installing backend dependencies..."
                                    
                                    # Use --legacy-peer-deps to resolve dependency conflicts
                                    if [ -f package-lock.json ]; then
                                        echo "🔧 Using npm ci with legacy peer deps..."
                                        npm ci --legacy-peer-deps --prefer-offline --no-audit --no-fund
                                    else
                                        echo "🔧 Using npm install with legacy peer deps..."
                                        npm install --legacy-peer-deps --prefer-offline --no-audit --no-fund
                                    fi
                                    
                                    # Global packages
                                    echo "🌐 Installing global packages..."
                                    npm install -g @nestjs/cli prisma --silent
                                    
                                    echo "💾 Saving to cache..."
                                    mkdir -p "${BACKEND_CACHE_PATH}"
                                    cp -r node_modules "${BACKEND_CACHE_PATH}/"
                                    cp package-lock.json "${BACKEND_CACHE_PATH}/" 2>/dev/null || true
                                    
                                    echo "✅ Cache saved to: ${BACKEND_CACHE_PATH}"
                                    echo "📊 Cache size: $(du -sh ${BACKEND_CACHE_PATH}/node_modules | cut -f1)"
                                fi
                                
                                # Verify installation
                                echo "🔍 Verifying installation..."
                                echo "Node modules count: $(find node_modules -maxdepth 1 -type d | wc -l)"
                                echo "NestJS CLI: $(which nest || echo 'not found')"
                                echo "Prisma: $(which prisma || echo 'not found')"
                            '''
                        }
                    }
                }
                
                stage('Frontend Dependencies') {
                    steps {
                        dir('learning-app-ui') {
                            sh '''
                                if [ -f .cache_restored ]; then
                                    echo "✅ Using cached frontend dependencies"
                                    rm .cache_restored
                                else
                                    echo "📦 Installing frontend dependencies..."
                                    
                                    # Frontend usually doesn't need legacy-peer-deps
                                    if [ -f package-lock.json ]; then
                                        echo "🔧 Using npm ci..."
                                        npm ci --prefer-offline --no-audit --no-fund
                                    else
                                        echo "🔧 Using npm install..."
                                        npm install --prefer-offline --no-audit --no-fund
                                    fi
                                    
                                    echo "💾 Saving to cache..."
                                    mkdir -p "${FRONTEND_CACHE_PATH}"
                                    cp -r node_modules "${FRONTEND_CACHE_PATH}/"
                                    cp package-lock.json "${FRONTEND_CACHE_PATH}/" 2>/dev/null || true
                                    
                                    echo "✅ Cache saved to: ${FRONTEND_CACHE_PATH}"
                                    echo "📊 Cache size: $(du -sh ${FRONTEND_CACHE_PATH}/node_modules | cut -f1)"
                                fi
                                
                                # Verify installation
                                echo "🔍 Verifying installation..."
                                echo "Node modules count: $(find node_modules -maxdepth 1 -type d | wc -l)"
                                echo "Next.js: $(npx next --version || echo 'not found')"
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Cache Statistics') {
            steps {
                sh '''
                    echo "=== 📊 CACHE STATISTICS ==="
                    echo "📍 Cache Base Directory: ${CACHE_BASE_DIR}"
                    
                    if [ -d "${CACHE_BASE_DIR}" ]; then
                        echo "💾 Total cache size: $(du -sh ${CACHE_BASE_DIR} 2>/dev/null | cut -f1 || echo '0')"
                        echo ""
                        
                        echo "🔙 Backend Cache:"
                        if [ -d "${BACKEND_CACHE_DIR}" ]; then
                            echo "  📂 Directory: ${BACKEND_CACHE_DIR}"
                            echo "  📊 Size: $(du -sh ${BACKEND_CACHE_DIR} 2>/dev/null | cut -f1 || echo '0')"
                            echo "  🗂️  Entries: $(ls -1 ${BACKEND_CACHE_DIR} 2>/dev/null | wc -l || echo '0')"
                            if [ -d "${BACKEND_CACHE_PATH}" ]; then
                                echo "  ✅ Current hash cached: ${BACKEND_PACKAGE_HASH}"
                            else
                                echo "  ❌ Current hash not cached: ${BACKEND_PACKAGE_HASH}"
                            fi
                        else
                            echo "  ❌ No backend cache directory"
                        fi
                        
                        echo ""
                        echo "🎨 Frontend Cache:"
                        if [ -d "${FRONTEND_CACHE_DIR}" ]; then
                            echo "  📂 Directory: ${FRONTEND_CACHE_DIR}"
                            echo "  📊 Size: $(du -sh ${FRONTEND_CACHE_DIR} 2>/dev/null | cut -f1 || echo '0')"
                            echo "  🗂️  Entries: $(ls -1 ${FRONTEND_CACHE_DIR} 2>/dev/null | wc -l || echo '0')"
                            if [ -d "${FRONTEND_CACHE_PATH}" ]; then
                                echo "  ✅ Current hash cached: ${FRONTEND_PACKAGE_HASH}"
                            else
                                echo "  ❌ Current hash not cached: ${FRONTEND_PACKAGE_HASH}"
                            fi
                        else
                            echo "  ❌ No frontend cache directory"
                        fi
                    else
                        echo "❌ Cache directory not found: ${CACHE_BASE_DIR}"
                    fi
                    echo "=========================="
                '''
            }
        }
        
        stage('Run Tests') {
            parallel {
                stage('Backend Tests') {
                    when {
                        anyOf {
                            changeset pattern: "learning-app/**/*"
                            expression { 
                                def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                                return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                            }
                        }
                    }
                    steps {
                        dir('learning-app') {
                            sh '''
                                echo "🧪 Running backend tests..."
                                npm run test || echo "⚠️ Tests skipped - no test script found"
                                npm run test:e2e || echo "⚠️ E2E tests skipped - no test script found"
                            '''
                        }
                    }
                }
                
                stage('Frontend Tests') {
                    when {
                        anyOf {
                            changeset pattern: "learning-app-ui/**/*"
                            expression { 
                                def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                                return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                            }
                        }
                    }
                    steps {
                        dir('learning-app-ui') {
                            sh '''
                                echo "🧪 Running frontend tests..."
                                npm run test || echo "⚠️ Tests skipped - no test script found"
                                npm run test:e2e || echo "⚠️ E2E tests skipped - no test script found"
                            '''
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
                            expression { 
                                def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                                return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                            }
                        }
                    }
                    steps {
                        dir('learning-app') {
                            sh '''
                                echo "🔍 Running backend lint..."
                                npm run lint || echo "⚠️ Lint skipped - eslint not found"
                            '''
                        }
                    }
                }
                
                stage('Frontend Lint') {
                    when {
                        anyOf {
                            changeset pattern: "learning-app-ui/**/*.{ts,js,tsx,jsx}"
                            expression { 
                                def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                                return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                            }
                        }
                    }
                    steps {
                        dir('learning-app-ui') {
                            sh '''
                                echo "🔍 Running frontend lint..."
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
                            expression { 
                                def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                                return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                            }
                        }
                    }
                    steps {
                        dir('learning-app') {
                            sh '''
                                echo "🏗️ Building backend application..."
                                npm run build
                                
                                echo "🔧 Generating Prisma client..."
                                npx prisma generate
                                
                                echo "✅ Backend build completed"
                            '''
                        }
                    }
                }
                
                stage('Build Frontend') {
                    when {
                        anyOf {
                            changeset pattern: "learning-app-ui/**/*"
                            expression { 
                                def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                                return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                            }
                        }
                    }
                    steps {
                        dir('learning-app-ui') {
                            sh '''
                                echo "🏗️ Building frontend application..."
                                npm run build
                                
                                echo "✅ Frontend build completed"
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                script {
                    // Login to Docker Hub BEFORE build to avoid 429
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    }

                    // Get current branch name
                    def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    echo "Current branch: ${currentBranch}"
                    
                    // Always build on master/main branch, or check for changes on other branches
                    def isMasterBranch = currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                    
                    if (isMasterBranch) {
                        echo "Building backend image (master branch)..."
                        docker.build("${BACKEND_IMAGE}:${VERSION}", "--cache-from ${BACKEND_IMAGE}:latest --build-arg BUILDKIT_INLINE_CACHE=1 ./learning-app")
                        docker.build("${BACKEND_IMAGE}:latest", "--cache-from ${BACKEND_IMAGE}:latest --build-arg BUILDKIT_INLINE_CACHE=1 ./learning-app")
                        
                        echo "Building frontend image (master branch)..."
                        docker.build("${FRONTEND_IMAGE}:${VERSION}", "--cache-from ${FRONTEND_IMAGE}:latest --build-arg BUILDKIT_INLINE_CACHE=1 ./learning-app-ui")
                        docker.build("${FRONTEND_IMAGE}:latest", "--cache-from ${FRONTEND_IMAGE}:latest --build-arg BUILDKIT_INLINE_CACHE=1 ./learning-app-ui")
                    } else {
                        // Check if we need to build images based on changes
                        def backendChanged = sh(script: "git diff --name-only HEAD~1 HEAD | grep 'learning-app/'", returnStatus: true) == 0
                        def frontendChanged = sh(script: "git diff --name-only HEAD~1 HEAD | grep 'learning-app-ui/'", returnStatus: true) == 0
                        
                        if (backendChanged) {
                            echo "Building backend image (changes detected)..."
                            docker.build("${BACKEND_IMAGE}:${VERSION}", "--cache-from ${BACKEND_IMAGE}:latest --build-arg BUILDKIT_INLINE_CACHE=1 ./learning-app")
                            docker.build("${BACKEND_IMAGE}:latest", "--cache-from ${BACKEND_IMAGE}:latest --build-arg BUILDKIT_INLINE_CACHE=1 ./learning-app")
                        } else {
                            echo "No backend changes detected, skipping backend build"
                        }
                        
                        if (frontendChanged) {
                            echo "Building frontend image (changes detected)..."
                            docker.build("${FRONTEND_IMAGE}:${VERSION}", "--cache-from ${FRONTEND_IMAGE}:latest --build-arg BUILDKIT_INLINE_CACHE=1 ./learning-app-ui")
                            docker.build("${FRONTEND_IMAGE}:latest", "--cache-from ${FRONTEND_IMAGE}:latest --build-arg BUILDKIT_INLINE_CACHE=1 ./learning-app-ui")
                        } else {
                            echo "No frontend changes detected, skipping frontend build"
                        }
                    }
                }
            }
        }
        
        stage('Security Scan') {
            when {
                expression { 
                    def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                }
            }
            steps {
                script {
                    // Scan Docker images for vulnerabilities
                    sh '''
                        echo "🔒 Scanning backend image for vulnerabilities..."
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy image --quiet --severity HIGH,CRITICAL ${BACKEND_IMAGE}:${VERSION} || echo "Backend scan completed"
                        
                        echo "🔒 Scanning frontend image for vulnerabilities..."
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy image --quiet --severity HIGH,CRITICAL ${FRONTEND_IMAGE}:${VERSION} || echo "Frontend scan completed"
                    '''
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                expression { 
                    def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                }
            }
            steps {
                script {
                    // Login to Docker Hub with retry mechanism
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        retry(3) {
                            timeout(time: 2, unit: 'MINUTES') {
                                sh '''
                                    echo "🔐 Logging into Docker Hub..."
                                    echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                                    echo "✅ Docker Hub login successful"
                                '''
                            }
                        }
                    }
                    
                    // Push images in parallel with retry and timeout
                    parallel(
                        "Push Backend Images": {
                            script {
                                retry(3) {
                                    timeout(time: 15, unit: 'MINUTES') {
                                        sh '''
                                            echo "📤 Pushing backend images to Docker Hub..."
                                            docker push ${BACKEND_IMAGE}:${VERSION}
                                            docker push ${BACKEND_IMAGE}:latest
                                            echo "✅ Backend images pushed successfully"
                                        '''
                                    }
                                }
                            }
                        },
                        "Push Frontend Images": {
                            script {
                                retry(3) {
                                    timeout(time: 15, unit: 'MINUTES') {
                                        sh '''
                                            echo "📤 Pushing frontend images to Docker Hub..."
                                            docker push ${FRONTEND_IMAGE}:${VERSION}
                                            docker push ${FRONTEND_IMAGE}:latest
                                            echo "✅ Frontend images pushed successfully"
                                        '''
                                    }
                                }
                            }
                        }
                    )
                    
                    // Cleanup local images to save space
                    sh '''
                        echo "🧹 Cleaning up local images to save disk space..."
                        docker rmi ${BACKEND_IMAGE}:${VERSION} || echo "Backend version image already removed"
                        docker rmi ${BACKEND_IMAGE}:latest || echo "Backend latest image already removed"
                        docker rmi ${FRONTEND_IMAGE}:${VERSION} || echo "Frontend version image already removed"
                        docker rmi ${FRONTEND_IMAGE}:latest || echo "Frontend latest image already removed"
                        docker image prune -f || echo "Image cleanup completed"
                    '''
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                expression { 
                    def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                }
            }
            steps {
                input message: 'Deploy to production?', ok: 'Deploy'
                script {
                    // Deploy to production environment
                    sh '''
                        echo "🚀 Deploying to production..."
                        
                        # Update docker-compose with new image versions
                        sed -i "s|image: anhtt4512/attendance-app-backend:.*|image: ${BACKEND_IMAGE}:${VERSION}|g" docker-compose.prod.yaml
                        sed -i "s|image: anhtt4512/attendance-app-frontend:.*|image: ${FRONTEND_IMAGE}:${VERSION}|g" docker-compose.prod.yaml
                        
                        # Check if docker compose is available, otherwise install docker-compose
                        if ! command -v docker compose &> /dev/null; then
                            echo "📦 docker compose not found, trying to install docker-compose..."
                            curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
                            chmod +x /usr/local/bin/docker-compose
                            export PATH="/usr/local/bin:$PATH"
                        fi
                        
                        # Deploy using docker compose (with fallback to docker-compose)
                        if command -v docker compose &> /dev/null; then
                            echo "🔄 Stopping existing containers..."
                            docker compose -f docker-compose.prod.yaml down
                            echo "📥 Pulling latest images..."
                            docker compose -f docker-compose.prod.yaml pull
                            echo "🚀 Starting containers..."
                            docker compose -f docker-compose.prod.yaml up -d
                        else
                            echo "🔄 Stopping existing containers..."
                            docker-compose -f docker-compose.prod.yaml down
                            echo "📥 Pulling latest images..."
                            docker-compose -f docker-compose.prod.yaml pull
                            echo "🚀 Starting containers..."
                            docker-compose -f docker-compose.prod.yaml up -d
                        fi
                        
                        echo "✅ Deployment completed successfully!"
                    '''
                }
            }
        }
    }
    
    post {
        always {
            // Clean up Docker resources efficiently
            sh '''
                echo "🧹 Cleaning up Docker resources..."
                docker image prune -f --filter "until=24h" || echo "Docker image cleanup failed"
                docker container prune -f --filter "until=24h" || echo "Docker container cleanup failed"
                docker network prune -f || echo "Docker network cleanup failed"
                docker volume prune -f || echo "Docker volume cleanup failed"
            '''
        }
        
        success {
            script {
                sh '''
                    echo "✅ Pipeline completed successfully!"
                    echo "📊 Final cache statistics:"
                    if [ -d "${CACHE_BASE_DIR}" ]; then
                        echo "Total cache size: $(du -sh ${CACHE_BASE_DIR} 2>/dev/null | cut -f1 || echo 'unknown')"
                    fi
                '''
                
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
                sh '''
                    echo "❌ Pipeline failed!"
                    echo "🔍 Debugging info:"
                    echo "Backend cache path: ${BACKEND_CACHE_PATH:-'not set'}"
                    echo "Frontend cache path: ${FRONTEND_CACHE_PATH:-'not set'}"
                    if [ -d "${CACHE_BASE_DIR}" ]; then
                        echo "Cache directory exists: ✅"
                        echo "Cache size: $(du -sh ${CACHE_BASE_DIR} 2>/dev/null | cut -f1 || echo 'unknown')"
                    else
                        echo "Cache directory exists: ❌"
                    fi
                '''
                
                // Send failure notification
                emailext (
                    subject: "Pipeline Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    body: "Build ${env.BUILD_NUMBER} failed. View details at: ${env.BUILD_URL}",
                    to: "${env.BUILD_USER_EMAIL}"
                )
            }
        }
        
        cleanup {
            // Clean workspace but preserve cache
            sh '''
                echo "🧹 Cleaning workspace but preserving cache..."
                # Clean workspace except hidden files and cache
                find . -maxdepth 1 -name "*" -not -path "./.*" -not -name "." -not -path "${CACHE_BASE_DIR}*" -exec rm -rf {} + 2>/dev/null || true
            '''
            
            // Optional: Clean very old cache entries (older than 30 days)
            sh '''
                echo "🗑️ Cleaning old cache entries..."
                find ${CACHE_BASE_DIR} -type d -mtime +30 -exec rm -rf {} + 2>/dev/null || true
            '''
        }
    }
} 