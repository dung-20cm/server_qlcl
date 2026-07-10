const { KhacPhucController } = require("../controllers");
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { check_permission, isAuthAdmin } = require("../middleware/auth");
const { XEM_TIEN_DO_KHAC_PHUC_TAT_CA_KHOA, QUAN_LY_KHAC_PHUC_KHOA_MINH } = require("../middleware/actionDefault");

const svRouter = new Router();

// Xem: cả 4 role xem được (Phòng QLCL/Admin xem tất cả khoa, Trưởng
// khoa/Nhân viên chỉ xem khoa mình) - lọc theo khoa ở service.
svRouter.get("/get-list-khac-phuc", isAuthAdmin, Response(KhacPhucController.getListKhacPhuc));
svRouter.get("/get-khac-phuc/:id", isAuthAdmin, Response(KhacPhucController.getKhacPhucById));

// Tạo/sửa/xoá: Phòng QLCL (tất cả khoa), Trưởng khoa (khoa mình) - Nhân viên chỉ được xem.
svRouter.post("/create-update-khac-phuc", check_permission([XEM_TIEN_DO_KHAC_PHUC_TAT_CA_KHOA, QUAN_LY_KHAC_PHUC_KHOA_MINH]), Response(KhacPhucController.createUpdateKhacPhuc));
svRouter.post("/delete-khac-phuc/:id", check_permission([XEM_TIEN_DO_KHAC_PHUC_TAT_CA_KHOA, QUAN_LY_KHAC_PHUC_KHOA_MINH]), Response(KhacPhucController.deleteKhacPhuc));

module.exports = svRouter;
