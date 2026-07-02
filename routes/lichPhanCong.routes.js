const { LichPhanCongController } = require("../controllers");
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { isAuthAdmin } = require("../middleware/auth");

const svRouter = new Router();

// Lịch phân công: nhiều role cần dùng (Trưởng khoa phân công người đánh giá,
// nhân viên xem lịch của mình, Phòng QLCL xem toàn viện) - chỉ yêu cầu đã
// đăng nhập, giống cách làm ở route đánh giá/khắc phục.
svRouter.get("/get-list-lich-phan-cong", isAuthAdmin, Response(LichPhanCongController.getListLichPhanCong));
svRouter.get("/get-lich-phan-cong/:id", isAuthAdmin, Response(LichPhanCongController.getLichPhanCongById));
svRouter.post("/create-update-lich-phan-cong", isAuthAdmin, Response(LichPhanCongController.createUpdateLichPhanCong));
svRouter.post("/delete-lich-phan-cong/:id", isAuthAdmin, Response(LichPhanCongController.deleteLichPhanCong));

module.exports = svRouter;
