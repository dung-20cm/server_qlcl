const { DanhGiaController } = require("../controllers");
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { isAuthAdmin } = require("../middleware/auth");

const svRouter = new Router();

// Làm đánh giá là chức năng của nhiều role (Nhân viên, Phòng QLCL...) theo
// map.jpg (LAM_DANH_GIA, DANH_GIA_CAC_KHOA). Vì check_permission hiện chỉ
// kiểm tra được 1 slug/route, tạm thời chỉ yêu cầu đã đăng nhập (isAuthAdmin)
// cho các route này thay vì giới hạn permission cụ thể.
svRouter.get("/get-list-danh-gia", isAuthAdmin, Response(DanhGiaController.getListDanhGia));
svRouter.get("/get-danh-gia/:id", isAuthAdmin, Response(DanhGiaController.getDanhGiaById));
svRouter.post("/create-danh-gia", isAuthAdmin, Response(DanhGiaController.createDanhGia));
svRouter.post("/delete-danh-gia/:id", isAuthAdmin, Response(DanhGiaController.deleteDanhGia));

module.exports = svRouter;
