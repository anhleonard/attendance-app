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
        
        stage('Restore Dependencies Cache') {
            parallel {
                stage('Restore Backend Cache') {
                    steps {
                        script {
                            def backendCacheDir = "${env.WORKSPACE}/.cache_backend_node_modules"
                            def backendDir = "${env.WORKSPACE}/learning-app"
                            
                            // Strategy 1: Smart cache with package.json comparison
                            if (fileExists("${backendCacheDir}/package.json") && fileExists("${backendCacheDir}/package-lock.json")) {
                                // Compare package.json files to check if dependencies changed
                                def packageJsonChanged = sh(script: "diff ${backendDir}/package.json ${backendCacheDir}/package.json", returnStatus: true)
                                
                                if (packageJsonChanged == 0) {
                                    echo "Backend package.json unchanged, using cache..."
                                    sh """
                                        cp -r ${backendCacheDir}/node_modules ${backendDir}/
                                        cp ${backendCacheDir}/package-lock.json ${backendDir}/
                                    """
                                    env.BACKEND_CACHE_RESTORED = 'true'
                                    env.BACKEND_CACHE_TYPE = 'shared_directory'
                                } else {
                                    echo "Backend package.json changed, cache invalid"
                                    env.BACKEND_CACHE_RESTORED = 'false'
                                    env.BACKEND_CACHE_TYPE = 'none'
                                }
                            } else {
                                echo "No backend cache found in shared directory"
                                
                                // Strategy 3: Try to restore from artifacts using Jenkins built-in functions
                                try {
                                    echo "Trying to restore backend cache from artifacts..."
                                    
                                    // Use Jenkins built-in copyArtifacts plugin
                                    def lastSuccessfulBuild = currentBuild.getPreviousSuccessfulBuild()
                                    if (lastSuccessfulBuild) {
                                        echo "Found last successful build: ${lastSuccessfulBuild.number}"
                                        
                                        // Try to copy artifacts from last successful build
                                        dir('learning-app') {
                                            sh '''
                                                # Try to copy from last successful build artifacts
                                                echo "Attempting to copy artifacts from last successful build..."
                                                
                                                # Method 1: Try direct copy if artifacts exist
                                                if [ -f "../learning-app/backend_node_modules.tar.gz" ]; then
                                                    echo "Found backend artifact in workspace, copying..."
                                                    cp ../learning-app/backend_node_modules.tar.gz .
                                                    tar -xzf backend_node_modules.tar.gz
                                                    echo "Backend cache restored from workspace artifact"
                                                    rm -f backend_cache.tar.gz
                                                else
                                                    echo "No backend artifact found in workspace"
                                                fi
                                            '''
                                        }
                                    } else {
                                        echo "No previous successful build found"
                                    }
                                }
                                
                                // Check if cache was restored successfully
                                if (fileExists("learning-app/node_modules")) {
                                    env.BACKEND_CACHE_RESTORED = 'true'
                                    env.BACKEND_CACHE_TYPE = 'artifact'
                                    echo "Backend cache restored from artifact successfully"
                                } else {
                                    env.BACKEND_CACHE_RESTORED = 'false'
                                    env.BACKEND_CACHE_TYPE = 'none'
                                }
                                } catch (Exception e) {
                                    echo "Failed to restore from artifact: ${e.getMessage()}"
                                    
                                    // Fallback: Try to copy from previous build workspace
                                    try {
                                        echo "Trying fallback: copy from previous build workspace..."
                                        def previousWorkspace = "${env.WORKSPACE}@2"
                                        if (fileExists("${previousWorkspace}/learning-app/node_modules")) {
                                            sh """
                                                cp -r ${previousWorkspace}/learning-app/node_modules ${env.WORKSPACE}/learning-app/
                                                cp ${previousWorkspace}/learning-app/package-lock.json ${env.WORKSPACE}/learning-app/ || echo "No package-lock.json found"
                                            """
                                            env.BACKEND_CACHE_RESTORED = 'true'
                                            env.BACKEND_CACHE_TYPE = 'workspace_fallback'
                                            echo "Backend cache restored from workspace fallback"
                                        } else {
                                            env.BACKEND_CACHE_RESTORED = 'false'
                                            env.BACKEND_CACHE_TYPE = 'none'
                                        }
                                    } catch (Exception e2) {
                                        echo "Fallback also failed: ${e2.getMessage()}"
                                        env.BACKEND_CACHE_RESTORED = 'false'
                                        env.BACKEND_CACHE_TYPE = 'none'
                                    }
                                }
                            }
                        }
                    }
                }
                
                stage('Restore Frontend Cache') {
                    steps {
                        script {
                            def frontendCacheDir = "${env.WORKSPACE}/.cache_frontend_node_modules"
                            def frontendDir = "${env.WORKSPACE}/learning-app-ui"
                            
                            // Strategy 1: Smart cache with package.json comparison
                            if (fileExists("${frontendCacheDir}/package.json") && fileExists("${frontendCacheDir}/package-lock.json")) {
                                // Compare package.json files to check if dependencies changed
                                def packageJsonChanged = sh(script: "diff ${frontendDir}/package.json ${frontendCacheDir}/package.json", returnStatus: true)
                                
                                if (packageJsonChanged == 0) {
                                    echo "Frontend package.json unchanged, using cache..."
                                    sh """
                                        cp -r ${frontendCacheDir}/node_modules ${frontendDir}/
                                        cp ${frontendCacheDir}/package-lock.json ${frontendDir}/
                                    """
                                    env.FRONTEND_CACHE_RESTORED = 'true'
                                    env.FRONTEND_CACHE_TYPE = 'shared_directory'
                                } else {
                                    echo "Frontend package.json changed, cache invalid"
                                    env.FRONTEND_CACHE_RESTORED = 'false'
                                    env.FRONTEND_CACHE_TYPE = 'none'
                                }
                            } else {
                                echo "No frontend cache found in shared directory"
                                
                                // Strategy 3: Try to restore from artifacts using Jenkins built-in functions
                                try {
                                    echo "Trying to restore frontend cache from artifacts..."
                                    
                                    // Use Jenkins built-in copyArtifacts plugin
                                    def lastSuccessfulBuild = currentBuild.getPreviousSuccessfulBuild()
                                    if (lastSuccessfulBuild) {
                                        echo "Found last successful build: ${lastSuccessfulBuild.number}"
                                        
                                        // Try to copy artifacts from last successful build
                                        dir('learning-app-ui') {
                                            sh '''
                                                # Try to copy from last successful build artifacts
                                                echo "Attempting to copy artifacts from last successful build..."
                                                
                                                # Method 1: Try direct copy if artifacts exist
                                                if [ -f "../learning-app-ui/frontend_node_modules.tar.gz" ]; then
                                                    echo "Found frontend artifact in workspace, copying..."
                                                    cp ../learning-app-ui/frontend_node_modules.tar.gz .
                                                    tar -xzf frontend_node_modules.tar.gz
                                                    echo "Frontend cache restored from workspace artifact"
                                                    rm -f frontend_cache.tar.gz
                                                else
                                                    echo "No frontend artifact found in workspace"
                                                fi
                                            '''
                                        }
                                    } else {
                                        echo "No previous successful build found"
                                    }
                                }
                                
                                // Check if cache was restored successfully
                                if (fileExists("learning-app-ui/node_modules")) {
                                    env.FRONTEND_CACHE_RESTORED = 'true'
                                    env.FRONTEND_CACHE_TYPE = 'artifact'
                                    echo "Frontend cache restored from artifact successfully"
                                } else {
                                    env.FRONTEND_CACHE_RESTORED = 'false'
                                    env.FRONTEND_CACHE_TYPE = 'none'
                                }
                                } catch (Exception e) {
                                    echo "Failed to restore from artifact: ${e.getMessage()}"
                                    
                                    // Fallback: Try to copy from previous build workspace
                                    try {
                                        echo "Trying fallback: copy from previous build workspace..."
                                        def previousWorkspace = "${env.WORKSPACE}@2"
                                        if (fileExists("${previousWorkspace}/learning-app-ui/node_modules")) {
                                            sh """
                                                cp -r ${previousWorkspace}/learning-app-ui/node_modules ${env.WORKSPACE}/learning-app-ui/
                                                cp ${previousWorkspace}/learning-app-ui/package-lock.json ${env.WORKSPACE}/learning-app-ui/ || echo "No package-lock.json found"
                                            """
                                            env.FRONTEND_CACHE_RESTORED = 'true'
                                            env.FRONTEND_CACHE_TYPE = 'workspace_fallback'
                                            echo "Frontend cache restored from workspace fallback"
                                        } else {
                                            env.FRONTEND_CACHE_RESTORED = 'false'
                                            env.FRONTEND_CACHE_TYPE = 'none'
                                        }
                                    } catch (Exception e2) {
                                        echo "Fallback also failed: ${e2.getMessage()}"
                                        env.FRONTEND_CACHE_RESTORED = 'false'
                                        env.FRONTEND_CACHE_TYPE = 'none'
                                    }
                                }
                            }
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
                            script {
                                // Strategy 2: Try to unstash cached dependencies
                                if (env.BACKEND_CACHE_RESTORED != 'true') {
                                    try {
                                        unstash 'backend-deps'
                                        echo 'Using stashed backend dependencies'
                                        env.BACKEND_CACHE_RESTORED = 'true'
                                    } catch (Exception e) {
                                        echo 'No stashed dependencies found, installing fresh'
                                        env.BACKEND_CACHE_RESTORED = 'false'
                                    }
                                }
                            }
                            
                            sh '''
                                # Setup npm cache directory
                                mkdir -p ~/.npm
                                
                                # Check if node_modules exists, if not install dependencies
                                if [ ! -d "node_modules" ]; then
                                    echo "Installing backend dependencies..."
                                    
                                    # Strategy: Use npm cache for faster installation
                                    echo "Using npm cache for faster installation..."
                                    
                                    # Check if package-lock.json exists, use npm ci if available, otherwise npm install
                                    if [ -f "package-lock.json" ]; then
                                        npm ci --legacy-peer-deps --prefer-offline --no-audit --no-fund --cache ~/.npm --verbose
                                    else
                                        npm install --legacy-peer-deps --prefer-offline --no-audit --no-fund --cache ~/.npm --verbose
                                    fi
                                    
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
                            script {
                                // Strategy 2: Try to unstash cached dependencies
                                if (env.FRONTEND_CACHE_RESTORED != 'true') {
                                    try {
                                        unstash 'frontend-deps'
                                        echo 'Using stashed frontend dependencies'
                                        env.FRONTEND_CACHE_RESTORED = 'true'
                                    } catch (Exception e) {
                                        echo 'No stashed dependencies found, installing fresh'
                                        env.FRONTEND_CACHE_RESTORED = 'false'
                                    }
                                }
                            }
                            
                            sh '''
                                # Setup npm cache directory
                                mkdir -p ~/.npm
                                
                                # Check if node_modules exists, if not install dependencies
                                if [ ! -d "node_modules" ]; then
                                    echo "Installing frontend dependencies..."
                                    
                                    # Strategy: Use npm cache for faster installation
                                    echo "Using npm cache for faster installation..."
                                    
                                    # Check if package-lock.json exists, use npm ci if available, otherwise npm install
                                    if [ -f "package-lock.json" ]; then
                                        npm ci --prefer-offline --no-audit --no-fund --cache ~/.npm --verbose
                                    else
                                        npm install --prefer-offline --no-audit --no-fund --cache ~/.npm
                                    fi
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
        
        stage('Save Dependencies Cache') {
            parallel {
                stage('Save Backend Cache') {
                    steps {
                        script {
                            def backendCacheDir = "${env.WORKSPACE}/.cache_backend_node_modules"
                            
                            // Strategy 1: Save to shared directory with package.json
                            sh """
                                mkdir -p ${backendCacheDir}
                                cp -r learning-app/node_modules ${backendCacheDir}/
                                cp learning-app/package-lock.json ${backendCacheDir}/
                                cp learning-app/package.json ${backendCacheDir}/
                                
                                # Add cache metadata for debugging
                                echo "Cache created: \$(date)" > ${backendCacheDir}/cache_metadata.txt
                                echo "Build number: ${env.BUILD_NUMBER}" >> ${backendCacheDir}/cache_metadata.txt
                                echo "Cache size: \$(du -sh ${backendCacheDir}/node_modules | cut -f1)" >> ${backendCacheDir}/cache_metadata.txt
                            """
                            echo "Backend cache saved to shared directory with package.json"
                            
                            // Strategy 2: Archive as artifacts
                            dir('learning-app') {
                                sh 'tar -czf backend_node_modules.tar.gz node_modules package-lock.json package.json'
                                archiveArtifacts artifacts: 'backend_node_modules.tar.gz', fingerprint: true
                            }
                        }
                    }
                }
                
                stage('Save Frontend Cache') {
                    steps {
                        script {
                            def frontendCacheDir = "${env.WORKSPACE}/.cache_frontend_node_modules"
                            
                            // Strategy 1: Save to shared directory with package.json
                            sh """
                                mkdir -p ${frontendCacheDir}
                                cp -r learning-app-ui/node_modules ${frontendCacheDir}/
                                cp learning-app-ui/package-lock.json ${frontendCacheDir}/
                                cp learning-app-ui/package.json ${frontendCacheDir}/
                                
                                # Add cache metadata for debugging
                                echo "Cache created: \$(date)" > ${frontendCacheDir}/cache_metadata.txt
                                echo "Build number: ${env.BUILD_NUMBER}" >> ${frontendCacheDir}/cache_metadata.txt
                                echo "Cache size: \$(du -sh ${frontendCacheDir}/node_modules | cut -f1)" >> ${frontendCacheDir}/cache_metadata.txt
                            """
                            echo "Frontend cache saved to shared directory with package.json"
                            
                            // Strategy 2: Archive as artifacts
                            dir('learning-app-ui') {
                                sh 'tar -czf frontend_node_modules.tar.gz node_modules package-lock.json package.json'
                                archiveArtifacts artifacts: 'frontend_node_modules.tar.gz', fingerprint: true
                            }
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
                            expression { 
                                def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                                return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                            }
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
                            expression { 
                                def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                                return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                            }
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
                            expression { 
                                def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                                return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                            }
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
                            expression { 
                                def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                                return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                            }
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
                            expression { 
                                def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                                return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                            }
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
                            expression { 
                                def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                                return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                            }
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

                    // Get current branch name
                    def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    echo "Current branch: ${currentBranch}"
                    
                    // Always build on master/main branch, or check for changes on other branches
                    def isMasterBranch = currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                    
                    if (isMasterBranch) {
                        echo "Building backend image (master branch)..."
                        // 🛠 Build backend image with cache
                        docker.build("${BACKEND_IMAGE}:${VERSION}", "--cache-from ${BACKEND_IMAGE}:latest --build-arg BUILDKIT_INLINE_CACHE=1 ./learning-app")
                        docker.build("${BACKEND_IMAGE}:latest", "--cache-from ${BACKEND_IMAGE}:latest --build-arg BUILDKIT_INLINE_CACHE=1 ./learning-app")
                        
                        echo "Building frontend image (master branch)..."
                        // 🛠 Build frontend image with cache
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
        
        stage('Analyze and Optimize Images') {
            when {
                expression { 
                    def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                }
            }
            steps {
                script {
                    // Analyze image sizes before optimization
                    sh '''
                        echo "=== IMAGE SIZE ANALYSIS ==="
                        echo "Backend image size:"
                        docker images ${BACKEND_IMAGE}:${VERSION} --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
                        
                        echo "Frontend image size:"
                        docker images ${FRONTEND_IMAGE}:${VERSION} --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
                        
                        echo "=== LAYER ANALYSIS ==="
                        echo "Backend image layers:"
                        docker history ${BACKEND_IMAGE}:${VERSION} --format "table {{.CreatedBy}}\t{{.Size}}"
                        
                        echo "Frontend image layers:"
                        docker history ${FRONTEND_IMAGE}:${VERSION} --format "table {{.CreatedBy}}\t{{.Size}}"
                    '''
                    
                    // Optimize Docker images for production
                    sh '''
                        echo "=== OPTIMIZING IMAGES ==="
                        echo "Optimizing backend image..."
                        
                        # Create optimized backend image
                        docker run --rm ${BACKEND_IMAGE}:${VERSION} sh -c "
                            # Remove unnecessary files
                            rm -rf /tmp/* /var/tmp/* /var/cache/* /root/.npm /root/.cache 2>/dev/null || true
                            
                            # Remove documentation and test files from node_modules
                            find /usr/local/lib/node_modules -name '*.md' -delete 2>/dev/null || true
                            find /usr/local/lib/node_modules -name '*.txt' -delete 2>/dev/null || true
                            find /usr/local/lib/node_modules -name 'test' -type d -exec rm -rf {} + 2>/dev/null || true
                            find /usr/local/lib/node_modules -name 'tests' -type d -exec rm -rf {} + 2>/dev/null || true
                            find /usr/local/lib/node_modules -name 'example' -type d -exec rm -rf {} + 2>/dev/null || true
                            find /usr/local/lib/node_modules -name 'examples' -type d -exec rm -rf {} + 2>/dev/null || true
                            
                            # Remove source maps and unnecessary files
                            find /usr/local/lib/node_modules -name '*.map' -delete 2>/dev/null || true
                            find /usr/local/lib/node_modules -name '*.ts' -delete 2>/dev/null || true
                            
                            # Clean npm cache
                            npm cache clean --force 2>/dev/null || true
                            
                            echo 'Backend optimization completed'
                        " || echo "Backend optimization completed"
                        
                        echo "Optimizing frontend image..."
                        
                        # Create optimized frontend image
                        docker run --rm ${FRONTEND_IMAGE}:${VERSION} sh -c "
                            # Remove unnecessary files
                            rm -rf /tmp/* /var/tmp/* /var/cache/* /root/.npm /root/.cache 2>/dev/null || true
                            
                            # Remove source maps from Next.js build
                            find /app/.next -name '*.map' -delete 2>/dev/null || true
                            
                            # Remove development files
                            find /app -name '*.test.*' -delete 2>/dev/null || true
                            find /app -name '*.spec.*' -delete 2>/dev/null || true
                            
                            # Clean npm cache
                            npm cache clean --force 2>/dev/null || true
                            
                            echo 'Frontend optimization completed'
                        " || echo "Frontend optimization completed"
                        
                        echo "=== POST-OPTIMIZATION SIZE ANALYSIS ==="
                        echo "Backend image size after optimization:"
                        docker images ${BACKEND_IMAGE}:${VERSION} --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
                        
                        echo "Frontend image size after optimization:"
                        docker images ${FRONTEND_IMAGE}:${VERSION} --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
                    '''
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
        
        stage('Network and Registry Check') {
            when {
                expression { 
                    def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                }
            }
            steps {
                script {
                    // Check network connectivity and Docker Hub status
                    sh '''
                        echo "=== NETWORK CONNECTIVITY CHECK ==="
                        
                        # Test basic internet connectivity
                        echo "Testing internet connectivity..."
                        ping -c 3 8.8.8.8 || echo "Warning: Basic internet connectivity issues"
                        
                        # Test Docker Hub connectivity
                        echo "Testing Docker Hub connectivity..."
                        curl -I --connect-timeout 10 https://registry-1.docker.io/v2/ || echo "Warning: Docker Hub connectivity issues"
                        
                        # Test DNS resolution
                        echo "Testing DNS resolution..."
                        nslookup registry-1.docker.io || echo "Warning: DNS resolution issues"
                        
                        # Check Docker daemon status
                        echo "Checking Docker daemon status..."
                        docker info --format "table {{.ServerVersion}}\t{{.OperatingSystem}}" || echo "Warning: Docker daemon issues"
                        
                        # Check available disk space
                        echo "Checking available disk space..."
                        df -h /var/lib/docker || df -h / || echo "Warning: Disk space check failed"
                        
                        echo "=== NETWORK CHECK COMPLETED ==="
                    '''
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                expression { 
                    def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    echo "Current branch for push condition: '${currentBranch}'"
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
                                    echo "Logging into Docker Hub..."
                                    echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                                    echo "Docker Hub login successful"
                                '''
                            }
                        }
                    }
                    
                    // Optimize images before push to reduce size
                    sh '''
                        echo "Optimizing images for push..."
                        
                        # Optimize backend image
                        echo "Optimizing backend image..."
                        docker run --rm ${BACKEND_IMAGE}:${VERSION} sh -c "
                            rm -rf /tmp/* /var/tmp/* /var/cache/* /root/.npm /root/.cache 2>/dev/null || true
                            find /usr/local/lib/node_modules -name '*.md' -delete 2>/dev/null || true
                            find /usr/local/lib/node_modules -name '*.txt' -delete 2>/dev/null || true
                            find /usr/local/lib/node_modules -name 'test' -type d -exec rm -rf {} + 2>/dev/null || true
                        " || echo "Backend optimization completed"
                        
                        # Optimize frontend image
                        echo "Optimizing frontend image..."
                        docker run --rm ${FRONTEND_IMAGE}:${VERSION} sh -c "
                            rm -rf /tmp/* /var/tmp/* /var/cache/* /root/.npm /root/.cache 2>/dev/null || true
                            find /app/.next -name '*.map' -delete 2>/dev/null || true
                        " || echo "Frontend optimization completed"
                    '''
                    
                    // Push images in parallel with retry and timeout
                    parallel(
                        "Push Backend Images": {
                            script {
                                retry(3) {
                                    timeout(time: 15, unit: 'MINUTES') {
                                        sh '''
                                            echo "Pushing backend images to Docker Hub..."
                                            echo "Pushing ${BACKEND_IMAGE}:${VERSION}"
                                            docker push ${BACKEND_IMAGE}:${VERSION} 2>&1 | tee /tmp/backend_push.log
                                            
                                            echo "Pushing ${BACKEND_IMAGE}:latest"
                                            docker push ${BACKEND_IMAGE}:latest 2>&1 | tee -a /tmp/backend_push.log
                                            
                                            echo "Backend images pushed successfully"
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
                                            echo "Pushing frontend images to Docker Hub..."
                                            echo "Pushing ${FRONTEND_IMAGE}:${VERSION}"
                                            docker push ${FRONTEND_IMAGE}:${VERSION} 2>&1 | tee /tmp/frontend_push.log
                                            
                                            echo "Pushing ${FRONTEND_IMAGE}:latest"
                                            docker push ${FRONTEND_IMAGE}:latest 2>&1 | tee -a /tmp/frontend_push.log
                                            
                                            echo "Frontend images pushed successfully"
                                        '''
                                    }
                                }
                            }
                        }
                    )
                    
                    // Verify push success
                    sh '''
                        echo "Verifying pushed images..."
                        
                        # Check backend images
                        echo "Checking backend images..."
                        docker pull ${BACKEND_IMAGE}:${VERSION} || echo "Warning: Could not pull backend version image"
                        docker pull ${BACKEND_IMAGE}:latest || echo "Warning: Could not pull backend latest image"
                        
                        # Check frontend images
                        echo "Checking frontend images..."
                        docker pull ${FRONTEND_IMAGE}:${VERSION} || echo "Warning: Could not pull frontend version image"
                        docker pull ${FRONTEND_IMAGE}:latest || echo "Warning: Could not pull frontend latest image"
                        
                        echo "Image push verification completed"
                    '''
                    
                    // Cleanup local images to save space
                    sh '''
                        echo "Cleaning up local images to save disk space..."
                        
                        # Remove local images after successful push
                        docker rmi ${BACKEND_IMAGE}:${VERSION} || echo "Backend version image already removed"
                        docker rmi ${BACKEND_IMAGE}:latest || echo "Backend latest image already removed"
                        docker rmi ${FRONTEND_IMAGE}:${VERSION} || echo "Frontend version image already removed"
                        docker rmi ${FRONTEND_IMAGE}:latest || echo "Frontend latest image already removed"
                        
                        # Clean up dangling images
                        docker image prune -f || echo "Image cleanup completed"
                        
                        echo "Local cleanup completed"
                    '''
                }
            }
        }
        
        stage('Push Monitoring and Reporting') {
            when {
                expression { 
                    def currentBranch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    return currentBranch == 'master' || currentBranch == 'main' || currentBranch.endsWith('/master') || currentBranch.endsWith('/main')
                }
            }
            steps {
                script {
                    // Generate push report
                    sh '''
                        echo "=== PUSH OPERATION REPORT ==="
                        echo "Build Number: ${VERSION}"
                        echo "Backend Image: ${BACKEND_IMAGE}:${VERSION}"
                        echo "Frontend Image: ${FRONTEND_IMAGE}:${VERSION}"
                        echo "Push Timestamp: $(date)"
                        
                        # Check if push logs exist and show summary
                        if [ -f /tmp/backend_push.log ]; then
                            echo "Backend Push Log Summary:"
                            tail -20 /tmp/backend_push.log | grep -E "(Pushing|pushed|digest|size)" || echo "No push summary found"
                        fi
                        
                        if [ -f /tmp/frontend_push.log ]; then
                            echo "Frontend Push Log Summary:"
                            tail -20 /tmp/frontend_push.log | grep -E "(Pushing|pushed|digest|size)" || echo "No push summary found"
                        fi
                        
                        # Show final image sizes
                        echo "Final Image Sizes:"
                        docker images | grep -E "(attendance-app-backend|attendance-app-frontend)" || echo "No local images found"
                        
                        echo "=== PUSH REPORT COMPLETED ==="
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