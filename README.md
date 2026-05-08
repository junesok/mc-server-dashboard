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

## 로컬 개발

```bash
npm install
npm run dev
```

## 서버 배포

`main` 브랜치에 push하면 GitHub Actions가 자동으로 서버에 배포합니다.

```
git push origin main
```

배포 흐름: `git pull` → `npm install` → `npm run build` → `pm2 restart`

### GitHub Secrets 설정

GitHub 리포지토리 Settings → Secrets and variables → Actions에 아래 두 값을 등록해야 합니다.

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
