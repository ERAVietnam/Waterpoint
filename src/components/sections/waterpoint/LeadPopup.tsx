"use client";

import { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   POPUP "ĐĂNG KÝ NHẬN GIỎ HÀNG ĐỘC QUYỀN"
   - Chỉ TỰ ĐỘNG hiện khi khách đến từ nguồn quảng cáo đã đăng ký:
       • query  ?src=<mã nguồn>   (cách chắc chắn nhất, gắn vào link quảng cáo)
       • hoặc referrer chứa domain nguồn (fallback tự động)
   - Nút floating góc phải dưới LUÔN hiện để khách tự mở form bất cứ lúc nào.
   - Mỗi phiên (tab) chỉ tự hiện popup 1 lần, không làm phiền khách quay lại.
   - Dữ liệu submit qua /api/submit-lead (Vercel serverless) -> Google Apps
     Script -> tab "WATERPOINT" cua Sheet "DATA WEB ERA" (chung voi cac form
     landing Waterpoint o ERA_Website_FE, formId: WP_VR_POPUP).
   - Thêm nguồn quảng cáo mới: chỉ cần thêm 1 dòng vào NGUON_QUANG_CAO.
   ═══════════════════════════════════════════════════════════════ */

const NGUON_QUANG_CAO = [
  { ma: "batdongsan", ten: "Batdongsan.com.vn", domain: "batdongsan.com.vn" },
];

export { NGUON_QUANG_CAO };

const FORM_NAME = "dang-ky-gio-hang-doc-quyen";
const DA_HIEN_KEY = "wp-lead-popup-da-hien";
const SAN_PHAM = ["Nhà phố", "Biệt thự đơn lập", "Biệt thự song lập"];

function timNguon(): { ma: string; ten: string } | null {
  try {
    const src = new URLSearchParams(window.location.search).get("src");
    const theoQuery = NGUON_QUANG_CAO.find((n) => n.ma === src);
    if (theoQuery) return theoQuery;
  } catch {
    /* bỏ qua */
  }
  try {
    const host = new URL(document.referrer).hostname;
    const theoReferrer = NGUON_QUANG_CAO.find((n) => host.includes(n.domain));
    if (theoReferrer) return theoReferrer;
  } catch {
    /* referrer trống hoặc không hợp lệ */
  }
  return null;
}

/* Lấy IP công cộng của khách (timeout 3 giây, lỗi thì bỏ trống) */
async function layIP(): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch("https://api.ipify.org?format=json", {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = (await res.json()) as { ip?: string };
    return data.ip || "";
  } catch {
    return "";
  }
}

export function LeadPopup() {
  const [nguon, setNguon] = useState<{ ma: string; ten: string } | null>(null);
  const [hien, setHien] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const [daGui, setDaGui] = useState(false);
  const [loi, setLoi] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(DA_HIEN_KEY)) return;
    /* Khach vang tren trang 60 giay roi moi hien popup — de ho kip xem
       pano/loc truoc, khong bi popup lam phien ngay khi vao. */
    const timer = setTimeout(() => {
      const n = timNguon();
      if (!n) return;
      setNguon(n);
      setHien(true);
      sessionStorage.setItem(DA_HIEN_KEY, "1");
    }, 60000);
    return () => clearTimeout(timer);
  }, []);

  /* Popup chỉ bật display khi đủ điều kiện; form nằm sẵn trong DOM. */
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (dangGui) return;
    setLoi("");
    const form = e.currentTarget;

    const ten = form.hoTen.value.trim();
    const sdt = form.soDienThoai.value.trim();
    const email = form.email.value.trim();
    if (!ten) return setLoi("Vui lòng nhập họ tên.");
    if (!/^(0|\+84)\d{8,9}$/.test(sdt.replace(/[\s.-]/g, "")))
      return setLoi("Số điện thoại chưa đúng (vd: 0901234567).");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setLoi("Email chưa đúng định dạng.");

    const quanTam = SAN_PHAM.filter((sp) => {
      const cb = form.querySelector<HTMLInputElement>(`input[data-sp="${sp}"]`);
      return cb?.checked;
    }).join(", ");

    setDangGui(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const payload = {
        formId: "WP_VR_POPUP",
        hoten: ten,
        sdt: sdt,
        email: email,
        sanpham: quanTam,
        sheet: "WATERPOINT",
        url: window.location.href,
        utm_source: params.get("utm_source") || nguon?.ma || "",
        utm_medium: params.get("utm_medium") || "",
        utm_campaign: params.get("utm_campaign") || "",
        utm_term: params.get("utm_term") || "",
        utm_content: params.get("utm_content") || "",
        adclid: params.get("adclid") || "",
        adclida: params.get("adclida") || "",
        mglnd: params.get("mgclid") || "",
        ip: await layIP(),
        userAgent: navigator.userAgent,
      };
      const res = await fetch("/api/submit-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
      } | null;
      if (!res.ok || !json?.success) throw new Error();
      setDaGui(true);
    } catch {
      setLoi("Gửi chưa được, bạn thử lại giúp mình nhé.");
    } finally {
      setDangGui(false);
    }
  }

  const vang = "#E0B14A";
  const teal = "#003C4B";

  return (
    <>
      <div
        aria-hidden={!hien}
        style={{
          display: hien ? "flex" : "none",
          position: "fixed",
          inset: 0,
        zIndex: 99999,
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,10,14,.72)",
        fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif",
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setHien(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="ĐĂNG KÝ NHẬN GIỎ HÀNG ĐỘC QUYỀN"
        className="wp-popup-card"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 440,
          background: `linear-gradient(160deg, ${teal}, #0A2A34)`,
          color: "#fff",
          borderRadius: 16,
          padding: "28px 26px 24px",
          boxShadow: "0 24px 60px rgba(0,0,0,.5)",
          border: "1px solid rgba(224,177,74,.35)",
        }}
      >
        <button
          type="button"
          aria-label="Đóng"
          onClick={() => setHien(false)}
          style={{
            position: "absolute",
            top: 10,
            right: 12,
            background: "none",
            border: 0,
            color: "rgba(255,255,255,.6)",
            fontSize: 22,
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        {daGui ? (
          <div style={{ textAlign: "center", padding: "18px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>✅</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>Đăng ký thành công!</h3>
            <p style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>
              Chuyên viên ERA Vietnam sẽ liên hệ với bạn trong thời gian sớm nhất.
            </p>
          </div>
        ) : (
          <>
            <h3
              style={{
                margin: "0 0 4px",
                fontSize: 21,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                textAlign: "center",
              }}
            >
              <span style={{ color: vang }}>Đăng ký nhận</span>
              <br />
              <span
                style={{
                  color: "#ff3b45",
                  textShadow: "0 0 10px rgba(255,59,69,.45)",
                }}
              >
                giỏ hàng độc quyền
              </span>
            </h3>
            <p style={{ margin: "0 0 18px", fontSize: 13, opacity: 0.75, textAlign: "center" }}>
              Aquaria &amp; Park Village — ERA Vietnam phân phối độc quyền
            </p>

            {/* Form luôn có trong DOM (ẩn bằng CSS) để tránh nhấp nháy lúc mở */}
            <form name={FORM_NAME} onSubmit={submit} noValidate>
              <input type="hidden" name="form-name" value={FORM_NAME} />

              <label style={labelStyle}>Họ tên *</label>
              <input name="hoTen" type="text" placeholder="Nguyễn Văn A" style={inputStyle} />

              <label style={labelStyle}>Số điện thoại *</label>
              <input name="soDienThoai" type="tel" placeholder="0901 234 567" style={inputStyle} />

              <label style={labelStyle}>Email (không bắt buộc)</label>
              <input name="email" type="email" placeholder="email@example.com" style={inputStyle} />

              <label style={labelStyle}>Quan tâm đến:</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {SAN_PHAM.map((sp) => (
                  <label
                    key={sp}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 12px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,.25)",
                      fontSize: 13,
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <input type="checkbox" data-sp={sp} style={{ accentColor: vang }} />
                    {sp}
                  </label>
                ))}
              </div>

              {loi && (
                <p style={{ color: "#ff9a9a", fontSize: 13, margin: "0 0 10px" }}>{loi}</p>
              )}

              <button
                type="submit"
                disabled={dangGui}
                onMouseEnter={(e) => {
                  if (dangGui) return;
                  e.currentTarget.style.background = "#c99f35";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = vang;
                  e.currentTarget.style.transform = "scale(1)";
                }}
                style={{
                  width: "100%",
                  padding: "13px 0",
                  border: 0,
                  borderRadius: 10,
                  background: vang,
                  color: teal,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: dangGui ? "wait" : "pointer",
                  opacity: dangGui ? 0.7 : 1,
                  transition: "background .15s ease, transform .15s ease",
                }}
              >
                {dangGui ? "Đang gửi…" : "NHẬN GIỎ HÀNG NGAY"}
              </button>
              <p style={{ margin: "10px 0 0", fontSize: 11, opacity: 0.55, textAlign: "center" }}>
                Thông tin của bạn được bảo mật tuyệt đối.
              </p>
            </form>
          </>
        )}
      </div>
      </div>

      {/* Nút floating góc phải dưới — LUÔN hiện để khách tự mở form;
          bấm để mở lại popup. */}
      <style>{`
        @keyframes wpRung {
          0%, 100% { transform: rotate(0deg); }
          4% { transform: rotate(-16deg); }
          8% { transform: rotate(13deg); }
          12% { transform: rotate(-10deg); }
          16% { transform: rotate(7deg); }
          20% { transform: rotate(0deg); }
        }
        @keyframes wpVong {
          0% { transform: scale(1); opacity: .65; }
          18% { transform: scale(1.9); opacity: 0; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        /* Mobile: thu nho toan bo popup (chu, field, padding...) */
        @media (max-width: 480px) { .wp-popup-card { zoom: .85; } }
        @media (max-width: 380px) { .wp-popup-card { zoom: .78; } }
      `}</style>
      {!hien && (
        <button
          type="button"
          aria-label="Mở form đăng ký nhận giỏ hàng"
          onClick={() => setHien(true)}
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            zIndex: 99998,
            width: 58,
            height: 58,
            borderRadius: "50%",
            background: teal,
            border: "2px solid #7FD3E3",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 20px rgba(0,0,0,.45)",
            transition: "transform .15s ease, box-shadow .15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = "0 10px 26px rgba(0,0,0,.55)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,.45)";
          }}
        >
          {/* Vòng tròn lan tỏa (2 vòng lệch nhau) */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: -2,
              borderRadius: "50%",
              border: `2px solid ${vang}`,
              animation: "wpVong 2.4s ease-out infinite",
              pointerEvents: "none",
            }}
          />
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: -2,
              borderRadius: "50%",
              border: `2px solid ${vang}`,
              animation: "wpVong 2.4s ease-out 0.12s infinite",
              pointerEvents: "none",
            }}
          />
          {/* Icon điện thoại — rung lắc kiểu chuông mỗi 2.4 giây */}
          <span
            aria-hidden
            style={{
              display: "flex",
              animation: "wpRung 2.4s ease-in-out infinite",
              transformOrigin: "50% 10%",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width={25}
              height={25}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </span>
        </button>
      )}
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  margin: "12px 0 6px",
  opacity: 0.85,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,.2)",
  background: "rgba(255,255,255,.08)",
  color: "#fff",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
};
