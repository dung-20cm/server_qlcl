const { Op } = require("sequelize");
const { ERROR_MESSAGE } = require("../config/error");
const { VitriType } = require("../model");

const getListVitriType = async (data) => {
    let where = { active: 1 };
    if (data.ten_vitri && data.ten_vitri != '') {
        where = {
            ...where,
            ten_vitri: {
                [Op.like]: `%${data.ten_vitri}%`
            }
        }
    }
    if (data.active === 'all') {
        delete where.active;
    }

    const res = await VitriType.findAll({
        where: { ...where },
        order: [['thu_tu', 'asc']],
    })

    const total = await VitriType.count({ where: { ...where } })

    return {
        rows: res,
        total
    }
}

const getVitriTypeById = async (id) => {
    const data = await VitriType.findOne({ where: { id: id } })

    if (!data) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_VITRI_TYPE)
    }

    return data
}

const createUpdateVitriType = async (data) => {
    if (data.id) {
        const check = await VitriType.findOne({ where: { id: data.id } })

        if (!check) {
            throw new Error(ERROR_MESSAGE.NOT_FOUND_VITRI_TYPE)
        }

        const check_ten = await VitriType.findOne({
            where: {
                id: { [Op.ne]: data.id },
                ten_vitri: data.ten_vitri
            }
        })

        if (check_ten) {
            throw new Error(ERROR_MESSAGE.VITRI_TYPE_EXISTS)
        }

        const update = await check.update({ ...data })
        return update
    } else {
        const check_ten = await VitriType.findOne({ where: { ten_vitri: data.ten_vitri } })

        if (check_ten) {
            throw new Error(ERROR_MESSAGE.VITRI_TYPE_EXISTS)
        }

        const create = await VitriType.create({ ...data, active: 1 })
        return create
    }
}

// Xoá mềm: chỉ ẩn (active=0), giữ lại dữ liệu lịch sử đã tham chiếu vitri_type_id
const deleteVitriType = async (id) => {
    const check = await VitriType.findOne({ where: { id: id } })

    if (!check) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_VITRI_TYPE)
    }

    const del = await check.update({ active: 0 })
    return del
}

module.exports = {
    getListVitriType,
    getVitriTypeById,
    createUpdateVitriType,
    deleteVitriType
}
