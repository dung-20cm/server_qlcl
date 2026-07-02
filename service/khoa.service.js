const { Op } = require("sequelize");
const { ERROR_MESSAGE } = require("../config/error");
const { Paging } = require("../config/paging");
const { Khoa } = require("../model");

const getListKhoa = async (data) => {
    let where = { active: 1 };
    if (data.ten_khoa && data.ten_khoa != '') {
        where = {
            ...where,
            ten_khoa: {
                [Op.like]: `%${data.ten_khoa}%`
            }
        }
    }
    if (data.nhom && data.nhom != '') {
        where = {
            ...where,
            nhom: data.nhom
        }
    }
    // Cho phép lấy cả khoa đã ẩn (active=0) khi cần quản lý, ví dụ ?active=all
    if (data.active === 'all') {
        delete where.active;
    }

    const paging = data.page && data.limit ? Paging(data.page, data.limit) : {};

    const res = await Khoa.findAll({
        where: { ...where },
        ...paging,
        order: [['nhom', 'asc'], ['ten_khoa', 'asc']],
    })

    const total = await Khoa.count({ where: { ...where } })

    return {
        rows: res,
        total
    }
}

const getKhoaById = async (id) => {
    const data = await Khoa.findOne({
        where: { id: id }
    })

    if (!data) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_KHOA)
    }

    return data
}

const createUpdateKhoa = async (data) => {
    if (data.id) {
        const check = await Khoa.findOne({
            where: { id: data.id }
        })

        if (!check) {
            throw new Error(ERROR_MESSAGE.NOT_FOUND_KHOA)
        }

        const check_ten = await Khoa.findOne({
            where: {
                id: { [Op.ne]: data.id },
                ten_khoa: data.ten_khoa
            }
        })

        if (check_ten) {
            throw new Error(ERROR_MESSAGE.KHOA_EXISTS)
        }

        const update = await check.update({ ...data })
        return update
    } else {
        const check_ten = await Khoa.findOne({
            where: { ten_khoa: data.ten_khoa }
        })

        if (check_ten) {
            throw new Error(ERROR_MESSAGE.KHOA_EXISTS)
        }

        const create = await Khoa.create({ ...data, active: 1 })
        return create
    }
}

// Xoá mềm: chỉ ẩn (active=0) để không phá vỡ dữ liệu lịch sử đã tham chiếu khoa_id
// ở các bảng đánh giá/khắc phục/lịch phân công.
const deleteKhoa = async (id) => {
    const check = await Khoa.findOne({
        where: { id: id }
    })

    if (!check) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_KHOA)
    }

    const del = await check.update({ active: 0 })
    return del
}

module.exports = {
    getListKhoa,
    getKhoaById,
    createUpdateKhoa,
    deleteKhoa
}
