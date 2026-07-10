const { baoCaoZalo5sServices } = require("../service");

// Ghi file trực tiếp vào response (không bọc JSON) — dùng với
// ResponseExportExcel giống các route export khác.
const sendFile = (res, file, disposition) => {
    res.setHeader("Content-Type", file.contentType);
    res.setHeader(
        "Content-Disposition",
        `${disposition}; filename*=UTF-8''${encodeURIComponent(file.filename)}`
    );
    res.send(file.content);
};

// GET /api/anh-5s-tuan/export-bao-cao-html?tuan=YYYY-MM-DD[&inline=1]
// File HTML theo mẫu v4 — mở lên có nút "🖨 In / Lưu PDF".
// inline=1: mở thẳng trong tab trình duyệt thay vì tải về.
const exportBaoCaoHTML = async (req, res) => {
    const file = await baoCaoZalo5sServices.exportBaoCaoHTML(req.query);
    sendFile(res, file, req.query.inline === "1" ? "inline" : "attachment");
};

// GET /api/anh-5s-tuan/export-bao-cao-word?tuan=YYYY-MM-DD
// File .doc (HTML-Word) theo mẫu v4, căn lề NĐ 30/2020/NĐ-CP.
const exportBaoCaoWord = async (req, res) => {
    const file = await baoCaoZalo5sServices.exportBaoCaoWord(req.query);
    sendFile(res, file, "attachment");
};

module.exports = {
    exportBaoCaoHTML,
    exportBaoCaoWord,
};
