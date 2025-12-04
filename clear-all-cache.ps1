# Complete Cache Clearing Script
Write-Host "🧹 Clearing all caches..." -ForegroundColor Cyan

# Clear .next
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
    Write-Host "✓ Cleared .next" -ForegroundColor Green
}

# Clear node_modules cache
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
    Write-Host "✓ Cleared node_modules cache" -ForegroundColor Green
}

# Clear .turbo
if (Test-Path ".turbo") {
    Remove-Item -Recurse -Force .turbo -ErrorAction SilentlyContinue
    Write-Host "✓ Cleared .turbo" -ForegroundColor Green
}

# Clear TypeScript cache
Get-ChildItem -Recurse -Filter "*.tsbuildinfo" -ErrorAction SilentlyContinue | Remove-Item -Force
Write-Host "✓ Cleared TypeScript cache" -ForegroundColor Green

Write-Host "`n✨ All caches cleared! Ready for fast compilation!" -ForegroundColor Green
Write-Host "Run: npm run dev" -ForegroundColor Yellow

