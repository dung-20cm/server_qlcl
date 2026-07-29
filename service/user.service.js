const asyncHandler = require("express-async-handler");
const { User, UserRole, Role, Khoa } = require("../model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const _CONF = require("../config/auth.config");
const {
  checkPassword,
  hashPassWord,
  generateToken,
} = require("../middleware/auth");
const { Paging } = require("../config/paging");
const { Op } = require("sequelize");
const { ERROR_MESSAGE } = require("../config/error");
const excelJS = require("exceljs");
const { getListPermissionByRoleId } = require("./permission.service");
require("dotenv").config();

const register = asyncHandler(async (req, res) => {
  const { username, email, password, khoa_id } = req.body;
  if (!username || !password) {
    res.status(400);
    throw new Error("Username và password là bắt buộc!");
  }

  //check user tồn tại qua trường username vì username là duy nhất (dùng để login)
  const userAvailable = await User.findOne({
    where: {
      username: username,
    },
  });
  if (userAvailable) {
    res.status(400);
    throw new Error("Username đã tồn tại!");
  }

  //register: Tạo User ms
  //hashPassword
  const hashPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    username: username,
    email: email || null,
    khoa_id: khoa_id || null,
    password: hashPassword,
    status: 1,
  });

  return {
    message: "Register successfully!",
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      khoa_id: user.khoa_id,
    },
  };
});

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400);
    throw new Error("All feilds are mandatory");
  }

  const user = await User.findOne({
    where: {
      username: username,
      del: 0,
    },
    attributes: {
      exclude: ["del", "createdAt", "updatedAt"],
    },
    include: [
      {
        model: UserRole,
        as: "user_role",
        required: false,
        attributes: {
          exclude: ["createdAt", "updatedAt", "del"],
        },
        include: [
          {
            model: Role,
            as: "role",
            required: false,
            attributes: {
              exclude: ["createdAt", "updatedAt", "del"],
            },
          },
        ],
      },
      {
        model: Khoa,
        as: "khoa",
        required: false,
        attributes: ["id", "ten_khoa", "nhom"],
      },
    ],
  });

  if (!user) {
    throw new Error(ERROR_MESSAGE.NOT_FOUND_ACCOUNT);
  }

  if (user.status === 0) {
    throw new Error(ERROR_MESSAGE.NOT_ACTIVE_ACCOUNT);
  }

  ////compare password vs hashPassWord
  //so sánh pass ng dung nhập vs hashPass trong db
  if (user && (await bcrypt.compare(password, user.password))) {
    //jwt gồm :<base64-encoded header>.<base64-encoded payload>.<base64-encoded signature>

    //jwt.sign(payload, secretOrPrivateKey, [options, callback])
    const accessToken = jwt.sign(
      {
        //truyền vào payload
        userid: user.id,
        // user: {
        //   username: user.username,
        //   email: user.email,
        //   id: user.id,
        // },
      },
      _CONF.SECRET,
      { expiresIn: _CONF.tokenLife }, //token sẽ hết hạn
    );
    const refreshToken = jwt.sign(
      {
        //truyền vào payload
        userid: user.id,
        // user: {
        //   username: user.username,
        //   email: user.email,
        //   id: user.id,
        // },
      },
      _CONF.SECRET_REFRESH,
      { expiresIn: _CONF.refreshTokenLife },
    );

    const check_role = await UserRole.findOne({
      where: {
        user_id: user.id,
      },
    });

    const role = check_role
      ? await Role.findOne({ where: { id: check_role.role_id } })
      : null;

    const list_permission = check_role
      ? await getListPermissionByRoleId(check_role.role_id)
      : [];

    return {
      token: accessToken,
      refreshToken: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        status: user.status,
        avatar: user.avatar,
        khoa_id: user.khoa_id,
        khoa: user.khoa,
      },
      // Guard: user chưa được gán role thì trả role=null thay vì crash (role.name của null)
      role: role
        ? {
            role: role.name,
            slug: role.slug,
            list_permission: list_permission,
          }
        : { role: null, slug: null, list_permission: [] },
    };
  } else {
    res.status(400);
    throw new Error("Tên đăng nhập hoặc mật khẩu không chính xác!");
  }
});

const getProfile = asyncHandler(async (userid) => {
  const accExist = await User.findOne({
    where: {
      id: userid,
      del: 0,
    },
    include: [
      {
        model: Khoa,
        as: "khoa",
        required: false,
        attributes: ["id", "ten_khoa", "nhom"],
      },
    ],
  });

  if (!accExist) {
    throw new Error("Token invalid!");
  }

  const check_role = await UserRole.findOne({
    where: {
      user_id: accExist.id,
    },
  });

  const list_permission = check_role
    ? await getListPermissionByRoleId(check_role.role_id)
    : [];

  return {
    user: {
      id: accExist.id,
      username: accExist.username,
      email: accExist.email,
      mobile: accExist.mobile,
      address: accExist.address,
      status: accExist.status,
      avatar: accExist.avatar,
      khoa_id: accExist.khoa_id,
      khoa: accExist.khoa,
    },
    list_permission: list_permission,
    token: await generateToken({ userid: accExist.id }),
  };
});

const updateProfile = asyncHandler(async (data) => {
  const accExist = await User.findOne({
    where: {
      id: data.id,
      del: 0,
    },
  });

  if (!accExist) {
    throw new Error("User not found!");
  } else {
    await accExist.update({
      email: data.email,
      username: data.username,
    });
  }

  return accExist;
});

const changePassword = asyncHandler(async (data) => {
  const existAccount = await User.findOne({
    where: {
      id: data.id,
      del: 0,
    },
  });

  if (!existAccount) {
    throw new Error("Token invalid!");
  } else {
    const isValidOld = await checkPassword(
      data.old_password,
      existAccount.password,
    );
    if (!isValidOld) {
      throw new Error("Sai mật khẩu hiện tại.");
    }
    const isValidPass = await checkPassword(
      data.new_password,
      existAccount.password,
    );
    if (isValidPass) {
      throw new Error("Mật khẩu mới phải khác mật khẩu cũ.");
    } else {
      await existAccount.update({
        password: hashPassWord(data.new_password),
      });
    }
  }

  const token = await generateToken({
    id: existAccount.id,
    check: true,
    password: existAccount.password.substring(42),
  });

  return { token };
});

const getListUser = asyncHandler(async (req, authUser) => {
  // Chỉ phân trang khi client CHỦ ĐỘNG truyền cả page và limit (giống pattern các
  // endpoint khác, vd getListDanhGia) — trước đây gọi Paging() vô điều kiện, hàm
  // này mặc định limit=10 khi thiếu tham số, khiến danh mục "toàn bộ user" (dùng
  // làm catalog chọn người phụ trách ở nhiều trang) bị cắt còn 10 người bất kể
  // tổng số tài khoản thật là bao nhiêu.
  const paging = req.page && req.limit ? Paging(req.page, req.limit) : {};
  let where = {
    del: 0,
  };

  if (req.name && req.name !== "") {
    where.username = {
      [Op.like]: `%${req.name}%`,
    };
  }

  if (req.email && req.email !== "") {
    where.email = {
      [Op.like]: `%${req.email}%`,
    };
  }

  // Trưởng khoa (chỉ có quyền TAO_TAI_KHOAN_NHAN_VIEN, không full scope) chỉ
  // thấy tài khoản của khoa/phòng mình. Admin (TAO_TAI_KHOAN, full scope) thấy tất cả.
  if (authUser && !authUser.isFullScope) {
    where.khoa_id = authUser.khoa_id;
  }

  const users = await User.findAll({
    where: {
      ...where,
    },
    attributes: {
      exclude: ["password", "del", "createdAt", "updatedAt"],
    },
    include: [
      {
        model: UserRole,
        as: "user_role",
        required: false,
        attributes: ["user_id", "role_id"],
        where: {
          del: 0,
        },
        include: [
          {
            model: Role,
            as: "role",
            required: false,
            attributes: ["id", "name", "slug"],
            where: {
              del: 0,
            },
          },
        ],
      },
      {
        model: Khoa,
        as: "khoa",
        required: false,
        attributes: ["id", "ten_khoa", "nhom"],
      },
    ],
    ...paging,
    order: [["createdAt", "desc"]],
  });

  const total = await User.count({
    where: {
      ...where,
    },
  });

  return {
    rows: users,
    total: total,
  };
});

// Trưởng khoa (không full scope) không được tự gán role admin/phong-qlcl/lanhdao cho ai
// -- lanhdao (chỉ xem toàn viện) chỉ Admin mới được cấp, tương tự admin/phong-qlcl.
const assertRoleAllowedForScopedManager = async (roleId, authUser) => {
  if (!authUser || authUser.isFullScope || !roleId) return;
  const role = await Role.findOne({ where: { id: roleId, del: 0 } });
  if (role && ["admin", "phong-qlcl", "lanhdao"].includes(role.slug)) {
    throw new Error(ERROR_MESSAGE.FORBIDDEN);
  }
};

const updateUser = async (data, authUser) => {
  if (data.id) {
    const check = await User.findOne({
      where: {
        id: data.id,
        del: 0,
      },
    });

    if (!check) {
      throw new Error("User not found!");
    }

    // Trưởng khoa (không full scope) chỉ được sửa tài khoản của khoa mình, không
    // được chuyển tài khoản sang khoa khác, không được gán role admin/phong-qlcl.
    if (authUser && !authUser.isFullScope) {
      if (Number(check.khoa_id) !== Number(authUser.khoa_id)) {
        throw new Error(ERROR_MESSAGE.FORBIDDEN);
      }
      if (data.khoa_id && Number(data.khoa_id) !== Number(authUser.khoa_id)) {
        throw new Error(ERROR_MESSAGE.FORBIDDEN);
      }
      await assertRoleAllowedForScopedManager(data.role_id, authUser);
    }

    const checkUsername = await User.findOne({
      where: {
        id: {
          [Op.ne]: data.id,
        },
        username: data.username,
        del: 0,
      },
    });

    if (checkUsername) {
      throw new Error("Username đã tồn tại!");
    }

    if (data.password && data.password != "") {
      data.password = hashPassWord(data.password);
    }

    const update = await check.update({ ...data });

    const check_role = await UserRole.findOne({
      where: {
        user_id: check.id,
      },
    });

    if (!check_role) {
      await UserRole.create({
        user_id: check.id,
        role_id: data.role_id,
        del: 0,
      });
    } else {
      await check_role.update({
        user_id: check.id,
        role_id: data.role_id,
      });
    }
    return update;
  } else {
    // Trưởng khoa (không full scope) chỉ được tạo tài khoản cho khoa mình,
    // không được gán role admin/phong-qlcl.
    if (authUser && !authUser.isFullScope) {
      if (data.khoa_id && Number(data.khoa_id) !== Number(authUser.khoa_id)) {
        throw new Error(ERROR_MESSAGE.FORBIDDEN);
      }
      data.khoa_id = authUser.khoa_id; // ép luôn về khoa của người tạo, đề phòng bỏ trống
      await assertRoleAllowedForScopedManager(data.role_id, authUser);
    }

    const accExist = await User.findOne({
      where: {
        username: data.username,
        del: 0,
      },
    });

    if (accExist) {
      throw new Error("Username đã tồn tại!");
    }

    const create = await User.create({
      ...data,
      password: hashPassWord(data.password),
      status: 1,
      del: 0,
    });

    await UserRole.create({
      user_id: create.id,
      role_id: data.role_id,
      del: 0,
    });

    return create;
  }
};

const deleteUser = async (id, authUser) => {
  const check = await User.findOne({
    where: {
      id: id,
      del: 0,
    },
  });

  if (!check) {
    throw new Error(ERROR_MESSAGE.DATA_NOT_FOUND);
  }

  // Trưởng khoa (không full scope) chỉ được xoá tài khoản của khoa mình.
  if (authUser && !authUser.isFullScope && Number(check.khoa_id) !== Number(authUser.khoa_id)) {
    throw new Error(ERROR_MESSAGE.FORBIDDEN);
  }

  return check.update({ del: 1 });
};

const exportListUser = async (req, res) => {
  try {
    let where = {
      del: 0,
    };

    if (req.name && req.name !== "") {
      where.username = {
        [Op.like]: `%${req.name}%`,
      };
    }

    if (req.email && req.email !== "") {
      where.email = {
        [Op.like]: `%${req.email}%`,
      };
    }

    const users = await User.findAll({
      where: {
        ...where,
      },
      attributes: {
        exclude: ["password", "del", "createdAt", "updatedAt"],
      },
      include: [
        {
          model: UserRole,
          as: "user_role",
          required: false,
          attributes: ["user_id", "role_id"],
          where: {
            del: 0,
          },
          include: [
            {
              model: Role,
              as: "role",
              required: false,
              attributes: ["id", "name", "slug"],
              where: {
                del: 0,
              },
            },
          ],
        },
      ],
      order: [["createdAt", "desc"]],
    });

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");
    const name_file = "users";
    // tạo một sheet nơi các đường lưới bị ẩn
    // worksheet.views = [{
    //   showGridLines: false
    // }]

    //thêm cột
    worksheet.columns = [
      {
        header: "STT",
        key: "stt",
        width: 10,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
      {
        header: "Tên người dùng",
        key: "username",
        width: 30,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
      {
        header: "Vai trò",
        key: "role",
        width: 30,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
      {
        header: "Email",
        key: "email",
        width: 30,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
      {
        header: "Số điện thoại",
        key: "mobile",
        width: 30,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
      {
        header: "Địa chỉ",
        key: "address",
        width: 30,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
      {
        header: "Trạng thái",
        key: "status",
        width: 20,
        style: { alignment: { horizontal: "center", vertical: "middle" } },
      },
    ];

    // đọc dữ liệu
    let length = 1;
    users.map((user, index) => {
      worksheet.addRow({
        stt: index + 1,
        username: user.username ? user.username : "",
        role: user.user_role ? user.user_role.role.name : "",
        email: user.email ? user.email : "",
        mobile: user.mobile
          ? user.mobile.replace(user.mobile.charAt(0), "+84")
          : "",
        address: user.address ? user.address : "",
        status: user.status == 1 ? "Hoạt động" : "Không hoạt động",
      });
      length += 1;
    });

    worksheet.insertRow(1, {});
    worksheet.insertRow(1, {});
    worksheet.insertRow(1, {});
    worksheet.insertRow(1, {});
    worksheet.mergeCells(1, 1, 1, worksheet.columns.length);
    worksheet.mergeCells(2, 1, 2, worksheet.columns.length);
    worksheet.mergeCells(3, 1, 3, worksheet.columns.length);
    worksheet.mergeCells(4, 1, 4, worksheet.columns.length);

    //designn header file
    worksheet.getCell("A1").value =
      "HỆ THỐNG QUẢN LÝ CHẤT LƯỢNG 5S - BỆNH VIỆN";
    worksheet.getCell("A1").font = {
      size: 14,
      bold: true,
      color: { argb: "FF0000" },
    };
    worksheet.getCell("A1").alignment = {
      horizontal: "left",
      vertical: "middle",
    };

    worksheet.getCell("A2").value = "BẢNG QUẢN LÝ NGƯỜI DÙNG";
    worksheet.getCell("A2").font = {
      size: 18,
      bold: true,
    };
    worksheet.getCell("A2").alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    worksheet.getCell("A3").value = "Từ trước đến nay";
    worksheet.getCell("A3").font = {
      size: 11,
      bold: true,
      color: { argb: "FF0000" },
    };
    worksheet.getCell("A3").alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    worksheet.getRow(5).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin", color: { argb: "00000000" } },
        left: { style: "thin", color: { argb: "00000000" } },
        bottom: { style: "thin", color: { argb: "00000000" } },
        right: { style: "thin", color: { argb: "00000000" } },
      };
    });

    users.map((user, index) => {
      worksheet.getRow(6 + index).eachCell((cell) => {
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin", color: { argb: "00000000" } },
          left: { style: "thin", color: { argb: "00000000" } },
          bottom: { style: "thin", color: { argb: "00000000" } },
          right: { style: "thin", color: { argb: "00000000" } },
        };
      });
    });

    const rows = worksheet.getRows(5, length);
    rows.map((row, i) => {
      worksheet.getRow(5 + i).height = 20;
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${name_file}.xlsx`,
    );

    return workbook.xlsx.write(res).then(() => {
      res.status(200);
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getListUser,
  updateUser,
  deleteUser,
  exportListUser,
};
