/* ==================================================================
   ERA VIETNAM · WATERPOINT — NGUON BANG HANG (Google Sheet)
   Dung chung cho trang Gio hang (va sau nay bang van hanh).

   File Sheet:  "WATERPOINT - Gio hang ERA doc quyen (nguon cho web 360)"
   tao 24/09/2026 tren Drive cua Anh Tony, tu 2 file Excel ERA 15/09.
   https://docs.google.com/spreadsheets/d/1DEWyJ4cpESWNcmE8Ce7LT2FuRmvSguTgPNOlJjqxW-w/edit
   🔴 24/09 Anh Tony: "xoa tat ca data gio hang cu, lam theo gio hang moi".
      Sheet cu 17/09 (96 dong PV trong) DA CHO VAO THUNG RAC Drive.

   🔴 MOI PHAN KHU MOT THE (tab): "Park Village" · "The Aqua" · "Rivera"
      (Anh Tony hoi 24/09 va chot kieu nay - dan de Excel moi vao dung the).
      Web doc THEO TEN THE => DUNG DOI TEN THE. Doi la web bao loi va roi
      ve ban du phong (dong 🟡 trong hop thong tin).
   🔴 CHI CAN ERA DOC QUYEN nam trong Sheet. Can nao CO trong Sheet thi web
      to sang + bam duoc; can nao KHONG co thi mo di, khong bam duoc.
      => Xoa mot dong trong Sheet = can do tat tren web. Them dong = sang len
         (neu ban ve da co khung cho can do).
   🔴 KHOA NOI = cot "Mã sản phẩm" dung y kieu Excel (V96-A00.01, AQU-D04.01).
      Trang giohang tu doi ma tren ban ve (A01, D4-01) sang ma nay.

   ------------------------------------------------------------------
   🔴 KHAC HAN BAN PGBL O MOT DIEM - VA DAY LA DIEM QUAN TRONG NHAT:

      PGBL khai CUNG cac cot (Ma lo · Trang thai · Gia · Ghi chu).
      Ban nay KHONG khai cot nao ngoai hai cot bat buoc. Anh Tony chot
      17/09: *"cac cot bo sung sau vi chua co, sau nay minh map cac
      truong voi nhau thong qua ma can"*.

      => Doc ca bang. Cot nao co trong Sheet thi HIEN COT DO ra hop
         thong tin, dung thu tu trong Sheet. Anh them cot "Dien tich",
         "Gia ban", "Huong" luc nao cung duoc, KHONG phai sua file nay.

      Chi 2 ten cot duoc doi xu dac biet:
        · "Ma lo"     -> khoa noi (BAT BUOC co, khong co thi bao loi ro)
        · "Trang thai"-> quyet dinh MAU TO cua lo
      Con lai: hien nguyen van.
   ------------------------------------------------------------------
   THU TU LAY DU LIEU (2 lop):
     1. GOOGLE SHEET  - nguon that
     2. `giohang/gio-hang-era.json` - BAN DU PHONG chep y Sheet ngay 24/09.
        Sheet chua bat chia se / mat mang thi van hien du 67 can ERA.
        ⚠️ Sheet doi ma file nay khong doi => mat mang se thay so cu.
   ================================================================== */

window.ERA_BH = (function () {

  var C = {
    SHEET_ID  : '1DEWyJ4cpESWNcmE8Ce7LT2FuRmvSguTgPNOlJjqxW-w',

    /* 🔴 24/09: DOC NHIEU THE THEO TEN (truoc la "the dau tien").
       Bai hoc PGBL 12/08 "khai ten tab roi doi ten la gay" VAN DUNG - nhung
       moi phan khu mot the la Anh Tony chot, nen chap nhan va BAT LOI doi
       ten (xem `nap`). Them phan khu = them ten o day. */
    THE       : ['Park Village', 'The Aqua', 'Rivera', 'Rivera Nagomi'],   /* 25/09: Anh Tony them the Nagomi (gid 33410820) */
    DU_PHONG  : 'gio-hang-era.json',

    /* Bo cuoc sau bao lau. Khong co timeout thi Google bi chan =
       trang treo mai o "dang nap" (bai hoc PGBL 12/08). */
    TIMEOUT_MS: 8000,

    /* Ten cot bat buoc - so khop sau khi bo dau, nen "MÃ LÔ" / "ma lo" /
       "Mã căn" deu nhan ra. */
    COT_MA    : ['ma lo', 'ma can', 'ma san pham', 'ma'],
    /* 🔴 24/09 BO 'tinh trang' ra khoi day: Excel moi co cot "Tình trạng xây
       dựng" (Đã xây/Chưa xây) - KHONG PHAI trang thai ban. Ai do go tat cot
       thanh "Tình trạng" la web to mau ban hang theo tien do xay. */
    COT_TT    : ['trang thai', 'trang thai ban hang'],
    /* Cot khong hien lai trong hop thong tin (da hien o cho khac roi) */
    COT_AN    : ['ma lo', 'ma can', 'ma san pham', 'ma', 'phan khu', 'stt',
                 'phan khu ban hang'],

    /* 🆕 24/09 (toi) - BO LOC "san pham + dien tich + gia". Ba cot nay duoc
       DOC RIENG thanh truong co kieu (ngoai viec van hien trong hop thong tin):
         · "Loại hình"          -> `loaiHinh` (chuoi). O trong => trang giohang
                                   lay loai tu ban ve (`lo-goc-*.json`).
         · "Diện tích đất (m2)" -> `dtDat` (so). Viet kieu My "593.56".
         · "Giá bán"            -> `gia` = giaTy(...) (xem ham ben duoi). */
    COT_LOAI  : ['loai hinh', 'loai hinh san pham', 'loai san pham'],
    COT_DT    : ['dien tich dat (m2)', 'dien tich dat', 'dien tich dat (m²)'],
    COT_GIA   : ['gia ban', 'gia', 'gia ban (ty)'],

    /* 🔴 4 trang thai - chep y ban PGBL da chay tu 12/08 de khoi phai nho
       hai quy uoc khac nhau. Anh Tony 17/09 de trong cot nay, nen hien gio
       moi lo deu ve MAC_DINH. Sua o day la sua ca web. */
    DS        : ['Còn hàng', 'Đã cọc', 'Đã bán', 'Lock'],
    MAU       : { 'Còn hàng': '#41B3E0', 'Đã cọc': '#5B2D86',
                  'Đã bán': '#C8102E', 'Lock': '#888888' },
    MAC_DINH  : 'Còn hàng'
  };

  /* Chuoi tu Google Sheet hay o dang NFD. Khong chuan hoa NFC thi
     'Đã bán' != 'Đã bán' - bay that, da dinh 2 lan ben PGBL. */
  function nfc(s) {
    s = (s == null) ? '' : String(s);
    try { return s.normalize('NFC'); } catch (e) { return s; }
  }
  function khongDau(s) {
    s = nfc(s).toLowerCase().trim();
    try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
    return s.replace(/đ/g, 'd').replace(/\s+/g, ' ');
  }

  var TRA = {};
  C.DS.forEach(function (t) { TRA[khongDau(t)] = t; });
  [['con', 'Còn hàng'], ['con hang', 'Còn hàng'], ['available', 'Còn hàng'],
   ['coc', 'Đã cọc'], ['da coc', 'Đã cọc'], ['deposit', 'Đã cọc'],
   ['ban', 'Đã bán'], ['da ban', 'Đã bán'], ['sold', 'Đã bán'],
   ['lock', 'Lock'], ['khoa', 'Lock'], ['da khoa', 'Lock'], ['giu cho', 'Lock']
  ].forEach(function (p) { TRA[p[0]] = p[1]; });

  /* Khong nhan ra thi ve MAC_DINH: tha bao "con hang" nham con hon to do
     "da ban" nham roi mat khach. */
  function chuanTT(s) {
    var k = khongDau(s);
    return k ? (TRA[k] || C.MAC_DINH) : C.MAC_DINH;
  }

  /* Ma lo: bo khoang trang, viet hoa, 'A1' -> 'A01' */
  function chuanMa(s) {
    s = nfc(s).toUpperCase().replace(/[\s_.]/g, '');
    var m = s.match(/^([A-Z])(\d{1,3})$/);
    return m ? (m[1] + (m[2].length < 2 ? '0' + m[2] : m[2])) : s;
  }

  /* ================================================================
     🆕 24/09 - DOC GIA  "25" · "25 tỷ" · "2,4 tỷ" · "2.400 triệu"
     LUAT ANH TONY: gia trong Sheet chi ghi 2 CHU SO CO NGHIA. Nen moi gia
     la MOT KHOANG [v, v + 1 don vi cua chu so thu 2):
        25     -> 25 – 26 tỷ          2,4 -> 2,4 – 2,5 tỷ
        120    -> 120 – 130 tỷ        9,5 -> 9,5 – 9,6 tỷ
     Ghi du 3 chu so tro len (2,45) thi CAT ve 2 chu so (2,4) - khoang
     [2,4 ; 2,5) van chua dung gia that.
     Don vi:  "tỷ"/"ty"/"t" -> tỷ ·  "triệu"/"tr" -> /1000 ·  khong ghi don vi:
        < 1000 -> tỷ (Anh ghi "25") · >= 1000 -> triệu ("2400") ·
        >= 1e6 -> dong ("25000000000").
     Dau cham/phay: nhom 3 chu so dung sau dau ("2.400", "2,400") = PHAN CACH
     NGHIN; con lai ("2,4", "2.4", "25,5") = THAP PHAN. Co ca hai dau thi dau
     dung SAU la thap phan ("2.400,5").
     Tra ve null neu o trong / khong co so (vd "Liên hệ").
     Kiem bang node: `node _kiem-gia.test.js` (thu muc wp-thuc-te).
     ================================================================ */
  function soVN(t) {
    var cham = t.lastIndexOf('.'), phay = t.lastIndexOf(',');
    if (cham >= 0 && phay >= 0) {
      var tp = cham > phay ? '.' : ',', ng = tp === '.' ? ',' : '.';
      return parseFloat(t.split(ng).join('').replace(tp, '.'));
    }
    var d = cham >= 0 ? '.' : (phay >= 0 ? ',' : '');
    if (!d) return parseFloat(t);
    var p = t.split(d);
    var nghin = p.length > 1 && p.slice(1).every(function (x) { return x.length === 3; });
    if (nghin) return parseFloat(p.join(''));
    return parseFloat(p.slice(0, -1).join('') + '.' + p[p.length - 1]);
  }

  function giaTy(s) {
    var k = khongDau(s);
    if (!k) return null;
    var m = k.match(/\d[\d.,]*/);
    if (!m) return null;
    var t = m[0].replace(/[.,]+$/, '');
    var v = soVN(t);
    if (!isFinite(v) || v <= 0) return null;
    var sau = k.slice(m.index + m[0].length);
    if (/^\s*(ty|t\b|b\b|bil)/.test(sau)) { /* tỷ */ }
    else if (/^\s*(trieu|tr\b|m\b|mil)/.test(sau)) v = v / 1000;
    else if (v >= 1e6) v = v / 1e9;
    else if (v >= 1000) v = v / 1000;
    /* buoc = 1 don vi cua chu so co nghia thu 2 */
    var buoc = Math.pow(10, Math.floor(Math.log(v) / Math.LN10 + 1e-9) - 1);
    var n = Math.floor(v / buoc + 1e-6);          /* so nguyen 10..99 */
    var tu = lamTron(n * buoc), den = lamTron((n + 1) * buoc);
    return { v: tu, tu: tu, den: den, buoc: buoc, goc: nfc(s).trim() };
  }
  function lamTron(x) { return Math.round(x * 1e6) / 1e6; }

  /* 2,4 -> "2,4" · 25 -> "25" (dau phay thap phan kieu VN) */
  function vietSo(x) {
    return String(lamTron(x)).replace('.', ',');
  }

  /* 🆕 24/09 - CHIA CHIP KHOANG GIA TU DU LIEU.
     Nhan mang ket qua giaTy() (bo null). Buoc chip S lay trong day dep
     1·2·5 × 10^k, S >= buoc lon nhat cua cac gia (va >= (max-min)/5 de
     ra ~4-5 chip). Vi S la boi cua MOI buoc gia => mep chip roi dung ranh
     chu so thu 2 => moi can nam GON trong DUNG MOT chip, khong can nao
     vat qua mep. Chip rong bi bo. Tra ve [{tu, den, nhan}]. */
  function chiaNhomGia(ds) {
    ds = (ds || []).filter(function (g) { return g && isFinite(g.tu); });
    if (!ds.length) return [];
    var min = Infinity, max = -Infinity, bMax = 0;
    ds.forEach(function (g) {
      if (g.tu < min) min = g.tu;
      if (g.den > max) max = g.den;
      if (g.buoc > bMax) bMax = g.buoc;
    });
    var can = Math.max(bMax, (max - min) / 5), S = null;
    for (var e = -3; e <= 4 && S === null; e++) {
      [1, 2, 5].forEach(function (a) {
        var x = lamTron(a * Math.pow(10, e));
        if (S === null && x >= can - 1e-9) S = x;
      });
    }
    var dau = Math.floor(min / S + 1e-9), cuoi = Math.ceil(max / S - 1e-9), kq = [];
    for (var i = dau; i < cuoi; i++) {
      var tu = lamTron(i * S), den = lamTron((i + 1) * S);
      var co = ds.some(function (g) { return g.tu >= tu - 1e-9 && g.den <= den + 1e-9; });
      if (co) kq.push({ tu: tu, den: den, nhan: vietSo(tu) + ' – ' + vietSo(den) + ' tỷ' });
    }
    return kq;
  }

  /* "593.56" / "593,56" -> 593.56. Dien tich viet kieu My trong Excel ERA.
     ⚠️ KHONG dung soVN() o day: "332.111" (o la C04) se thanh 332111. */
  function soDT(s) {
    var t = nfc(s).trim().replace(/[^\d.,]/g, '');
    if (!t) return null;
    if (t.indexOf('.') < 0 && t.indexOf(',') >= 0) t = t.replace(',', '.');
    else t = t.replace(/,/g, '');
    var v = parseFloat(t);
    return isFinite(v) ? v : null;
  }

  /* Bo doc CSV tu viet - KHONG dung split(',') duoc vi o Ghi chu co dau
     phay va gia hay viet '2,4 tỷ' (bai hoc PGBL 12/08). */
  function docCSV(text) {
    var hang = [], o = '', d = [], nhay = false, i, ch;
    for (i = 0; i < text.length; i++) {
      ch = text[i];
      if (nhay) {
        if (ch === '"') { if (text[i + 1] === '"') { o += '"'; i++; } else { nhay = false; } }
        else { o += ch; }
      } else if (ch === '"') { nhay = true; }
      else if (ch === ',') { d.push(o); o = ''; }
      else if (ch === '\n') { d.push(o); hang.push(d); d = []; o = ''; }
      else if (ch !== '\r') { o += ch; }
    }
    if (o !== '' || d.length) { d.push(o); hang.push(d); }
    return hang;
  }

  /* 🔴 TIM DONG TIEU DE, KHONG MAC DINH LA DONG 1.
     Ly do that: file Sheet Em tao 17/09 co the co mot dong trong o tren,
     va sau nay Anh rat de them mot dong tieu de "BANG HANG WATERPOINT".
     Ca hai truong hop deu lam bo doc "dong 1 la tieu de" tra ve RONG MA
     KHONG BAO LOI. Nen: quet 10 dong dau, dong nao co o ten la ma lo
     thi do la tieu de. */
  function timTieuDe(hang) {
    for (var i = 0; i < Math.min(hang.length, 10); i++) {
      for (var j = 0; j < hang[i].length; j++) {
        if (C.COT_MA.indexOf(khongDau(hang[i][j])) >= 0) return i;
      }
    }
    return -1;
  }

  /* Nhan MANG DONG (da tach tu CSV hoac tu file du phong), GHI THEM vao
     `bang`, tra ve so dong doc duoc. */
  function phanTich(hang, bang) {
    var iTD = timTieuDe(hang);
    if (iTD < 0) {
      throw new Error('Không thấy cột "Mã sản phẩm" trong Sheet. Dòng tiêu đề phải có ô ghi ' +
                      'đúng chữ "Mã sản phẩm" (hoặc "Mã lô" / "Mã căn").');
    }
    var cot = hang[iTD].map(function (s) { return nfc(s).trim(); });
    var iMa = -1, iTT = -1, iLoai = -1, iDT = -1, iGia = -1, j;
    for (j = 0; j < cot.length; j++) {
      var k = khongDau(cot[j]);
      if (iMa < 0 && C.COT_MA.indexOf(k) >= 0) iMa = j;
      if (iTT < 0 && C.COT_TT.indexOf(k) >= 0) iTT = j;
      if (iLoai < 0 && C.COT_LOAI.indexOf(k) >= 0) iLoai = j;
      if (iDT < 0 && C.COT_DT.indexOf(k) >= 0) iDT = j;
      if (iGia < 0 && C.COT_GIA.indexOf(k) >= 0) iGia = j;
    }
    function o(r, j) { return j >= 0 ? nfc(r[j] == null ? '' : r[j]).trim() : ''; }
    var dem = 0;
    for (var i = iTD + 1; i < hang.length; i++) {
      var r = hang[i];
      if (!r || !r[iMa] || !nfc(r[iMa]).trim()) continue;
      var ma = chuanMa(r[iMa]);
      var truong = [];
      for (j = 0; j < cot.length; j++) {
        if (!cot[j]) continue;
        if (C.COT_AN.indexOf(khongDau(cot[j])) >= 0) continue;
        if (j === iTT) continue;                       /* hien rieng thanh chip */
        /* Loai hinh hien o dong dau hop thong tin, Gia hien rieng "~25 tỷ" */
        if (j === iLoai || j === iGia) continue;
        var v = nfc(r[j] == null ? '' : r[j]).trim();
        if (v) truong.push([cot[j], v]);
      }
      bang[ma] = {
        ma: ma,
        trangThai: iTT >= 0 ? chuanTT(r[iTT]) : C.MAC_DINH,
        truong: truong,
        loaiHinh: o(r, iLoai),                         /* '' = chua ghi */
        dtDat: soDT(o(r, iDT)),                        /* null = chua ghi */
        gia: giaTy(o(r, iGia)),                        /* null = chua co gia */
        giaGoc: o(r, iGia)
      };
      dem++;
    }
    return dem;
  }

  var _bang = null, _nguon = 'chua-nap', _luc = null, _loi = '';

  function layCSV(ten) {
    var u = 'https://docs.google.com/spreadsheets/d/' + C.SHEET_ID +
            '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(ten);
    var ac = null, hen = null;
    try { ac = new AbortController(); } catch (e) {}
    if (ac) hen = setTimeout(function () { try { ac.abort(); } catch (e) {} }, C.TIMEOUT_MS);
    return fetch(u, ac ? { signal: ac.signal } : undefined)
      .then(function (r) {
        if (hen) clearTimeout(hen);
        if (!r.ok) throw new Error('Google trả mã ' + r.status + ' ở thẻ "' + ten + '"');
        return r.text();
      }, function (e) { if (hen) clearTimeout(hen); throw e; });
  }

  /* Lop 2: ban du phong trong web. Cung bo phan tich y het Sheet. */
  function napDuPhong() {
    return fetch(C.DU_PHONG + '?nc=20260925a')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        var bang = {};
        Object.keys(j.the || {}).forEach(function (t) { phanTich(j.the[t], bang); });
        return bang;
      });
  }

  function nap(xong) {
    var sheet = C.SHEET_ID ? Promise.all(C.THE.map(layCSV))
                           : Promise.reject(new Error('Chưa dán SHEET_ID vào wp-banghang.js'));
    sheet.then(function (ds) {
        var bang = {}, dem = 0;
        ds.forEach(function (t) { dem += phanTich(docCSV(t), bang); });
        if (!dem) throw new Error('Sheet đọc được nhưng không có dòng nào có Mã sản phẩm.');
        /* 🔴 gviz gap TEN THE SAI thi tra ve THE DAU TIEN, KHONG bao loi.
           Hau qua: mot the doc 2 lan -> ma trung nhau. Dem ma trung de bat. */
        if (Object.keys(bang).length < dem) {
          throw new Error('Có thẻ trong Sheet bị đổi tên (Google trả về thẻ khác). ' +
                          'Tên thẻ phải đúng: ' + C.THE.join(' · '));
        }
        _bang = bang; _nguon = 'sheet'; _luc = new Date(); _loi = '';
        xong(_bang, trangThai());
      })
      .catch(function (e) {
        _nguon = 'loi';
        /* 🔴 Loi mang phia trinh duyet gan nhu luon bi CORS nuot mat noi dung
           (bai hoc PGBL 12/08). `fetch` chi nem 'Failed to fetch' - vo nghia
           voi Anh Tony. Phai doan nguyen nhan tu ngu canh roi viet cau co nghia. */
        if (e && e.name === 'AbortError') {
          _loi = 'Google không trả lời trong ' + (C.TIMEOUT_MS / 1000) + ' giây.';
        } else if (e instanceof TypeError) {
          _loi = (navigator.onLine === false)
            ? 'Máy đang mất mạng.'
            : 'Không gọi được Google — thường là Sheet chưa mở chia sẻ ' +
              '"Bất kỳ ai có đường liên kết → Người xem".';
        } else {
          _loi = (e && e.message) || 'Lỗi không rõ.';
        }
        return napDuPhong().then(function (b) {
          _bang = b; _nguon = 'du-phong'; _luc = null;
          xong(_bang, trangThai());
        }, function (e2) {
          _loi += ' · Bản dự phòng cũng lỗi: ' + e2.message;
          xong(null, trangThai());
        });
      });
  }

  /* Danh sach moi ma dang co - de trang biet can nao la ERA */
  function tatCa() { return _bang ? Object.keys(_bang) : []; }

  function trangThai() {
    return { nguon: _nguon, luc: _luc, loi: _loi, so_lo: _bang ? Object.keys(_bang).length : 0 };
  }

  function lay(ma) { return _bang ? (_bang[chuanMa(ma)] || null) : null; }

  return {
    C: C, nap: nap, lay: lay, trangThai: trangThai, tatCa: tatCa,
    chuanMa: chuanMa, chuanTT: chuanTT, giaTy: giaTy, soDT: soDT, vietSo: vietSo, chiaNhomGia: chiaNhomGia,
    khongDau: khongDau, mau: function (tt) { return C.MAU[tt] || C.MAU[C.MAC_DINH]; }
  };
})();
