const { Op } = require("sequelize");
const { ERROR_MESSAGE } = require("../config/error");
const { Paging } = require("../config/paging");
const { Permission, Role, RolePermission } = require("../model");

const getListRole = async (data) => {
    const paging = Paging(data.page, data.limit);
    let where = { del: 0 };
    if (data.name && data.name != '') {
        where = {
            ...where,
            name: {
                [Op.like]: `%${data.name}%`
            }
        }
    }

    const res = await Role.findAll({
        where: {
            ...where
        },
        ...paging,
        order: [['createdAt', 'desc']],
        attributes: {
            exclude: ["updatedAt", "del"],
        },
        include: [
            {
                model: RolePermission,
                as: "role_permission",
                attributes: ["id"],
                include: [
                    {
                        model: Permission,
                        as: "permission",
                        attributes: ["id", "name", "slug"],
                        required: false,
                        where: {
                            del: 0
                        }
                    }
                ]
            }
        ],
    })

    const total = await Role.count({
        where: {
            ...where
        }
    })

    return {
        rows: res,
        total
    }
}

const getRoleById = async (id) => {
    const data = await Role.findOne({
        where: {
            id: id,
            del: 0
        },
        include: [
            {
                model: RolePermission,
                as: "role_permission",
                attributes: ["id"],
                include: [
                    {
                        model: Permission,
                        as: "permission",
                        attributes: ["id", "name", "slug"],
                        required: true,
                        where: {
                            del: 0
                        }
                    }
                ]
            }
        ]
    })

    return data
}

const createUpdateRole = async (data) => {
    if (data.id) {
        const check = await Role.findOne({
            where: {
                id: data.id,
                del: 0
            }
        })

        const check_slug = await Role.findOne({
            where: {
                id: {
                    [Op.ne]: data.id
                },
                slug: data.slug,
                del: 0
            }
        })

        if (!check) {
            throw new Error(ERROR_MESSAGE.NOT_FOUND_ROLE)
        }

        if (check_slug) {
            throw new Error(ERROR_MESSAGE.ROLE_EXISTS)
        }
        const update = await check.update({ ...data })
        return update
    } else {
        const create = await Role.create({ ...data, del: 0 })
        return create
    }
}

const deleteRole = async (id) => {
    const check = await Role.findOne({
        where: {
            id: id,
            del: 0
        }
    })
    if (!check) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_ROLE)
    }

    const del = await check.update({ del: 1 })
    await RolePermission.destroy({
        where: {
            role_id: check.id
        }
    })

    return del
}

const addRolePermission = async (role_id, list_permission) => {
    const result = []
    await RolePermission.destroy({
        where: {
            role_id: role_id
        }
    })

    for (const item of list_permission) {
        result.push(await RolePermission.create({
            role_id: role_id,
            permission_id: item
        }))
    }

    return result
}

module.exports = {
    getListRole,
    getRoleById,
    createUpdateRole,
    deleteRole,
    addRolePermission
}

