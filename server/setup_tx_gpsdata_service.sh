#!/bin/bash

# 서비스 파일 경로 설정
SERVICE_FILE="/etc/systemd/system/tx_gpsdata.service"

# 서비스 파일 생성
echo "[Unit]
Description=TX GPS Data Service
After=network.target

[Service]
ExecStart=/usr/bin/python3 /home/tx_gpsdata.py
Restart=always
User=$(whoami)

[Install]
WantedBy=multi-user.target" | sudo tee $SERVICE_FILE

# 서비스 파일 권한 설정
sudo chmod 644 $SERVICE_FILE

# systemd 데몬 재시작
sudo systemctl daemon-reload

# 서비스 시작
sudo systemctl start tx_gpsdata.service

# 부팅 시 서비스 자동 실행 설정
sudo systemctl enable tx_gpsdata.service

echo "Service tx_gpsdata.service has been created and started. It will also start on boot."
