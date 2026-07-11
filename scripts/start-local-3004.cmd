@echo off
cd /d "%~dp0.."
set "NEXTAUTH_URL=http://localhost:3004"
set "NEXT_PUBLIC_APP_URL=http://localhost:3004"
call npm.cmd start
