@echo off
REM Cấu hình: thay đổi tên image, tên container và các cổng nếu cần
set IMAGE_NAME=taskapife
set CONTAINER_NAME=taskapife
set PORT_HOST=80
set PORT_CONTAINER=80
pushd "%~dp0"
echo ============================
echo Building Docker image: %IMAGE_NAME%
echo ============================
docker build -t %IMAGE_NAME% .
if errorlevel 1 (
    echo Error: Docker image build failed!
    goto end
)

echo =======================================
echo Checking for existing container: %CONTAINER_NAME%
echo =======================================

REM Kiểm tra container đang chạy, nếu có thì dừng nó
for /f "tokens=*" %%i in ('docker ps -q -f "name=%CONTAINER_NAME%"') do (
    echo Stopping container: %CONTAINER_NAME%
    docker stop %CONTAINER_NAME%
)

REM Kiểm tra container tồn tại (dù đang chạy hay dừng) và xóa nó
for /f "tokens=*" %%i in ('docker ps -aq -f "name=%CONTAINER_NAME%"') do (
    echo Removing container: %CONTAINER_NAME%
    docker rm %CONTAINER_NAME%
)

echo ============================
echo Running new container: %CONTAINER_NAME%
echo ============================
docker run -d --name %CONTAINER_NAME% -p %PORT_HOST%:%PORT_CONTAINER% --env-file dev.env %IMAGE_NAME%

REM Kiểm tra kết quả: in ra container ID nếu container chạy thành công
for /f "tokens=*" %%i in ('docker ps -q -f "name=%CONTAINER_NAME%"') do (
    echo Success: Container %CONTAINER_NAME% is running. Container ID: %%i
)

:end
echo =========================================
echo Deployment completed.
echo Press any key to exit...
pause >nul