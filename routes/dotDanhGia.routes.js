const { DotDanhGiaController } = require("../controllers");
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { check_permission, isAuthAdmin } = require("../middleware/auth");
const { CAU_HINH_DOT_DANH_GIA } = require("../middleware/actionDefault");

const svRouter = new Router();

// Xem danh sách đợt: mọi role đã đăng nhập (chọn đợt khi làm đánh giá, lọc báo cáo...)
svRouter.get("/get-list-dot-danh-gia", isAuthAdmin, Response(DotDanhGiaController.getListDotDanhGia));
svRouter.get("/get-dot-danh-gia/:id", isAuthAdmin, Response(DotDanhGiaController.getDotDanhGiaById));

// Tạo/sửa/xoá đợt: chỉ Admin (permission "Cấu hình tạo đợt đánh giá" theo map.jpg)
svRouter.post("/create-update-dot-danh-gia", check_permission(CAU_HINH_DOT_DANH_GIA), Response(DotDanhGiaController.createUpdateDotDanhGia));
svRouter.post("/delete-dot-danh-gia/:id", check_permission(CAU_HINH_DOT_DANH_GIA), Response(DotDanhGiaController.deleteDotDanhGia));

module.exports = svRouter;
