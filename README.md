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

### Ping (지연시간)
- Cloudflare Worker `/ping` 엔드포인트로 5회 요청
- 가장 빠른 값과 가장 느린 값 1개씩 제거 후 중간 3개 평균
- 단위: ms (낮을수록 좋음)

### Jitter (지터)
- Ping 측정에서 사용한 중간 3개 값의 최대 - 최소
- 값이 클수록 속도가 들쭉날쭉함을 의미
- 단위: ms (낮을수록 안정적)

### 다운로드 속도
- 1MB → 5MB → 10MB 순서로 3단계 다운로드
- 각 단계에서 실제 수신 바이트와 소요 시간을 누적
- 총 수신 비트 ÷ 총 소요 시간으로 평균 속도 계산
- 단위: Mbps

### 업로드 속도
- 2MB 랜덤 데이터를 `/upload` 엔드포인트로 3회 POST 전송
- 총 전송 비트 ÷ 총 소요 시간으로 평균 속도 계산
- 단위: Mbps

> 모든 요청은 `cache: "no-store"` + 타임스탬프 쿼리 파라미터로 캐싱 완전 차단

## 유용한 링크

- [앱인토스 콘솔](https://apps-in-toss.toss.im/)
- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [앱인토스 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)

AI를 사용하시는 경우 [여기](https://developers-apps-in-toss.toss.im/development/llms.html)를 확인해보세요.
