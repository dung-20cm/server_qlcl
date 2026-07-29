const { Anh5sTuanController, BaoCaoZalo5sController } = require("../controllers");
const { Router } = require("express");
const { Response, ResponseExportExcel } = require("../config/handle_response");
const { check_permission } = require("../middleware/auth");
const { QUAN_LY_ANH_5S_TAT_CA_KHOA, XEM_TOAN_QUYEN_BAO_CAO_LICH } = require("../middleware/actionDefault");

const svRouter = new Router();

// Nhóm Zalo 5S / Ảnh 5S: theo yêu cầu chỉ Phòng QLCL (toàn viện) và Admin được
// xem/quản lý — Trưởng khoa và Nhân viên KHÔNG có quyền vào mục này.
// Các route XEM (GET) nhận thêm XEM_TOAN_QUYEN_BAO_CAO_LICH -- quyền "chỉ xem toàn
// viện" của role Lãnh đạo, không kèm quyền quản lý (thêm/sửa/xoá vẫn CHỈ nhận
// QUAN_LY_ANH_5S_TAT_CA_KHOA nên Lãnh đạo không thao tác được).
svRouter.get("/get-list-anh-5s-tuan", check_permission([QUAN_LY_ANH_5S_TAT_CA_KHOA, XEM_TOAN_QUYEN_BAO_CAO_LICH]), Response(Anh5sTuanController.getListAnh5sTuan));
svRouter.get("/get-anh-5s-tuan/:id", check_permission([QUAN_LY_ANH_5S_TAT_CA_KHOA, XEM_TOAN_QUYEN_BAO_CAO_LICH]), Response(Anh5sTuanController.getAnh5sTuanById));
svRouter.post("/create-update-anh-5s-tuan", check_permission(QUAN_LY_ANH_5S_TAT_CA_KHOA), Response(Anh5sTuanController.createUpdateAnh5sTuan));
svRouter.post("/delete-anh-5s-tuan/:id", check_permission(QUAN_LY_ANH_5S_TAT_CA_KHOA), Response(Anh5sTuanController.deleteAnh5sTuan));

// Xuất báo cáo Nhóm Zalo 5S theo mẫu 5S_Dashboard_BVTB_v4.html:
// - HTML: mở lên có nút "🖨 In / Lưu PDF" (?inline=1 để mở thẳng trong tab)
// - Word: file .doc HTML-Word, căn lề NĐ 30/2020/NĐ-CP
// Query: ?tuan=YYYY-MM-DD (thứ 2 đầu tuần) — bỏ trống = tổng hợp tất cả tuần
svRouter.get("/export-bao-cao-html", check_permission([QUAN_LY_ANH_5S_TAT_CA_KHOA, XEM_TOAN_QUYEN_BAO_CAO_LICH]), ResponseExportExcel(BaoCaoZalo5sController.exportBaoCaoHTML));
svRouter.get("/export-bao-cao-word", check_permission([QUAN_LY_ANH_5S_TAT_CA_KHOA, XEM_TOAN_QUYEN_BAO_CAO_LICH]), ResponseExportExcel(BaoCaoZalo5sController.exportBaoCaoWord));

module.exports = svRouter;
