# Simple EC2 Deployment Script
param(
    [Parameter(Mandatory=$true)][string]$EC2IP,
    [string]$SSHKey = "~/.ssh/id_rsa"
)

Write-Host "Deploying DAANSETU Backend to EC2..." -ForegroundColor Green

# Create deployment package
$DeployDir = "deploy-package"
if (Test-Path $DeployDir) {
    Remove-Item -Recurse -Force $DeployDir
}
New-Item -ItemType Directory -Path $DeployDir | Out-Null

# Copy necessary files
$FilesToDeploy = @(
    "app.js",
    "package.json", 
    "package-lock.json",
    "Dockerfile",
    "docker-compose.yml",
    "nginx",
    "config",
    "controllers",
    "middleware", 
    "models",
    "routes",
    "utils"
)

foreach ($file in $FilesToDeploy) {
    if (Test-Path $file) {
        Copy-Item -Recurse -Path $file -Destination $DeployDir
        Write-Host "  Copied: $file" -ForegroundColor Green
    }
}

# Create .env file
$EnvContent = @"
MONGODB_URI=mongodb+srv://root:root@cluster0.rxcp0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
DB_NAME=daansetu
PORT=5000
NODE_ENV=production
JWT_SECRET=7fa4999230ab91a0051f3f84eb271e97f63427a8f90540b7a38c3549edfd62ed
JWT_REFRESH_SECRET=1db9aefc2f697b1c651be41344ee2d04820fa85b84f1d3f87d84be007e8a433e
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ADMIN_SETUP_KEY=0e5a3b3af7298afe816b72196376c355
# Set CORS_ORIGIN to a comma-separated list of trusted domains (do not use '*')
CORS_ORIGIN=https://your-frontend-domain.com
"@

$EnvContent | Out-File -FilePath "$DeployDir\.env" -Encoding UTF8

Write-Host "Deployment package created!" -ForegroundColor Green
Write-Host ""
Write-Host "To deploy to EC2, run these commands:" -ForegroundColor Yellow
Write-Host "1. scp -r $DeployDir ubuntu@${EC2IP}:/tmp/" -ForegroundColor White
Write-Host "2. ssh ubuntu@${EC2IP}" -ForegroundColor White
Write-Host "3. sudo mv /tmp/$DeployDir /opt/daansetu-backend" -ForegroundColor White
Write-Host "4. cd /opt/daansetu-backend" -ForegroundColor White
Write-Host "5. docker-compose up -d --build" -ForegroundColor White
Write-Host ""
Write-Host "Your API will be available at: http://$EC2IP/" -ForegroundColor Cyan

# Cleanup
Remove-Item -Recurse -Force $DeployDir
