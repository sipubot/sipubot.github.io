# 시퍼렁어

개인 포트폴리오 웹사이트로 개인 금융, 주식 분석, 다이어트 추적, 엔터테인먼트 등을 위한 웹 애플리케이션 모음입니다.

## 🌟 개요

GitHub Pages에서 호스팅되는 이 웹사이트는 개인 포트폴리오이자 유용한 웹 애플리케이션 모음입니다. 애니메이션 달팽이와 깔끔한 다크 테마 인터페이스 등의 인터랙티브 요소를 포함합니다.

## 🚀 기능

### 주요 애플리케이션
- **예산 추적기** 💰 - 개인 금융 관리 (지출/수입 추적, 계정, 카테고리, 차트)
- **주식 분석기** 📈 - 실시간 주식 모니터링 (기술적 분석, 시그널, 소셜 피드)
- **다이어트 추적기** 🍺 - 건강 및 영양 기록
- **이슈 추적기** 🐛 - 버그 및 작업 관리 시스템
- **게임** 🎮
  - JS-ASMR Canvas - 인터랙티브 캔버스 기반 체험
  - JS Code Invaders - 코드 테마의 클래식 스페이스 인베이더 게임

### 웹사이트 기능
- **개인 대시보드** - 개인 정보와 실시간 업데이트가 있는 홈페이지
- **상태 시스템** - 동적 상태 표시기
- **명언 게시판** - 인터랙티브 메시지 공유
- **인증** - 로그인/로그아웃 기능
- **반응형 디자인** - 모바일 친화적 인터페이스

## 🛠️ 기술 스택

- **프론트엔드**: HTML5, CSS3, JavaScript (ES6+)
- **프레임워크/라이브러리**:
  - Bootstrap 5 (UI 컴포넌트)
  - jQuery (DOM 조작)
  - Chart.js (데이터 시각화)
  - Google Charts (추가 차트)
  - Tailwind CSS (유틸리티 클래스)
- **아이콘**: Font Awesome
- **분석**: Google Analytics
- **호스팅**: GitHub Pages

## 📁 프로젝트 구조

```
sipubot.github.io/
├── index.html              # 메인 포트폴리오 페이지
├── README.md              # 이 파일
├── SECURITY.md            # 보안 정책
├── params.json            # 사이트 설정
├── app/                   # 웹 애플리케이션
│   ├── budget/           # 개인 금융 추적기
│   ├── diet/             # 다이어트 추적 앱
│   ├── stock/            # 주식 분석 도구
│   ├── issue/            # 이슈 관리
│   ├── JS-asmrcanvas/    # 인터랙티브 캔버스 앱
│   └── JS-CodeInvaders/   # 코드 테마 게임
├── data/                  # JSON 데이터 파일
│   ├── app.json          # 앱 설정
│   ├── link.json         # 외부 링크
│   ├── persondata.json   # 개인 데이터
│   └── stat.json         # 통계
├── icon/                  # 아이콘 및 이미지
├── js/                    # JavaScript 유틸리티
│   ├── common.js         # 공유 함수
│   ├── SnailComp.js      # 달팽이 애니메이션 컴포넌트
│   └── sha3.min.js       # SHA3 해싱
└── stylesheets/           # CSS 스타일
    ├── common.css        # 메인 스타일시트
    └── quot.css          # 명언 게시판 스타일
```

## 🌐 라이브 데모

라이브 웹사이트 방문: [https://sipubot.github.io](https://sipubot.github.io)

## 📖 사용법

### 방문자용
1. 헤더 네비게이션을 사용하여 메인 섹션 탐색
2. "App" 섹션에서 개별 앱에 액세스
3. 명언 게시판을 사용하여 메시지 남기기
4. 개인 상태 및 업데이트 확인

### 개발자용
정적 파일로 구축되어 있어 쉽게:
- 포크하여 커스터마이징
- 새 애플리케이션 추가
- 스타일 및 기능 수정
- 모든 정적 호스팅 서비스에 배포

## 🔧 개발

### 사전 요구사항
- 최신 웹 브라우저
- 텍스트 에디터 (VS Code 권장)
- 버전 관리를 위한 Git

### 로컬 개발
1. 저장소 클론:
   ```bash
   git clone https://github.com/sipubot/sipubot.github.io.git
   cd sipubot.github.io
   ```

2. 브라우저에서 `index.html` 열어 메인 사이트 보기

3. 개별 앱의 경우 해당 디렉토리로 이동하여 `index.html` 파일 열기

### 새 앱 추가
1. `app/` 아래에 새 디렉토리 생성
2. `data/app.json`에 앱 설정 추가
3. `icon/` 디렉토리에 아이콘 업데이트
4. 변경사항 푸시 전 로컬 테스트

## 🤝 기여

개인 프로젝트이지만 자유롭게:
- 이슈 보고
- 개선 제안
- 포크하여 자신만의 버전 생성

## 📄 라이선스

개인 및 교육 목적의 프로젝트입니다. 해당되는 경우 개별 앱 디렉토리의 특정 라이선스 확인.

## 📞 연락처

- GitHub: [@sipubot](https://github.com/sipubot)
- 웹사이트: [sipubot.github.io](https://sipubot.github.io)

---

*"우주속에 인간이 있고 인간속에 우주가 있다."*