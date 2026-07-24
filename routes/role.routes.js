const { RoleController } = require("../controllers")
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { check_permission } = require("../middleware/auth");
const { PHAN_QUYEN_TAI_KHOAN, TAO_TAI_KHOAN, TAO_TAI_KHOAN_NHAN_VIEN } = require("../middleware/actionDefault");

const svRouter = new Router();

// Danh sách role (id/tên/slug) chỉ để hiển thị select "Quyền" khi tạo/sửa tài
// khoản -- Trưởng khoa (TAO_TAI_KHOAN_NHAN_VIEN) cũng cần đọc được, không chỉ
// Admin (PHAN_QUYEN_TAI_KHOAN, quyền cấu hình permission cho từng role).
svRouter.get("/get-list-role", check_permission([PHAN_QUYEN_TAI_KHOAN, TAO_TAI_KHOAN, TAO_TAI_KHOAN_NHAN_VIEN]), Response(RoleController.getListRole))

svRouter.get("/get-role/:id", check_permission(PHAN_QUYEN_TAI_KHOAN), Response(RoleController.getRoleById))

svRouter.post("/create-update-role", check_permission(PHAN_QUYEN_TAI_KHOAN), Response(RoleController.createUpdateRole))

svRouter.post("/delete-role/:id", check_permission(PHAN_QUYEN_TAI_KHOAN), Response(RoleController.deleteRole))

svRouter.post("/add-role-permission", check_permission(PHAN_QUYEN_TAI_KHOAN), Response(RoleController.addRolePermission))

module.exports = svRouter
