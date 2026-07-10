const { KhoaController } = require("../controllers");
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { check_permission, isAuthAdmin } = require("../middleware/auth");
const { CAU_HINH_PHONG_KHOA_KIEM_TRA } = require("../middleware/actionDefault");

const svRouter = new Router();

// Xem danh sách khoa: mọi role đã đăng nhập đều cần (chọn khoa khi đánh giá,
// phân công lịch, xem báo cáo...), nên chỉ yêu cầu đã đăng nhập (isAuthAdmin =
// có token hợp lệ), không giới hạn theo permission cụ thể.
svRouter.get("/get-list-khoa", isAuthAdmin, Response(KhoaController.getListKhoa));
svRouter.get("/get-khoa/:id", isAuthAdmin, Response(KhoaController.getKhoaById));

// Thêm/sửa/xoá khoa: chỉ Admin (permission "Cấu hình phòng khoa nào cần kiểm tra phần nào")
svRouter.post("/create-update-khoa", check_permission(CAU_HINH_PHONG_KHOA_KIEM_TRA), Response(KhoaController.createUpdateKhoa));
svRouter.post("/delete-khoa/:id", check_permission(CAU_HINH_PHONG_KHOA_KIEM_TRA), Response(KhoaController.deleteKhoa));

module.exports = svRouter;
