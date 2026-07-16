const { DanhGiaController } = require("../controllers");
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { check_permission, isAuthAdmin } = require("../middleware/auth");
const { LAM_DANH_GIA, DANH_GIA_CAC_KHOA, QUAN_LY_BANG_KIEM_KHOA_MINH } = require("../middleware/actionDefault");

const svRouter = new Router();

// Xem: cả 4 role đã đăng nhập đều xem được — dữ liệu được lọc theo khoa ở
// service (getListDanhGia) dựa vào req.authUser (isAuthAdmin đã gắn sẵn).
svRouter.get("/get-list-danh-gia", isAuthAdmin, Response(DanhGiaController.getListDanhGia));
svRouter.get("/get-danh-gia/:id", isAuthAdmin, Response(DanhGiaController.getDanhGiaById));
svRouter.get("/top-tieu-chi-loi", isAuthAdmin, Response(DanhGiaController.getTopTieuChiLoi));

// Tạo đánh giá: Nhân viên (khoa mình), Trưởng khoa (khoa mình), Phòng QLCL (mọi khoa) — check_permission
// nhận mảng (OR); Admin có mọi slug nên luôn qua được.
svRouter.post("/create-danh-gia", check_permission([LAM_DANH_GIA, DANH_GIA_CAC_KHOA, QUAN_LY_BANG_KIEM_KHOA_MINH]), Response(DanhGiaController.createDanhGia));

// Xoá đánh giá: chỉ role "toàn quyền bảng kiểm" (Trưởng khoa - khoa mình, Admin - mọi khoa).
// Phòng QLCL và Nhân viên KHÔNG được xoá.
svRouter.post("/delete-danh-gia/:id", check_permission(QUAN_LY_BANG_KIEM_KHOA_MINH), Response(DanhGiaController.deleteDanhGia));

module.exports = svRouter;
