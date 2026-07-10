const { Op } = require("sequelize");
const { DotDanhGia } = require("../model");

const getListDotDanhGia = async (data) => {
    let where = { active: 1 };

    if (data.trang_thai && data.trang_thai !== '') {
        where.trang_thai = data.trang_thai;
    }
    if (data.ten_dot && data.ten_dot !== '') {
        where.ten_dot = { [Op.like]: `%${data.ten_dot}%` };
    }
    if (data.active === 'all') {
        delete where.active;
    }

    const res = await DotDanhGia.findAll({
        where: { ...where },
        // đợt mới nhất lên trước (theo ngày bắt đầu, rồi id)
        order: [['tu_ngay', 'desc'], ['id', 'desc']],
    })

    const total = await DotDanhGia.count({ where: { ...where } })

    return { rows: res, total }
}

const getDotDanhGiaById = async (id) => {
    const data = await DotDanhGia.findOne({ where: { id: id } })

    if (!data) {
        throw new Error("Không tìm thấy đợt đánh giá!")
    }

    return data
}

const createUpdateDotDanhGia = async (data) => {
    if (data.tu_ngay && data.den_ngay && data.tu_ngay > data.den_ngay) {
        throw new Error("Ngày bắt đầu không được sau ngày kết thúc!")
    }

    if (data.id) {
        const check = await DotDanhGia.findOne({ where: { id: data.id } })

        if (!check) {
            throw new Error("Không tìm thấy đợt đánh giá!")
        }

        if (data.ten_dot) {
            const check_ten = await DotDanhGia.findOne({
                where: {
                    id: { [Op.ne]: data.id },
                    ten_dot: data.ten_dot,
                }
            })
            if (check_ten) {
                throw new Error("Tên đợt đánh giá đã tồn tại!")
            }
        }

        const update = await check.update({ ...data })
        return update
    } else {
        if (!data.ten_dot || data.ten_dot === '') {
            throw new Error("Vui lòng nhập tên đợt đánh giá!")
        }

        const check_ten = await DotDanhGia.findOne({ where: { ten_dot: data.ten_dot } })

        if (check_ten) {
            // Đợt trùng tên nhưng đã bị xoá mềm (active=0) => kích hoạt lại
            if (check_ten.active === 0) {
                const reactivate = await check_ten.update({ ...data, active: 1 })
                return reactivate
            }
            throw new Error("Tên đợt đánh giá đã tồn tại!")
        }

        const create = await DotDanhGia.create({ ...data, active: 1 })
        return create
    }
}

// Xoá mềm (active=0): giữ lịch sử các lượt đánh giá đã gắn với đợt này
const deleteDotDanhGia = async (id) => {
    const check = await DotDanhGia.findOne({ where: { id: id } })

    if (!check) {
        throw new Error("Không tìm thấy đợt đánh giá!")
    }

    const del = await check.update({ active: 0 })
    return del
}

module.exports = {
    getListDotDanhGia,
    getDotDanhGiaById,
    createUpdateDotDanhGia,
    deleteDotDanhGia,
}
