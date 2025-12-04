# COMPLETE CACHE CLEARING SCRIPT FOR WINDOWS

Write-Host "🗑️  Clearing ALL caches..." -ForegroundColor Cyan

# Stop all Node processes
Write-Host "Stopping Node processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Delete Next.js cache
Write-Host "Deleting .next folder..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Delete node_modules cache
Write-Host "Deleting node_modules cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# Delete TypeScript build cache
Write-Host "Deleting tsconfig cache..." -ForegroundColor Yellow
Remove-Item -Force tsconfig.tsbuildinfo -ErrorAction SilentlyContinue

Write-Host "✅ All caches cleared!" -ForegroundColor Green
Write-Host ""
Write-Host "Now run: npm run dev" -ForegroundColor Cyan


