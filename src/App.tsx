import { useState, useEffect, useRef } from "react";
import "./App.css";

interface SpeedResult {
  ping?: number;
  jitter?: number;
  download?: number;
  upload?: number;
}

function App() {
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || "");
  const [isEditing, setIsEditing] = useState(false);
  const [results, setResults] = useState<SpeedResult>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>("");
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [uploadTimedOut, setUploadTimedOut] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (results.download !== undefined && displayValue !== results.download) {
      const timer = setTimeout(() => {
        setDisplayValue(results.download);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [results.download, displayValue]);

  const measurePing = (url: string): Promise<{ ping: number; jitter: number }> => {
    return new Promise((resolve) => {
      const wsUrl = url.replace("https://", "wss://") + "/ping";
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      const rtts: number[] = [];
      let sendTimes: number[] = [];
      let warmedUp = false;

      ws.onopen = () => ws.send("ping");

      ws.onmessage = () => {
        if (!warmedUp) {
          warmedUp = true;
          for (let i = 0; i < 5; i++) {
            sendTimes.push(performance.now());
            ws.send("ping");
          }
          return;
        }
        const rtt = performance.now() - sendTimes.shift()!;
        rtts.push(rtt);
        if (rtts.length === 5) {
          ws.close();
          rtts.sort((a, b) => a - b);
          const trimmed = rtts.slice(1, 4);
          resolve({
            ping: trimmed.reduce((a, b) => a + b, 0) / trimmed.length,
            jitter: Math.max(...trimmed) - Math.min(...trimmed),
          });
        }
      };

      ws.onerror = () => {
        ws.close();
        resolve({ ping: 0, jitter: 0 });
      };
    });
  };

  const measureDownload = async (url: string) => {
    const PARALLEL = 3;
    const BYTES = 10e6; // 스트림당 10MB
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const t = performance.now();
    try {
      const results = await Promise.all(
        Array.from({ length: PARALLEL }, (_, i) =>
          fetch(`${url}/download?bytes=${BYTES}&t=${Date.now()}-${i}`, {
            cache: "no-store",
            signal: controller.signal,
          })
            .then((res) => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.arrayBuffer();
            })
        )
      );
      const sec = (performance.now() - t) / 1000;
      const totalBits = BYTES * results.length * 8;
      return totalBits / sec / 1e6;
    } catch (e) {
      console.error("Download failed:", e);
      return 0;
    }
  };

  const measureUpload = async (url: string) => {
    const PARALLEL = 3;
    const BYTES = 3 * 1024 * 1024; // 스트림당 3MB
    const data = new Uint8Array(BYTES);
    for (let offset = 0; offset < data.byteLength; offset += 65536) {
      crypto.getRandomValues(data.subarray(offset, offset + 65536));
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 25000);
    const t = performance.now();
    try {
      const results = await Promise.all(
        Array.from({ length: PARALLEL }, (_, i) =>
          fetch(`${url}/upload?t=${Date.now()}-${i}`, {
            method: "POST",
            body: data.slice(),
            cache: "no-store",
            signal: controller.signal,
          })
        )
      );
      const sec = (performance.now() - t) / 1000;
      const succeeded = results.filter((r) => r.ok).length;
      if (succeeded === 0) return 0;
      return (BYTES * succeeded * 8) / sec / 1e6;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return null;
      }
      console.error("Upload failed:", e);
      return 0;
    } finally {
      clearTimeout(timeout);
    }
  };

  const runTest = async (testType: "ping" | "download" | "upload" | "all") => {
    setIsLoading(true);
    setResults({});
    setDisplayValue(null);
    setUploadTimedOut(false);

    try {
      if (testType === "ping" || testType === "all") {
        setCurrentTest("Ping 측정 중");
        const pingResult = await measurePing(apiUrl);
        setResults((prev) => ({ ...prev, ...pingResult }));
      }

      if (testType === "download" || testType === "all") {
        setCurrentTest("다운로드 속도 측정 중");
        const downloadSpeed = await measureDownload(apiUrl);
        setResults((prev) => ({ ...prev, download: downloadSpeed }));
        setDisplayValue(downloadSpeed);
      }

      if (testType === "upload" || testType === "all") {
        setCurrentTest("업로드 속도 측정 중");
        const uploadSpeed = await measureUpload(apiUrl);
        if (uploadSpeed === null) {
          setUploadTimedOut(true);
        } else {
          setResults((prev) => ({ ...prev, upload: uploadSpeed }));
          if (testType === "upload") setDisplayValue(uploadSpeed);
        }
      }

      setCurrentTest("");
    } catch (error) {
      console.error("Test error:", error);
      setCurrentTest("테스트 실패");
      setTimeout(() => setCurrentTest(""), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      {!isEditing ? (
        <>
          {/* 메인 속도 표시 영역 */}
          <div className="main-display">
            {isLoading ? (
              <div className="loading-area">
                <div className="spinner"></div>
                <p className="status-text">{currentTest}</p>
              </div>
            ) : (
              <>
                <div className="speed-value">
                  {displayValue !== null ? (
                    <>
                      <span className="number">{displayValue.toFixed(1)}</span>
                      <span className="unit">Mbps</span>
                    </>
                  ) : (
                    <span className="placeholder">속도 테스트</span>
                  )}
                </div>

                {/* 상세 결과 */}
                {Object.keys(results).length > 0 && (
                  <div className="details">
                    {results.download !== undefined && (
                      <div className="detail-item">
                        <span className="label">다운로드</span>
                        <span className="value">{results.download.toFixed(2)} Mbps</span>
                      </div>
                    )}
                    {uploadTimedOut ? (
                      <div className="detail-item">
                        <span className="label">업로드</span>
                        <span className="value timeout">측정 시간 초과</span>
                      </div>
                    ) : results.upload !== undefined && (
                      <div className="detail-item">
                        <span className="label">업로드</span>
                        <span className="value">{results.upload.toFixed(2)} Mbps</span>
                      </div>
                    )}
                    {results.ping !== undefined && (
                      <div className="detail-item">
                        <span className="label">지연시간</span>
                        <span className="desc">서버 응답까지 걸리는 시간</span>
                        <span className="value">{results.ping.toFixed(1)} ms</span>
                      </div>
                    )}
                    {results.jitter !== undefined && (
                      <div className="detail-item">
                        <span className="label">지터</span>
                        <span className="desc">속도가 얼마나 들쭉날쭉한지</span>
                        <span className="value">{results.jitter.toFixed(1)} ms</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 버튼 영역 */}
          <div className="button-area">
            <button
              className="btn btn-primary"
              onClick={() => runTest("all")}
              disabled={isLoading}
            >
              {isLoading ? "테스트 진행 중..." : "테스트 시작"}
            </button>

            <div className="button-row">
              <button
                className="btn btn-secondary"
                onClick={() => runTest("download")}
                disabled={isLoading}
              >
                다운로드
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => runTest("upload")}
                disabled={isLoading}
              >
                업로드
              </button>
            </div>

          </div>
        </>
      ) : (
        <div className="settings">
          <h2>API 설정</h2>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.currentTarget.value)}
            placeholder="https://example.workers.dev"
            className="input"
          />
          <button className="btn btn-primary" onClick={() => setIsEditing(false)}>
            완료
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
