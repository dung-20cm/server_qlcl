const { Op } = require("sequelize");
const { ERROR_MESSAGE } = require("../config/error");
const { VitriChiTiet, Khoa, VitriType } = require("../model");

const getListVitriChiTiet = async (data) => {
    let where = { active: 1 };
    if (data.khoa_id) {
        where.khoa_id = data.khoa_id;
    }
    if (data.vitri_type_id) {
        where.vitri_type_id = data.vitri_type_id;
    }
    if (data.ma_vitri && data.ma_vitri != '') {
        where.ma_vitri = { [Op.like]: `%${data.ma_vitri}%` };
    }
    if (data.active === 'all') {
        delete where.active;
    }

    const res = await VitriChiTiet.findAll({
        where: { ...where },
        order: [['khoa_id', 'asc'], ['vitri_type_id', 'asc'], ['ma_vitri', 'asc']],
        include: [
            { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
            { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] },
        ]
    })

    const total = await VitriChiTiet.count({ where: { ...where } })

    return { rows: res, total }
}

const getVitriChiTietById = async (id) => {
    const data = await VitriChiTiet.findOne({
        where: { id: id },
        include: [
            { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
            { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] },
        ]
    })

    if (!data) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_VITRI_CHI_TIET)
    }

    return data
}

const createUpdateVitriChiTiet = async (data) => {
    if (data.id) {
        const check = await VitriChiTiet.findOne({ where: { id: data.id } })

        if (!check) {
            throw new Error(ERROR_MESSAGE.NOT_FOUND_VITRI_CHI_TIET)
        }

        const khoa_id = data.khoa_id || check.khoa_id;
        const vitri_type_id = data.vitri_type_id || check.vitri_type_id;
        const ma_vitri = data.ma_vitri || check.ma_vitri;

        const check_trung = await VitriChiTiet.findOne({
            where: {
                id: { [Op.ne]: data.id },
                khoa_id,
                vitri_type_id,
                ma_vitri,
            }
        })

        if (check_trung) {
            throw new Error(ERROR_MESSAGE.VITRI_CHI_TIET_EXISTS)
        }

        const update = await check.update({ ...data })
        return update
    } else {
        const check_trung = await VitriChiTiet.findOne({
            where: {
                khoa_id: data.khoa_id,
                vitri_type_id: data.vitri_type_id,
                ma_vitri: data.ma_vitri,
            }
        })

        if (check_trung) {
            throw new Error(ERROR_MESSAGE.VITRI_CHI_TIET_EXISTS)
        }

        const create = await VitriChiTiet.create({ ...data, active: 1 })
        return create
    }
}

// Xoá mềm: chỉ ẩn (active=0), giữ dữ liệu lịch sử của các đánh giá đã dùng vị trí này
const deleteVitriChiTiet = async (id) => {
    const check = await VitriChiTiet.findOne({ where: { id: id } })

    if (!check) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_VITRI_CHI_TIET)
    }

    const del = await check.update({ active: 0 })
    return del
}

module.exports = {
    getListVitriChiTiet,
    getVitriChiTietById,
    createUpdateVitriChiTiet,
    deleteVitriChiTiet
}
