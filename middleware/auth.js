require("dotenv").config();
const jwt = require("jsonwebtoken");
const _CONF = require("../config/auth.config");
const bcrypt = require('bcryptjs');
const { ERROR_MESSAGE } = require("../config/error");
const { User, UserRole, RolePermission, Permission } = require('../model')
const { FULL_SCOPE_SLUGS } = require('../middleware/actionDefault')

// Lấy toàn bộ slug quyền (chưa bị thu hồi) của 1 role — dùng để gắn vào req.authUser
// và cho service layer tự quyết định phạm vi dữ liệu (khoa mình / tất cả khoa).
const getPermissionSlugsByRole = async (roleId) => {
  const rows = await RolePermission.findAll({
    where: { role_id: roleId, del: 0 },
    include: [{ model: Permission, as: 'permission', where: { del: 0 } }],
  })
  return rows.map((r) => r.permission.slug)
}

// "Full scope" = có ít nhất 1 slug trong FULL_SCOPE_SLUGS (Admin nắm mọi slug nên
// luôn full scope; Phòng QLCL nắm các slug "_TAT_CA_KHOA"/"DANH_GIA_CAC_KHOA"...).
// Dùng ở service layer: full scope -> trả về dữ liệu mọi khoa; ngược lại -> chỉ khoa của req.authUser.khoa_id.
const isFullScope = (permissions) => (permissions || []).some((s) => FULL_SCOPE_SLUGS.includes(s))

const checkToken = (req, res, next) => {
  const token = req.body.token || req.query.token || req.headers['token']
  //decode token
  if (token) {
    //verifies secret and checks exp
    jwt.verify(token, _CONF.SECRET, (err, decoded) => {
      if (err) {
        console.error(err.toString());
        return res.status(401).json({ "error": true, "message": "Unauthorized access", err });
      }
      req.decoded = decoded;
      next();
    })
  } else {
    return res.status(403).send({
      "error": true,
      "message": "No token provided!"
    });
  }
}

const hashPassWord = (password) => {
  if (!password) return '';

  return bcrypt.hashSync(password, 10);
}

const checkPassword = async (password, hashPass) => {
  if (!hashPass) {
    return false
  }

  return bcrypt.compare(password, hashPass);
}

const generateToken = async (data, secretKey = _CONF.SECRET, expiresIn = '30d') => {
  return jwt.sign(data, secretKey, { expiresIn });
}

// `action` có thể là 1 slug (string) hoặc mảng slug (OR - chỉ cần khớp 1 trong số đó)
const check_permission = (action) => {
  const actionList = (Array.isArray(action) ? action : [action]).filter(Boolean);
  return async (req, res, next) => {
    try {
      let { token } = req.headers;
      if (!token) {
        token = req.query.token || req.body.token;
      }

      if (!token) {
        return res.send({
          signal: 0,
          code: 401,
          errorCode: ERROR_MESSAGE.NOT_FOUND_TOKEN,
          message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.'
        })
      }

      const dataToken = await jwt.verify(token, _CONF.SECRET);

      if (!dataToken.userid) {
        return res.send({
          signal: 0,
          code: 402,
          errorCode: ERROR_MESSAGE.NOT_FOUND_USER_INFO,
          message: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại để tiếp tục.'
        })
      }

      const userData = await User.findOne({
        where: {
          id: dataToken.userid,
          del: 0
        }
      })

      if (!userData) {
        return res.send({
          signal: 0,
          code: 403,
          errorCode: ERROR_MESSAGE.NOT_FOUND_TOKEN,
          message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.'
        })
      }

      req.userToken = dataToken;
      let check_role = await UserRole.findOne({
        where: {
          user_id: dataToken.userid,
          del: 0
        }
      })

      if (!check_role) {
        return res.send({
          signal: 0,
          code: 400,
          message: 'Tài khoản chưa được phân vai trò!'
        });
      }
      if (actionList.length === 0) {
        return res.send({
          signal: 0,
          code: 500,
          message: 'action!'
        });
      }

      // Toàn bộ quyền (chưa bị thu hồi) của role này — dùng để check quyền + gắn vào req.authUser
      const permissions = await getPermissionSlugsByRole(check_role.role_id);

      const allowed = actionList.some((a) => permissions.includes(a));
      if (!allowed) {
        return res.send({
          signal: 0,
          code: 400,
          message: 'Bạn không có quyền truy nhập!'
        })
      }

      req.authUser = {
        id: userData.id,
        khoa_id: userData.khoa_id ?? null,
        roleId: check_role.role_id,
        permissions,
        isFullScope: isFullScope(permissions),
      };

      next();
    } catch (error) {
      console.log("Check permission error ====> ", error);
      return res.send({
        signal: 0,
        code: 401,
        errorCode: ERROR_MESSAGE.ERROR,
        message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục."
      })
    }
  }
}

// Chỉ yêu cầu đã đăng nhập (không đòi 1 permission cụ thể) — dùng cho các API
// xem chung mà nhiều role cùng dùng (xem lịch, xem đánh giá,...). Vẫn gắn
// req.authUser {khoa_id, permissions, isFullScope} để SERVICE LAYER tự lọc dữ
// liệu theo phạm vi khoa (không phải ai gọi API này cũng thấy được TẤT CẢ khoa).
const isAuthAdmin = async (req, res, next) => {
  try {
    let { token } = req.headers;
    if (!token) {
      token = req.query.token || req.body.token;
    }

    if (!token) {
      return res.send({
        signal: 0,
        code: 401,
        errorCode: ERROR_MESSAGE.NOT_FOUND_TOKEN,
        message: 'Phiên đăng nhập đã hết hạn. Vui bạn đăng nhập lại để tiếp tục.'
      })
    }
    const dataToken = await jwt.verify(token, _CONF.SECRET);
    // console.log("dataToken ====> ", dataToken);
    if (!dataToken.userid) {
      return res.send({
        signal: 0,
        code: 402,
        errorCode: ERROR_MESSAGE.NOT_FOUND_USER_INFO,
        message: 'Không tìm thấy thông tin người dùng. Vui này đăng nhập lại để tiếp tục.'
      })
    }

    const userData = await User.findOne({
      where: {
        id: dataToken.userid,
        del: 0
      }
    })

    if (!userData) {
      return res.send({
        signal: 0,
        code: 403,
        errorCode: ERROR_MESSAGE.NOT_FOUND_TOKEN,
        message: 'Phiên đăng nhập không hết hạn. Vui bạn đăng nhập để tiếp tục.'
      })
    }

    req.userToken = dataToken;

    // Gắn khoa_id + danh sách quyền hiện có (nếu đã được phân vai trò) để service dùng để lọc theo khoa
    let permissions = [];
    const check_role = await UserRole.findOne({ where: { user_id: dataToken.userid, del: 0 } });
    if (check_role) {
      permissions = await getPermissionSlugsByRole(check_role.role_id);
    }
    req.authUser = {
      id: userData.id,
      khoa_id: userData.khoa_id ?? null,
      roleId: check_role ? check_role.role_id : null,
      permissions,
      isFullScope: isFullScope(permissions),
    };

    next()
  } catch (error) {
    console.log("IsAuthAdmin Error ====> ", error);
    return res.send({
      signal: 0,
      code: 405,
      errorCode: ERROR_MESSAGE.ERROR,
      message: 'Phiên đăng nhập kết thúc. Vui lòng đăng nhập lại để tiếp tục.'
    })
  }
}


module.exports = {
  checkToken,
  hashPassWord,
  checkPassword,
  generateToken,
  check_permission,
  isAuthAdmin,
  getPermissionSlugsByRole,
  isFullScope,
};
