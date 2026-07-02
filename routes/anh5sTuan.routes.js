const { Anh5sTuanController } = require("../controllers");
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { isAuthAdmin } = require("../middleware/auth");

const svRouter = new Router();

// Ảnh 5S theo tuần: Khoa tự nộp báo cáo hàng tuần, Phòng QLCL xem/duyệt toàn
// viện - chỉ yêu cầu đã đăng nhập, giống cách làm ở route đánh giá/khắc phục.
svRouter.get("/get-list-anh-5s-tuan", isAuthAdmin, Response(Anh5sTuanController.getListAnh5sTuan));
svRouter.get("/get-anh-5s-tuan/:id", isAuthAdmin, Response(Anh5sTuanController.getAnh5sTuanById));
svRouter.post("/create-update-anh-5s-tuan", isAuthAdmin, Response(Anh5sTuanController.createUpdateAnh5sTuan));
svRouter.post("/delete-anh-5s-tuan/:id", isAuthAdmin, Response(Anh5sTuanController.deleteAnh5sTuan));

module.exports = svRouter;
