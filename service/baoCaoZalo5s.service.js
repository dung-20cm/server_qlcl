const { Op } = require("sequelize");
const { Anh5sTuan, Anh5sTuanVitri, Khoa, VitriType } = require("../model");

// ═══════════════════════════════════════════════════════════════
// Service xuất báo cáo "Nhóm Zalo 5S" — HTML (in/lưu PDF) & Word
// Template lấy theo mẫu exportBaoCaoZalo() / exportZaloWord()
// trong 5S_Dashboard_BVTB_v4.html (phiên bản frontend thuần).
// ═══════════════════════════════════════════════════════════════

// ── Helpers ────────────────────────────────────────────────────
const escapeHtml = (s) =>
    String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

// 'YYYY-MM-DD' → 'dd/mm/yyyy' (giữ số 0 đệm, giống fmtDateVN của mẫu v4)
const fmtDateVN = (iso) => {
    if (!iso) return "–";
    const [y, m, d] = String(iso).slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
};

// 'YYYY-MM-DD' + n ngày → 'YYYY-MM-DD' (tính theo UTC, tránh lệch timezone)
const addDaysISO = (iso, n) => {
    const d = new Date(`${String(iso).slice(0, 10)}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
};

// Chuẩn hoá chất lượng ảnh — DB có thể lưu 'Tốt'/'Trung bình'/'Chưa đạt'
// (CMS mới) hoặc 'tot'/'tb'/'chua' (dashboard cũ)
const normClg = (v) => {
    const s = String(v || "").toLowerCase();
    if (s.includes("tốt") || s === "tot") return "tot";
    if (s.includes("trung") || s.includes("khá") || s.includes("kha") || s === "tb") return "tb";
    if (s) return "chua";
    return "";
};
const CLG_TEXT = { tot: "Tốt", tb: "Trung bình", chua: "Chưa đạt" };
const CLG_ICON = { tot: "✅ Tốt", tb: "⚠ Trung bình", chua: "❌ Chưa đạt" };

// ── Gom dữ liệu báo cáo ────────────────────────────────────────
// query: { tuan?: 'YYYY-MM-DD' } — thứ 2 đầu tuần. Không truyền = tổng hợp
// tất cả tuần (mỗi khoa lấy bản ghi tuần mới nhất, giống mẫu v4).
const buildBaoCaoData = async (query = {}) => {
    const tuan = query.tuan ? String(query.tuan).slice(0, 10) : "";

    const khoaRows = await Khoa.findAll({
        where: { active: 1 },
        order: [["id", "asc"]],
        attributes: ["id", "ten_khoa", "nhom"],
    });

    const where = { active: 1 };
    if (tuan) where.tuan = { [Op.eq]: tuan };

    const anhRows = await Anh5sTuan.findAll({
        where,
        order: [["tuan", "desc"], ["id", "desc"]],
        include: [
            { model: Khoa, as: "khoa", attributes: ["id", "ten_khoa"] },
            {
                model: Anh5sTuanVitri,
                as: "vi_tri",
                include: [{ model: VitriType, as: "vitri_type", attributes: ["id", "ten_vitri"] }],
            },
        ],
    });

    // Mỗi khoa giữ bản ghi tuần mới nhất (rows đã sort tuan desc → bản đầu tiên thắng)
    const weekMap = new Map();
    for (const r of anhRows) {
        if (!weekMap.has(r.khoa_id)) weekMap.set(r.khoa_id, r);
    }

    const daGui = khoaRows.filter((k) => weekMap.has(k.id));
    const chuaGui = khoaRows.filter((k) => !weekMap.has(k.id));

    const rec = (k) => weekMap.get(k.id);
    const stats = {
        tongKhoa: khoaRows.length,
        daGui: daGui.length,
        chuaGui: chuaGui.length,
        duSoLuong: daGui.filter((k) => rec(k).so_luong_anh >= 3).length,
        chatLuongTot: daGui.filter((k) => normClg(rec(k).chat_luong) === "tot").length,
    };

    const tuanLabel = tuan
        ? `Tuần từ ngày ${fmtDateVN(tuan)} đến ngày ${fmtDateVN(addDaysISO(tuan, 6))}`
        : "Tổng hợp tất cả các tuần";

    const now = new Date();
    const todayVN = `ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
    const todayShort = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

    const viTriTxt = (r) =>
        r.vi_tri && r.vi_tri.length
            ? r.vi_tri
                .map((v) => (v.vitri_type?.ten_vitri || "").replace(/^\d+\.\s*/, ""))
                .filter(Boolean)
                .join(", ")
            : "—";

    return { tuan, tuanLabel, todayVN, todayShort, daGui, chuaGui, weekMap, stats, viTriTxt };
};

// ── Render HTML report (mở trình duyệt → nút 🖨 In / Lưu PDF) ──
const renderBaoCaoHTML = (d) => {
    const rowsDaGui = d.daGui
        .map((k, i) => {
            const r = d.weekMap.get(k.id);
            return `<tr>
      <td style="text-align:center">${i + 1}</td>
      <td style="font-weight:600">${escapeHtml(k.ten_khoa)}</td>
      <td style="text-align:center">${r.so_luong_anh}</td>
      <td style="font-size:10pt">${escapeHtml(d.viTriTxt(r))}</td>
      <td style="text-align:center">${CLG_ICON[normClg(r.chat_luong)] || escapeHtml(r.chat_luong || "")}</td>
      <td style="font-size:10pt;color:#666">${escapeHtml(r.ghi_chu || "")}</td>
    </tr>`;
        })
        .join("");

    const rowsChuaGui = d.chuaGui
        .map(
            (k, i) =>
                `<tr style="opacity:.7"><td style="text-align:center">${i + 1}</td><td>${escapeHtml(k.ten_khoa)}</td><td colspan="4" style="color:#999;font-style:italic">Chưa gửi ảnh lên nhóm Zalo 5S</td></tr>`
        )
        .join("");

    return `<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8">
<title>Báo cáo Nhóm Zalo 5S – ${escapeHtml(d.tuanLabel)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Times New Roman',Times,serif;font-size:12pt;color:#000;padding:20mm 15mm 20mm 25mm}
  h1{font-size:14pt;font-weight:bold;text-align:center;text-transform:uppercase;margin:6mm 0 2mm}
  h2{font-size:13pt;font-weight:bold;text-align:center;margin:1mm 0 5mm}
  .header{display:flex;justify-content:space-between;margin-bottom:5mm}
  .left,.right{width:48%;text-align:center}
  .coquan{font-weight:bold;text-transform:uppercase;font-size:11pt}
  .gach{border-bottom:1.5pt solid #000;width:40%;margin:2mm auto}
  .quochieu{font-weight:bold;text-transform:uppercase;font-size:11pt}
  .tieungu{font-weight:bold;text-decoration:underline;font-size:12pt}
  table{width:100%;border-collapse:collapse;margin:3mm 0;font-size:11pt}
  th{background:#1B3A5C;color:#fff;padding:5pt 6pt;text-align:center;border:1pt solid #888}
  td{padding:4pt 6pt;border:0.5pt solid #bbb;vertical-align:top}
  .section{font-size:12pt;font-weight:bold;margin:5mm 0 2mm;text-decoration:underline}
  .summary-box{background:#F8F9FA;border:1pt solid #ddd;border-radius:4pt;padding:5mm;margin:3mm 0}
  .stat{display:inline-block;width:22%;text-align:center;padding:3mm}
  .stat-val{font-size:16pt;font-weight:bold;color:#1B3A5C}
  .stat-lbl{font-size:10pt;color:#555}
  @page{size:A4;margin:0}
  @media print{body{padding:20mm 15mm 20mm 25mm}.no-print{display:none}}
</style>
</head><body>
<div class="no-print" style="padding:8px 16px;background:#1B3A5C;color:#fff;font-family:sans-serif;font-size:12px;display:flex;gap:10px;align-items:center">
  <strong>📸 Báo cáo Nhóm Zalo 5S</strong>
  <button onclick="window.print()" style="padding:4px 12px;background:#fff;color:#1B3A5C;border:none;border-radius:3px;font-weight:bold;cursor:pointer">🖨 In / Lưu PDF</button>
</div>
<div class="header">
  <div class="left"><div class="coquan">Bệnh viện Đa khoa Thái Bình</div><div class="coquan">Phòng Quản lý chất lượng</div><div class="gach"></div></div>
  <div class="right"><div class="quochieu">Cộng hòa xã hội chủ nghĩa Việt Nam</div><div class="tieungu">Độc lập – Tự do – Hạnh phúc</div><br><em>Hưng Yên, ngày ${d.todayShort}</em></div>
</div>
<h1>Báo cáo thực hành 5S trên nhóm Zalo 5S bệnh viện</h1>
<h2>${escapeHtml(d.tuanLabel)}</h2>
<div class="summary-box">
  <div class="stat"><div class="stat-val">${d.stats.daGui}/${d.stats.tongKhoa}</div><div class="stat-lbl">Đã gửi ảnh</div></div>
  <div class="stat"><div class="stat-val" style="color:#1D9E75">${d.stats.duSoLuong}</div><div class="stat-lbl">Đủ số lượng (≥3 ảnh)</div></div>
  <div class="stat"><div class="stat-val" style="color:#A32D2D">${d.stats.chuaGui}</div><div class="stat-lbl">Chưa gửi ảnh</div></div>
  <div class="stat"><div class="stat-val" style="color:#185FA5">${d.stats.chatLuongTot}</div><div class="stat-lbl">Ảnh chất lượng tốt</div></div>
</div>
<div class="section">I. Các đơn vị đã gửi ảnh (${d.stats.daGui} đơn vị)</div>
<table><thead><tr><th style="width:4%">TT</th><th>Khoa/Phòng/TT</th><th style="width:8%">Số ảnh</th><th>Vị trí đã gửi</th><th style="width:14%">Chất lượng</th><th>Ghi chú</th></tr></thead>
<tbody>${rowsDaGui}</tbody></table>
<div class="section">II. Các đơn vị chưa gửi ảnh (${d.stats.chuaGui} đơn vị)</div>
<table><thead><tr><th style="width:4%">TT</th><th>Khoa/Phòng/TT</th><th colspan="4">Tình trạng</th></tr></thead>
<tbody>${rowsChuaGui}</tbody></table>
<div style="margin-top:8mm;font-style:italic;font-size:11pt">
Đề nghị các đơn vị chưa gửi ảnh thực hành 5S gửi đủ ảnh (≥3 ảnh/tuần) lên nhóm Zalo <strong>"5S Bệnh viện Đa khoa Thái Bình"</strong> trong thời gian sớm nhất.
</div>
<div style="margin-top:10mm;display:flex;justify-content:space-between;text-align:center;font-size:12pt">
  <div style="width:45%"><em>Người lập báo cáo</em><br><em>(Ký, ghi rõ họ tên)</em><br><br><br></div>
  <div style="width:45%"><strong>Trưởng phòng QLCL</strong><br><em>(Ký, ghi rõ họ tên)</em><br><br><strong>Lương Thị Mai Anh</strong></div>
</div>
</body></html>`;
};

// ── Render Word (.doc HTML-Word, căn lề NĐ 30/2020/NĐ-CP) ──────
const renderBaoCaoWord = (d) => {
    const rowsDaGui = d.daGui
        .map((k, i) => {
            const r = d.weekMap.get(k.id);
            return `<tr>
      <td style="text-align:center;width:4%">${i + 1}</td>
      <td><b>${escapeHtml(k.ten_khoa)}</b></td>
      <td style="text-align:center;width:8%">${r.so_luong_anh}</td>
      <td>${escapeHtml(d.viTriTxt(r))}</td>
      <td style="text-align:center;width:12%">${CLG_TEXT[normClg(r.chat_luong)] || escapeHtml(r.chat_luong || "")}</td>
      <td style="width:14%">${escapeHtml(r.ghi_chu || "")}</td>
    </tr>`;
        })
        .join("");

    const rowsChuaGui = d.chuaGui
        .map(
            (k, i) =>
                `<tr>
      <td style="text-align:center">${i + 1}</td>
      <td colspan="5" style="font-style:italic;color:#555">${escapeHtml(k.ten_khoa)}</td>
    </tr>`
        )
        .join("");

    return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<title>Báo cáo Nhóm Zalo 5S</title>
<!--[if gte mso 9]><xml>
<w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml><![endif]-->
<style>
/* Căn lề theo NĐ 30: trên 20mm, dưới 20mm, trái 30mm, phải 20mm */
@page WordSection1 {
  size: 21.0cm 29.7cm;
  margin: 20mm 20mm 20mm 30mm;
  mso-page-orientation: portrait;
}
body {
  font-family: 'Times New Roman', Times, serif;
  font-size: 13pt;
  line-height: 1.5;
  color: #000;
}
div.Section1 { page: WordSection1; }
p { margin: 0; padding: 0; }
table { border-collapse: collapse; width: 100%; }
td, th { font-family: 'Times New Roman', Times, serif; font-size: 12pt; vertical-align: top; padding: 3pt 5pt; }
.tbl-border td, .tbl-border th { border: 0.5pt solid #000; }
th { font-weight: bold; text-align: center; background: #DDEEFF; }
</style>
</head>
<body>
<div class="Section1">

<!-- QUỐC HIỆU TIÊU NGỮ -->
<table style="width:100%;border:none;margin-bottom:2mm">
  <tr>
    <td style="width:50%;text-align:center;border:none;vertical-align:top">
      <p style="font-size:11pt;font-weight:bold;text-transform:uppercase">Sở Y tế Thái Bình</p>
      <p style="font-size:12pt;font-weight:bold;text-transform:uppercase">Bệnh viện Đa khoa Thái Bình</p>
      <p style="font-size:11pt;margin-top:1mm">Số:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;/BC-QLCL</p>
    </td>
    <td style="width:50%;text-align:center;border:none;vertical-align:top">
      <p style="font-size:13pt;font-weight:bold;text-transform:uppercase">Cộng hòa xã hội chủ nghĩa Việt Nam</p>
      <p style="font-size:13pt;font-weight:bold"><u>Độc lập – Tự do – Hạnh phúc</u></p>
    </td>
  </tr>
</table>

<!-- NGÀY THÁNG NĂM (căn phải) -->
<p style="text-align:right;font-size:12pt;font-style:italic;margin-bottom:5mm">
  <i>Hưng Yên, ${d.todayVN}</i>
</p>

<!-- TÊN BÁO CÁO -->
<p style="text-align:center;font-size:14pt;font-weight:bold;text-transform:uppercase;margin:4mm 0 1mm">
  Báo cáo
</p>
<p style="text-align:center;font-size:13pt;font-weight:bold;margin-bottom:1mm">
  Thực hành 5S trên Nhóm Zalo 5S Bệnh viện Đa khoa Thái Bình
</p>
<p style="text-align:center;font-size:12pt;font-style:italic;margin-bottom:5mm">
  ${escapeHtml(d.tuanLabel)}
</p>

<!-- TỔNG QUAN -->
<table style="width:100%;border:none;margin-bottom:5mm">
  <tr>
    <td style="text-align:center;border:1pt solid #000;padding:4mm;width:25%">
      <p style="font-size:18pt;font-weight:bold">${d.stats.daGui}/${d.stats.tongKhoa}</p>
      <p style="font-size:11pt">Đơn vị đã gửi ảnh</p>
    </td>
    <td style="text-align:center;border:1pt solid #000;padding:4mm;width:25%">
      <p style="font-size:18pt;font-weight:bold">${d.stats.duSoLuong}</p>
      <p style="font-size:11pt">Đủ số lượng (≥3 ảnh)</p>
    </td>
    <td style="text-align:center;border:1pt solid #000;padding:4mm;width:25%">
      <p style="font-size:18pt;font-weight:bold">${d.stats.chuaGui}</p>
      <p style="font-size:11pt">Đơn vị chưa gửi</p>
    </td>
    <td style="text-align:center;border:1pt solid #000;padding:4mm;width:25%">
      <p style="font-size:18pt;font-weight:bold">${d.stats.chatLuongTot}</p>
      <p style="font-size:11pt">Ảnh chất lượng tốt</p>
    </td>
  </tr>
</table>

<!-- PHẦN I -->
<p style="font-size:13pt;font-weight:bold;text-decoration:underline;margin:3mm 0 2mm">
  I. Các đơn vị đã gửi ảnh (${d.stats.daGui} đơn vị)
</p>
<table class="tbl-border">
  <thead>
    <tr>
      <th style="width:4%;text-align:center">TT</th>
      <th style="text-align:left">Khoa/Phòng/Trung tâm</th>
      <th style="width:8%;text-align:center">Số ảnh</th>
      <th style="text-align:left">Vị trí đã gửi ảnh</th>
      <th style="width:12%;text-align:center">Chất lượng</th>
      <th style="width:15%;text-align:left">Ghi chú</th>
    </tr>
  </thead>
  <tbody>${rowsDaGui}</tbody>
</table>

<!-- PHẦN II -->
<p style="font-size:13pt;font-weight:bold;text-decoration:underline;margin:4mm 0 2mm">
  II. Các đơn vị chưa gửi ảnh (${d.stats.chuaGui} đơn vị)
</p>
<table class="tbl-border">
  <thead>
    <tr>
      <th style="width:4%;text-align:center">TT</th>
      <th style="text-align:left" colspan="5">Khoa/Phòng/Trung tâm</th>
    </tr>
  </thead>
  <tbody>${rowsChuaGui}</tbody>
</table>

<!-- KIẾN NGHỊ -->
<p style="font-size:12pt;font-style:italic;margin:5mm 0">
  Đề nghị các đơn vị chưa gửi ảnh thực hành 5S khẩn trương gửi đủ ảnh
  (tối thiểu 03 ảnh/tuần) lên nhóm Zalo <b>"5S Bệnh viện Đa khoa Thái Bình"</b>
  để đảm bảo theo dõi, giám sát hoạt động 5S toàn bệnh viện.
</p>

<table style="margin-top:12mm;border:none">
  <tr>
    <td style="width:45%;vertical-align:top;border:none;font-size:12pt">
      <p><b>Nơi nhận:</b></p>
      <p>- Ban Giám đốc (để báo cáo);</p>
      <p>- Các khoa, phòng, TT (để thực hiện);</p>
      <p>- Lưu: VT, QLCL.</p>
    </td>
    <td style="width:55%;text-align:center;vertical-align:top;border:none">
      <p style="font-size:13pt;font-weight:bold;text-transform:uppercase">Trưởng phòng Quản lý Chất lượng</p>
      <p style="font-size:11pt;font-style:italic">(Ký, ghi rõ họ tên)</p>
      <br><br><br>
      <p style="font-size:13pt;font-weight:bold">Lương Thị Mai Anh</p>
    </td>
  </tr>
</table>

</div>
</body>
</html>`;
};

// ── API cấp cao cho controller ─────────────────────────────────
const fileSuffix = (tuan) => (tuan ? tuan.replace(/-/g, "") : "TongHop");

const exportBaoCaoHTML = async (query) => {
    const data = await buildBaoCaoData(query);
    return {
        filename: `BaoCaoZalo5S_${fileSuffix(data.tuan)}.html`,
        contentType: "text/html; charset=utf-8",
        content: renderBaoCaoHTML(data),
    };
};

const exportBaoCaoWord = async (query) => {
    const data = await buildBaoCaoData(query);
    return {
        filename: `BaoCaoZalo5S_${fileSuffix(data.tuan)}.doc`,
        contentType: "application/msword; charset=utf-8",
        content: renderBaoCaoWord(data),
    };
};

module.exports = {
    buildBaoCaoData,
    exportBaoCaoHTML,
    exportBaoCaoWord,
};
