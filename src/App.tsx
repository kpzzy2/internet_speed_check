import { useState, useEffect } from "react";
import "./App.css";

interface SpeedResult {
  ping?: number;
  jitter?: number;
  download?: number;
  upload?: number;
}

function App() {
  const [apiUrl, setApiUrl] = useState(
    import.meta.env.VITE_API_URL || "https://speedtest-worker.sdjjm95.workers.dev"
  );
  const [isEditing, setIsEditing] = useState(false);
  const [results, setResults] = useState<SpeedResult>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>("");
  const [displayValue, setDisplayValue] = useState<number | null>(null);

  useEffect(() => {
    if (results.download !== undefined && displayValue !== results.download) {
      const timer = setTimeout(() => {
        setDisplayValue(results.download);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [results.download, displayValue]);

  const measurePing = async (url: string) => {
    const times = [];
    for (let i = 0; i < 5; i++) {
      const t = performance.now();
      try {
        await fetch(`${url}/ping?t=${Date.now()}`, { cache: "no-store" });
        times.push(performance.now() - t);
      } catch (e) {
        console.error("Ping failed:", e);
      }
    }
    times.sort((a, b) => a - b);
    const trimmed = times.slice(1, 4);
    return {
      ping: trimmed.reduce((a, b) => a + b, 0) / trimmed.length,
      jitter: Math.max(...trimmed) - Math.min(...trimmed),
    };
  };

  const measureDownload = async (url: string) => {
    const sizes = [1e6, 5e6, 10e6];
    let totalBits = 0,
      totalSec = 0;
    for (const bytes of sizes) {
      const t = performance.now();
      try {
        const res = await fetch(`${url}/download?bytes=${bytes}&t=${Date.now()}`, {
          cache: "no-store",
        });
        await res.arrayBuffer();
        const sec = (performance.now() - t) / 1000;
        totalBits += bytes * 8;
        totalSec += sec;
      } catch (e) {
        console.error("Download failed:", e);
      }
    }
    return totalBits / totalSec / 1e6;
  };

  const measureUpload = async (url: string) => {
    const data = new Uint8Array(2 * 1024 * 1024);
    crypto.getRandomValues(data);
    let totalBits = 0,
      totalSec = 0;
    for (let i = 0; i < 3; i++) {
      const t = performance.now();
      try {
        await fetch(`${url}/upload?t=${Date.now()}`, {
          method: "POST",
          body: data,
          cache: "no-store",
        });
        totalSec += (performance.now() - t) / 1000;
        totalBits += data.byteLength * 8;
      } catch (e) {
        console.error("Upload failed:", e);
      }
    }
    return totalBits / totalSec / 1e6;
  };

  const runTest = async (testType: "ping" | "download" | "upload" | "all") => {
    setIsLoading(true);
    setResults({});
    setDisplayValue(null);

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
        setResults((prev) => ({ ...prev, upload: uploadSpeed }));
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
                    {results.upload !== undefined && (
                      <div className="detail-item">
                        <span className="label">업로드</span>
                        <span className="value">{results.upload.toFixed(2)} Mbps</span>
                      </div>
                    )}
                    {results.ping !== undefined && (
                      <div className="detail-item">
                        <span className="label">지연시간</span>
                        <span className="value">{results.ping.toFixed(1)} ms</span>
                      </div>
                    )}
                    {results.jitter !== undefined && (
                      <div className="detail-item">
                        <span className="label">지터</span>
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

            <button
              className="btn btn-secondary"
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
            >
              ⚙ API 설정
            </button>
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
