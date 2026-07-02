require("dotenv").config();
const jwt = require("jsonwebtoken");
const _CONF = require("../config/auth.config");
const bcrypt = require('bcryptjs');
const { ERROR_MESSAGE } = require("../config/error");
const { User, UserRole, RolePermission, Permission } = require('../model')

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

const check_permission = (action) => {
  if (!action) {
    action = '';
  }
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
      if (!action) {
        return res.send({
          signal: 0,
          code: 500,
          message: 'action!'
        });
      }

      let list_permission = await RolePermission.findAll({
        where: {
          role_id: check_role.role_id,
        },
        include: [{
          model: Permission,
          as: 'permission',
          where: {
            slug: action,
            del: 0
          }
        }]
      })

      if (!list_permission || list_permission.length <= 0) {
        return res.send({
          signal: 0,
          code: 400,
          message: 'Bạn không có quyền truy nhập!'
        })
      }

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
  isAuthAdmin

};
