@echo off
echo ======================================
echo   面试商务英语 - 代码检查
echo ======================================
echo.

set OK=1

call :check_file "js\app.js"
call :check_file "js\reader.js"
call :check_file "js\listener.js"
call :check_file "js\speaker.js"
call :check_file "js\exercises.js"
call :check_file "js\quiz.js"

echo.
echo   检查 index.html 内联脚本...
node "tools\check-inline.js" >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] index.html 内联脚本
    set OK=0
) else (
    echo   [PASS] index.html 内联脚本
)

echo.
echo ======================================
if "%OK%"=="1" (
    echo   全部通过！
) else (
    echo   有错误，检查上面 [FAIL] 的文件
)
echo ======================================
pause
goto :eof

:check_file
node --check "%~1" >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] %~1
    set OK=0
) else (
    echo   [PASS] %~1
)
goto :eof
