const { VitriChiTietController } = require("../controllers");
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { check_permission, isAuthAdmin } = require("../middleware/auth");
const { CAU_HINH_PHONG_KHOA_KIEM_TRA } = require("../middleware/actionDefault");

const svRouter = new Router();

// Xem danh sách vị trí chi tiết: mọi role đã đăng nhập cần (chọn vị trí cụ thể
// khi làm đánh giá), chỉ cần có token hợp lệ.
svRouter.get("/get-list-vitri-chi-tiet", isAuthAdmin, Response(VitriChiTietController.getListVitriChiTiet));
svRouter.get("/get-vitri-chi-tiet/:id", isAuthAdmin, Response(VitriChiTietController.getVitriChiTietById));

// Thêm/sửa/xoá vị trí chi tiết: chỉ Admin (permission "Cấu hình phòng khoa nào cần kiểm tra phần nào")
svRouter.post("/create-update-vitri-chi-tiet", check_permission(CAU_HINH_PHONG_KHOA_KIEM_TRA), Response(VitriChiTietController.createUpdateVitriChiTiet));
svRouter.post("/delete-vitri-chi-tiet/:id", check_permission(CAU_HINH_PHONG_KHOA_KIEM_TRA), Response(VitriChiTietController.deleteVitriChiTiet));

module.exports = svRouter;
