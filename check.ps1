Write-Host "======================================"
Write-Host "  面试商务英语 - 代码检查"
Write-Host "======================================"
Write-Host ""

$ok = $true

$files = @("js/app.js", "js/reader.js", "js/listener.js", "js/speaker.js", "js/exercises.js", "js/quiz.js")
foreach ($f in $files) {
    $fullPath = Join-Path $PSScriptRoot $f
    node --check $fullPath 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [FAIL] $f" -ForegroundColor Red
        $ok = $false
    }
    else {
        Write-Host "  [PASS] $f" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "  检查 index.html 内联脚本..."
$checkScript = Join-Path $PSScriptRoot "tools/check-inline.js"
node $checkScript 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] index.html 内联脚本" -ForegroundColor Red
    $ok = $false
}
else {
    Write-Host "  [PASS] index.html 内联脚本" -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================"
if ($ok) {
    Write-Host "  全部通过！" -ForegroundColor Green
}
else {
    Write-Host "  有错误，请检查上面 [FAIL] 的文件" -ForegroundColor Red
}
Write-Host "======================================"
Read-Host "按 Enter 退出"