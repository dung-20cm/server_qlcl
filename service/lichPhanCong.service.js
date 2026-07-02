const { ERROR_MESSAGE } = require("../config/error");
const { LichPhanCong, Khoa, VitriType, User } = require("../model");

const getListLichPhanCong = async (data) => {
    let where = { active: 1 };
    if (data.khoa_id) where.khoa_id = data.khoa_id;
    if (data.vitri_type_id) where.vitri_type_id = data.vitri_type_id;
    if (data.nguoi_thuc_hien_id) where.nguoi_thuc_hien_id = data.nguoi_thuc_hien_id;
    if (data.loai_lich) where.loai_lich = data.loai_lich;
    if (data.active === 'all') delete where.active;

    const res = await LichPhanCong.findAll({
        where: { ...where },
        order: [['id', 'desc']],
        include: [
            { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
            { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] },
            { model: User, as: 'nguoi_thuc_hien', attributes: ['id', 'username', 'email'] },
        ]
    })

    const total = await LichPhanCong.count({ where: { ...where } })

    return { rows: res, total }
}

const getLichPhanCongById = async (id) => {
    const data = await LichPhanCong.findOne({
        where: { id },
        include: [
            { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
            { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] },
            { model: User, as: 'nguoi_thuc_hien', attributes: ['id', 'username', 'email'] },
        ]
    })

    if (!data) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_LICH_PHAN_CONG)
    }

    return data
}

const createUpdateLichPhanCong = async (data) => {
    if (data.loai_lich === 'dinh_ky') {
        data.ngay_thuc_hien = null;
    } else if (data.loai_lich === 'mot_lan') {
        data.thu_trong_tuan = null;
    }

    if (data.id) {
        const check = await LichPhanCong.findOne({ where: { id: data.id } })

        if (!check) {
            throw new Error(ERROR_MESSAGE.NOT_FOUND_LICH_PHAN_CONG)
        }

        const update = await check.update({ ...data })
        return update
    } else {
        const create = await LichPhanCong.create({ ...data, active: 1 })
        return create
    }
}

// Xoá mềm
const deleteLichPhanCong = async (id) => {
    const check = await LichPhanCong.findOne({ where: { id } })

    if (!check) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_LICH_PHAN_CONG)
    }

    const del = await check.update({ active: 0 })
    return del
}

module.exports = {
    getListLichPhanCong,
    getLichPhanCongById,
    createUpdateLichPhanCong,
    deleteLichPhanCong
}
