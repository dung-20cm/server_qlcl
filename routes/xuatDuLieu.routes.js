const { XuatDuLieuController } = require("../controllers");
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { check_permission } = require("../middleware/auth");
const { XUAT_DU_LIEU } = require("../middleware/actionDefault");

const svRouter = new Router();

// Trang "Xuất dữ liệu": CHỈ Admin (permission XUAT_DU_LIEU chỉ gán cho role
// admin trong seedRolePermission.js, kể cả Lãnh đạo/Phòng QLCL cũng không có).
// ?bang=tai-khoan|hanh-dong-kp|nhom-zalo|lich-danh-gia|ket-qua-5s|anh-5s
// &tu_ngay=YYYY-MM-DD&den_ngay=YYYY-MM-DD (2 tham số ngày tuỳ chọn)
svRouter.get("/get-bang-du-lieu", check_permission(XUAT_DU_LIEU), Response(XuatDuLieuController.getBangDuLieu));

module.exports = svRouter;
