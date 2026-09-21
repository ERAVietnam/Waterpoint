"use client";

import { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   POPUP "ĐĂNG KÝ NHẬN GIỎ HÀNG ĐỘC QUYỀN"
   - Chỉ hiện khi khách đến từ nguồn quảng cáo đã đăng ký:
       • query  ?src=<mã nguồn>   (cách chắc chắn nhất, gắn vào link quảng cáo)
       • hoặc referrer chứa domain nguồn (fallback tự động)
   - Mỗi phiên (tab) chỉ hiện 1 lần, không làm phiền khách quay lại.
   - Dữ liệu submit về Netlify Forms (build sẵn trong site, không cần backend).
   - Thêm nguồn quảng cáo mới: chỉ cần thêm 1 dòng vào NGUON_QUANG_CAO.
   ═══════════════════════════════════════════════════════════════ */

const NGUON_QUANG_CAO = [
  { ma: "batdongsan", ten: "Batdongsan.com.vn", domain: "batdongsan.com.vn" },
];

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

export function LeadPopup() {
  const [nguon, setNguon] = useState<{ ma: string; ten: string } | null>(null);
  const [hien, setHien] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const [daGui, setDaGui] = useState(false);
  const [loi, setLoi] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(DA_HIEN_KEY)) return;
    const timer = setTimeout(() => {
      const n = timNguon();
      if (!n) return;
      setNguon(n);
      setHien(true);
      sessionStorage.setItem(DA_HIEN_KEY, "1");
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  /* Form luôn có trong DOM (ẩn bằng CSS) để Netlify Forms nhận diện
     lúc deploy — popup chỉ bật display khi đủ điều kiện. */
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
      const body = new URLSearchParams();
      body.append("form-name", FORM_NAME);
      body.append("ho-ten", ten);
      body.append("so-dien-thoai", sdt);
      body.append("email", email);
      body.append("quan-tam", quanTam || "(chưa chọn)");
      body.append("nguon", nguon ? `${nguon.ten} (${nguon.ma})` : "");
      body.append("trang", window.location.href);
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (!res.ok) throw new Error();
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
        aria-label="Đăng ký nhận giỏ hàng độc quyền"
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
            <h3 style={{ margin: "0 0 4px", fontSize: 21, color: vang }}>
              Đăng ký nhận giỏ hàng độc quyền
            </h3>
            <p style={{ margin: "0 0 18px", fontSize: 13, opacity: 0.75 }}>
              Aquaria &amp; Park Village — ERA Vietnam phân phối độc quyền
            </p>

            {/* Form phải luôn render trong HTML tĩnh để Netlify Forms nhận diện */}
            <form name={FORM_NAME} data-netlify="true" onSubmit={submit} noValidate>
              <input type="hidden" name="form-name" value={FORM_NAME} />
              <input type="hidden" name="nguon" value={nguon?.ten ?? ""} />
              <input type="hidden" name="quan-tam" value="" />

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
