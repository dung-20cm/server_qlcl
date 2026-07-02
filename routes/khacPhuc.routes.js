const { KhacPhucController } = require("../controllers");
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { isAuthAdmin } = require("../middleware/auth");

const svRouter = new Router();

// Xem/tạo/cập nhật khắc phục: nhiều role cần dùng (Phòng QLCL xem tất cả khoa,
// Trưởng khoa/Nhân viên xem và xử lý khoa mình) - tạm thời chỉ yêu cầu đã
// đăng nhập, giống cách làm ở route đánh giá.
svRouter.get("/get-list-khac-phuc", isAuthAdmin, Response(KhacPhucController.getListKhacPhuc));
svRouter.get("/get-khac-phuc/:id", isAuthAdmin, Response(KhacPhucController.getKhacPhucById));
svRouter.post("/create-update-khac-phuc", isAuthAdmin, Response(KhacPhucController.createUpdateKhacPhuc));
svRouter.post("/delete-khac-phuc/:id", isAuthAdmin, Response(KhacPhucController.deleteKhacPhuc));

module.exports = svRouter;
