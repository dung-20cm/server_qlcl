const { LichPhanCongController } = require("../controllers");
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { check_permission, isAuthAdmin } = require("../middleware/auth");
const { PHAN_CONG_DANH_GIA } = require("../middleware/actionDefault");

const svRouter = new Router();

// Xem lịch: cả 4 role đã đăng nhập đều xem được (Trưởng khoa xem lịch khoa mình,
// nhân viên xem lịch của mình, Phòng QLCL/Admin xem toàn viện) - chỉ yêu cầu đã
// đăng nhập, giống cách làm ở route đánh giá/khắc phục.
svRouter.get("/get-list-lich-phan-cong", isAuthAdmin, Response(LichPhanCongController.getListLichPhanCong));
svRouter.get("/get-lich-phan-cong/:id", isAuthAdmin, Response(LichPhanCongController.getLichPhanCongById));

// Tạo/sửa/xoá lịch: chỉ role có quyền "phân công đánh giá" (Admin, Phòng QLCL,
// Trưởng khoa theo seedRolePermission.js) - Nhân viên chỉ được xem.
svRouter.post("/create-update-lich-phan-cong", check_permission(PHAN_CONG_DANH_GIA), Response(LichPhanCongController.createUpdateLichPhanCong));
svRouter.post("/delete-lich-phan-cong/:id", check_permission(PHAN_CONG_DANH_GIA), Response(LichPhanCongController.deleteLichPhanCong));

module.exports = svRouter;
