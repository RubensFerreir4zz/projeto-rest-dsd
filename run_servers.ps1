# Script de Inicialização dos Serviços Distribuídos (DSD - IFRN)
# Sobe o Gateway, os dois Microsserviços e o Servidor Web do Frontend

$root = $PSScriptRoot
$venvPython = "$root\.venv\Scripts\python.exe"

# Obtém o IP local da máquina na rede Wi-Fi / Ethernet real (ignora VPNs)
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -match 'Wi-Fi|Ethernet' -and 
    $_.IPAddress -notlike '169.*' -and 
    $_.IPAddress -notmatch '^26\.' 
} | Select-Object -First 1).IPAddress

if (-not $localIp) { 
    $localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
        $_.InterfaceAlias -notmatch 'Loopback|vEthernet|Radmin' -and 
        $_.IPAddress -notlike '169.*' -and 
        $_.IPAddress -notmatch '^26\.' 
    } | Select-Object -First 1).IPAddress
}
if (-not $localIp) { $localIp = "127.0.0.1" }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Iniciando SafoDrive Distribuido (DSD - IFRN)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Service Accounts (Porta 8001)
Write-Host "[1/4] Iniciando Service Accounts na porta 8001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend\service_accounts'; Write-Host '--- SERVICE ACCOUNTS (8001) ---' -ForegroundColor Green; & '$venvPython' manage.py runserver 0.0.0.0:8001"

# 2. Service Storage (Porta 8002)
Write-Host "[2/4] Iniciando Service Storage na porta 8002..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend\service_storage'; Write-Host '--- SERVICE STORAGE (8002) ---' -ForegroundColor Green; & '$venvPython' manage.py runserver 0.0.0.0:8002"

# 3. API Gateway (Porta 8000)
Write-Host "[3/4] Iniciando API Gateway na porta 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend\gateway'; Write-Host '--- API GATEWAY (8000) ---' -ForegroundColor Green; & '$venvPython' manage.py runserver 0.0.0.0:8000"

# 4. Servidor Web do Front-end (Porta 3000)
Write-Host "[4/4] Iniciando Cliente Web na porta 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; Write-Host '--- SAFODRIVE WEB CLIENT (3000) ---' -ForegroundColor Green; & '$venvPython' -m http.server 3000 --bind 0.0.0.0"

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   SISTEMA NO AR E PRONTO PARA A APRESENTACAO!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Acesso neste computador:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "Acesso por outros PCs/Celulares na rede:" -ForegroundColor Magenta
Write-Host "  👉 http://$($localIp):3000" -ForegroundColor Yellow
Write-Host "Swagger UI do Gateway:" -ForegroundColor Cyan
Write-Host "  👉 http://$($localIp):8000/api/docs/" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green

# Abre automaticamente o navegador
Start-Process "http://localhost:3000"
