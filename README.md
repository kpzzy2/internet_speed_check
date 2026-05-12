# internet_speed

Apps in Toss 프로젝트입니다.

## 시작하기

```bash
npm run dev
```

## 배포하기

- 앱인토스 배포 API 키는 [앱인토스 콘솔](https://apps-in-toss.toss.im/) > 워크스페이스 > API 키 > 콘솔 API 키 에서 발급받을 수 있어요.

```bash
npm run build
npm run deploy
```

## 속도 측정 방식

### Ping (지연시간) / Jitter (지터)
- Cloudflare Worker `/ping` 엔드포인트에 **WebSocket**으로 연결
- warmup 1회 후 5회 측정, 최솟값·최댓값 제거한 중간 3개 평균
- jitter는 중간 3개 값의 최대 - 최소
- 단위: ms (낮을수록 좋음)

### 다운로드 속도
- 10MB 요청 **3개를 병렬**로 동시 전송 (`Promise.all`)
- 총 수신 비트 ÷ 전체 소요 시간으로 속도 계산
- 단위: Mbps

### 업로드 속도
- 3MB 랜덤 데이터를 **3개 병렬**로 동시 POST 전송 (`Promise.all`)
- 타임아웃 25초, 초과 시 "측정 시간 초과" 표시
- 단위: Mbps

> 모든 요청은 `cache: "no-store"` + 타임스탬프 쿼리 파라미터로 캐싱 완전 차단

## 유용한 링크

- [앱인토스 콘솔](https://apps-in-toss.toss.im/)
- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [앱인토스 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)

AI를 사용하시는 경우 [여기](https://developers-apps-in-toss.toss.im/development/llms.html)를 확인해보세요.
