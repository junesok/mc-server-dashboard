# Minecraft Server Dashboard

바닐라 마인크래프트 서버를 웹 대시보드로 제어하는 Next.js 앱  
NHN Cloud Ubuntu 인스턴스 위에서 대시보드와 마인크래프트 서버가 함께 동작

## 기능

- 비밀번호 로그인 (HTTP-only 쿠키 세션, 비밀번호는 서버 환경변수로 관리)
- 서버 시작 / 중지 / 재시작
- 시작 시 최신 바닐라 버전으로 업데이트 선택 (Mojang 공식 API 사용)
- 서버 온라인 시 접속 주소 표시 및 복사
- 서버 상태 실시간 표시 (5초마다 자동 갱신)
- 맵 초기화 (시드 입력 선택)
- 화이트리스트 조회 / 추가 / 삭제
- 모든 API 엔드포인트 인증 미들웨어 보호

## 기술 스택

- **Frontend/Backend**: Next.js 16 (App Router)
- **Runtime**: Node.js + PM2
- **Minecraft**: 바닐라 서버 (Java 25)
- **인증**: HTTP-only 쿠키 + Next.js Middleware

## 환경 변수 설정

`.env.local.example`을 복사해 `.env.local`을 만들고 실제 값을 입력

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SERVER_IP=your-server-ip
AUTH_PASSWORD=your-password
```

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SERVER_IP` | 서버 공인 IP (클라이언트에서 접속 주소 표시용) |
| `AUTH_PASSWORD` | 대시보드 로그인 비밀번호 (서버 측에서만 사용) |

## 서버 초기 셋업

새 서버에 처음 설치할 때 필요한 과정입니다. **Ubuntu/Debian Linux** 기준이며, Windows는 `screen` 명령어가 없어 지원하지 않습니다.

### 1. 필수 패키지 설치

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y openjdk-25-jre-headless screen
```

Node.js (v18 이상):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 2. 디렉토리 생성

```bash
mkdir -p /home/ubuntu/minecraft/backups
```

### 3. Minecraft 서버 다운로드

[minecraft.net/download/server](https://www.minecraft.net/en-us/download/server)에서 최신 바닐라 서버 URL을 확인 후 다운로드합니다.

```bash
cd /home/ubuntu/minecraft
wget -O server.jar "https://piston-data.mojang.com/..."
```

최초 실행으로 파일 생성 후 EULA에 동의합니다.

```bash
java -jar server.jar nogui   # 에러 발생하며 종료됨 — 정상
sed -i 's/eula=false/eula=true/' eula.txt
```

### 4. server.properties 주요 설정

```properties
online-mode=true
white-list=true
max-players=4
view-distance=8
simulation-distance=6
pause-when-empty-seconds=60
```

### 5. start.sh 작성

```bash
nano /home/ubuntu/minecraft/start.sh
```

```bash
#!/bin/bash
cd /home/ubuntu/minecraft
screen -dmS mc /usr/lib/jvm/java-25-openjdk-amd64/bin/java -Xms1536M -Xmx1536M \
  -XX:+UseG1GC \
  -XX:+ParallelRefProcEnabled \
  -XX:MaxGCPauseMillis=200 \
  -XX:+UnlockExperimentalVMOptions \
  -XX:+DisableExplicitGC \
  -XX:G1NewSizePercent=30 \
  -XX:G1MaxNewSizePercent=40 \
  -XX:G1HeapRegionSize=8M \
  -XX:G1ReservePercent=20 \
  -XX:G1HeapWastePercent=5 \
  -XX:G1MixedGCCountTarget=4 \
  -XX:InitiatingHeapOccupancyPercent=15 \
  -XX:G1MixedGCLiveThresholdPercent=90 \
  -XX:G1RSetUpdatingPauseTimePercent=5 \
  -XX:SurvivorRatio=32 \
  -XX:+PerfDisableSharedMem \
  -XX:MaxTenuringThreshold=1 \
  -jar server.jar nogui
```

> Java 경로(`/usr/lib/jvm/java-25-openjdk-amd64/bin/java`)는 `which java` 또는 `update-alternatives --list java`로 확인하세요.  
> JVM 메모리(`-Xms`, `-Xmx`)는 서버 RAM에 맞게 조정하세요. (RAM 2GB 환경 기준 1536M)

### 6. stop.sh 작성

```bash
nano /home/ubuntu/minecraft/stop.sh
```

```bash
#!/bin/bash
MC_DIR="/home/ubuntu/minecraft"
BACKUP_DIR="$MC_DIR/backups"
DATE=$(date +%Y%m%d_%H%M)

cd $MC_DIR

if ! screen -list | grep -q "mc"; then
    echo "서버가 실행 중이 아닙니다."
    exit 0
fi

mc_cmd() {
    screen -S mc -p 0 -X stuff "$1$(printf '\r')"
}

mc_cmd "say [서버] 10초 후 종료됩니다."
sleep 10

mc_cmd "save-all flush"
echo "월드 저장 중..."
sleep 5

mc_cmd "stop"
echo "서버 종료 중..."

for i in {1..30}; do
    if ! screen -list | grep -q "mc"; then break; fi
    sleep 1
done

echo "백업 시작..."
mkdir -p $BACKUP_DIR
if [ -d "$MC_DIR/world" ]; then
    tar -czf $BACKUP_DIR/world_$DATE.tar.gz -C $MC_DIR world world_nether world_the_end 2>/dev/null || \
    tar -czf $BACKUP_DIR/world_$DATE.tar.gz -C $MC_DIR world
    echo "[$DATE] 백업 완료: $BACKUP_DIR/world_$DATE.tar.gz"
fi

find $BACKUP_DIR -name "*.tar.gz" -mtime +14 -delete
echo "종료 완료"
```

```bash
chmod +x /home/ubuntu/minecraft/start.sh /home/ubuntu/minecraft/stop.sh
```

### 7. sh 파일과 API 연결 구조

이 대시보드는 별도의 SSH 연결 없이 **같은 서버 위에서** shell 명령을 직접 실행합니다. `lib/ssh.ts`의 `executeSSH()`가 `child_process.exec`을 래핑한 함수이며, 각 API는 아래와 같이 sh 파일을 호출합니다.

| API | 호출하는 명령 |
|-----|--------------|
| `POST /api/start` | `/home/ubuntu/minecraft/start.sh` |
| `POST /api/stop` | `nohup /home/ubuntu/minecraft/stop.sh > /tmp/mc-stop.log 2>&1 &` |
| `POST /api/restart` | `stop.sh` 실행 후 완료 대기 → `start.sh` |
| `GET /api/status` | `screen -list` 에서 `mc` 세션 존재 여부 확인 |
| `POST /api/reset-world` | `stop.sh` → `rm -rf world*` → `start.sh` |

**경로를 변경했다면** 각 API route 파일에서 `/home/ubuntu/minecraft/` 부분을 수정해야 합니다.

### 8. 대시보드 셋업

```bash
cd /home/ubuntu
git clone https://github.com/junesok/mc-server-dashboard.git dashboard
cd dashboard
npm install
```

`.env.local` 생성:

```bash
nano .env.local
```

```env
NEXT_PUBLIC_SERVER_IP=your-server-ip
AUTH_PASSWORD=your-password
```

빌드 및 PM2 등록:

```bash
npm run build
pm2 start npm --name mc-dashboard -- start
pm2 save
pm2 startup   # 출력된 명령어를 복사해서 실행
```

### 9. 방화벽 설정

```bash
sudo ufw allow 22/tcp
sudo ufw allow 25565/tcp
sudo ufw allow 3000/tcp
sudo ufw enable
```

### 10. 버전 기록 파일 생성

대시보드가 현재 설치된 Minecraft 버전을 추적하기 위해 사용합니다.

```bash
echo "26.1.2" > /home/ubuntu/minecraft/mc-version.txt  # 설치한 버전으로 변경
```

---

## 로컬 개발

```bash
npm install
npm run dev
```

## 서버 배포

`main` 브랜치에 push하면 GitHub Actions가 자동으로 서버에 배포

```
git push origin main
```

배포 흐름: `git pull` → `npm install` → `npm run build` → `pm2 restart`

### 인스턴스가 꺼진 상태에서 push했을 때

배포가 실패했다면 인스턴스를 켠 후 아래 명령어로 재실행

```bash
gh run rerun --repo junesok/mc-server-dashboard --failed
```

### GitHub Secrets 설정

GitHub 리포지토리 Settings → Secrets and variables → Actions에 아래 두 값을 등록

| Secret | 값 |
|--------|----|
| `SERVER_HOST` | 서버 공인 IP |
| `SSH_PRIVATE_KEY` | SSH 접속용 PEM 키 파일 내용 |

## 프로젝트 구조

```
minecraft-server/
├── middleware.ts                 # API 인증 미들웨어
├── lib/
│   └── ssh.ts                   # 로컬 shell 명령 실행 유틸
└── app/
    ├── page.tsx                  # 메인 대시보드
    ├── hooks/
    │   └── useServerStatus.ts   # 5초 폴링 훅
    ├── components/
    │   ├── LoginForm.tsx
    │   ├── ServerStatus.tsx
    │   ├── ServerControl.tsx
    │   ├── WhitelistManager.tsx
    │   └── WorldReset.tsx
    └── api/
        ├── auth/route.ts        # 로그인 / 로그아웃 / 세션 확인
        ├── status/route.ts
        ├── start/route.ts       # 시작 + 선택적 버전 업데이트
        ├── stop/route.ts
        ├── restart/route.ts
        ├── check-update/route.ts
        ├── whitelist/route.ts
        ├── whitelist/add/route.ts
        ├── whitelist/remove/route.ts
        └── reset-world/route.ts
```

## 서버 구성 (NHN Cloud)

| 항목 | 내용 |
|------|------|
| CPU | 2 vCPU |
| RAM | 2GB + 스왑 4GB |
| OS | Ubuntu 22.04 |
| Java | OpenJDK 25 |
| 포트 | 25565 (Minecraft), 3000 (Dashboard) |

## 백업

서버 중지 시 월드 데이터를 자동으로 백업

- 저장 위치: `/home/ubuntu/minecraft/backups/`
- 파일명: `world_YYYYMMDD_HHMM.tar.gz`
- 보관 기간: 14일 (자동 삭제)
