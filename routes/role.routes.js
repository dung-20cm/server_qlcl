const { RoleController } = require("../controllers")
const { Router } = require("express");
const { Response } = require("../config/handle_response");
const { check_permission } = require("../middleware/auth");
const { PHAN_QUYEN_TAI_KHOAN } = require("../middleware/actionDefault");

const svRouter = new Router();

svRouter.get("/get-list-role", check_permission(PHAN_QUYEN_TAI_KHOAN), Response(RoleController.getListRole))

svRouter.get("/get-role/:id", check_permission(PHAN_QUYEN_TAI_KHOAN), Response(RoleController.getRoleById))

svRouter.post("/create-update-role", check_permission(PHAN_QUYEN_TAI_KHOAN), Response(RoleController.createUpdateRole))

svRouter.post("/delete-role/:id", check_permission(PHAN_QUYEN_TAI_KHOAN), Response(RoleController.deleteRole))

svRouter.post("/add-role-permission", check_permission(PHAN_QUYEN_TAI_KHOAN), Response(RoleController.addRolePermission))

module.exports = svRouter
