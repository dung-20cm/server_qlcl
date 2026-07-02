const { Op } = require("sequelize");
const { ERROR_MESSAGE } = require("../config/error");
const { Paging } = require("../config/paging");
const { Permission, RolePermission } = require("../model");

const getListPermissions = async (req) => {
    const paging = Paging(req.page, req.limit);
    let where = { del: 0 };
    if (req.name && req.name != '') {
        where = {
            ...where,
            name: {
                [Op.like]: `%${req.name}%`
            }
        }
    }

    const data = await Permission.findAll({
        where: {
            ...where
        },
        ...paging,
        order: [['createdAt', 'desc']],
        attributes: {
            exclude: ["createdAt", "updatedAt", "del"],
        },
    });

    const total = await Permission.count({
        where: {
            ...where
        }
    })

    return {
        rows: data,
        total
    }
}

const getPermissionById = async (id) => {
    const data = await Permission.findOne({
        where: {
            id: id,
            del: 0
        }
    })

    return data
}

const createUpdatePermission = async (data) => {
    if (data.id) {
        const check = await Permission.findOne({
            where: {
                id: data.id,
                del: 0
            }
        })
        const check_slug = await Permission.findOne({
            where: {
                id: {
                    [Op.ne]: data.id
                },
                slug: data.slug,
                del: 0
            }
        })

        if (!check) {
            throw new Error(ERROR_MESSAGE.NOT_FOUND_PERMISSION)
        }
        if (check_slug) {
            throw new Error(ERROR_MESSAGE.PERMISSION_EXISTS)
        }

        const update = await check.update({ ...data })
        return update
    } else {
        const create = await Permission.create({ ...data, del: 0 })
        return create
    }
}

const deletePermission = async (id) => {
    const check = await Permission.findOne({
        where: {
            id: id,
            del: 0
        }
    })

    if (!check) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_PERMISSION)
    }

    const del = await check.update({ del: 1 })
    await RolePermission.destroy({
        where: {
            permission_id: check.id
        }
    })

    return del
}

const getListPermissionByRoleId = async (role_id) => {
    let res = Permission.findAll({
        where: {
            del: 0
        },
        attributes: {
            exclude: ["createdAt", "updatedAt", "del"],
        },
        include: [{
            model: RolePermission,
            as: 'role_permission',
            required: true,
            where: {
                role_id: role_id
            },
            attributes: { exclude: ['createdAt', 'updatedAt', 'del'] }
        }]
    })

    return res
}

module.exports = {
    getListPermissions,
    getPermissionById,
    createUpdatePermission,
    deletePermission,
    getListPermissionByRoleId
}
