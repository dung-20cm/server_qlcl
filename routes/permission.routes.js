const { PermissionController } = require("../controllers")
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { check_permission } = require("../middleware/auth");
const { PHAN_QUYEN_TAI_KHOAN } = require("../middleware/actionDefault");

const svRouter = new Router();

svRouter.get("/get-list-permission", check_permission(PHAN_QUYEN_TAI_KHOAN), Response(PermissionController.getListPermissions))

svRouter.get("/get-permission/:id", check_permission(PHAN_QUYEN_TAI_KHOAN), Response(PermissionController.getPermissionById))

svRouter.post("/create-update-permission", check_permission(PHAN_QUYEN_TAI_KHOAN), Response(PermissionController.createUpdatePermission))

svRouter.post("/delete-permission/:id", check_permission(PHAN_QUYEN_TAI_KHOAN), Response(PermissionController.deletePermission))

svRouter.get("/get-list-permission-by-role/:role_id", check_permission(PHAN_QUYEN_TAI_KHOAN), Response(PermissionController.getListPermissionByRoleId))

module.exports = svRouter
