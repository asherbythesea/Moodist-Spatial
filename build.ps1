# build.ps1 - Package Moodist for easy deployment
# Run this on your local machine

Write-Host "Building Docker image..." -ForegroundColor Cyan
docker build -t moodist:latest .

Write-Host "Exporting image to moodist_image.tar..." -ForegroundColor Cyan
docker save -o moodist_image.tar moodist:latest

Write-Host "Done! You can now copy 'moodist_image.tar' and 'docker-compose.yml' to your server." -ForegroundColor Green
Write-Host "On your server, run:" -ForegroundColor Yellow
Write-Host "1. docker load -i moodist_image.tar" -ForegroundColor Yellow
Write-Host "2. docker-compose up -d" -ForegroundColor Yellow
