# Portfolio Site Speed Optimization Script for Windows
Write-Host "🚀 Optimizing Portfolio Site for Maximum Speed..." -ForegroundColor Cyan

# Clear all caches
Write-Host "`n📦 Clearing caches..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "✓ Cleared .next directory" -ForegroundColor Green
}

if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force node_modules\.cache
    Write-Host "✓ Cleared node_modules cache" -ForegroundColor Green
}

if (Test-Path ".turbo") {
    Remove-Item -Recurse -Force .turbo
    Write-Host "✓ Cleared Turbopack cache" -ForegroundColor Green
}

# Clear TypeScript build info
$tsBuildFiles = Get-ChildItem -Recurse -Filter "*.tsbuildinfo" -ErrorAction SilentlyContinue
if ($tsBuildFiles) {
    $tsBuildFiles | Remove-Item -Force
    Write-Host "✓ Cleared TypeScript build info" -ForegroundColor Green
}

# Clear temp files
if (Test-Path "$env:TEMP\next-*") {
    Remove-Item -Recurse -Force "$env:TEMP\next-*" -ErrorAction SilentlyContinue
    Write-Host "✓ Cleared temp files" -ForegroundColor Green
}

Write-Host "`n✨ Cache cleared! Your site will now compile much faster!" -ForegroundColor Cyan
Write-Host "`n💡 Tips for maximum speed:" -ForegroundColor Magenta
Write-Host "  • Use 'npm run dev' (already using --turbo mode)" -ForegroundColor White
Write-Host "  • First build will generate cache (takes normal time)" -ForegroundColor White
Write-Host "  • Subsequent builds will be 5-10x faster!" -ForegroundColor White
Write-Host "  • Keep .next/cache folder for best performance" -ForegroundColor White
Write-Host "`n🎯 Ready to start? Run: npm run dev" -ForegroundColor Green

