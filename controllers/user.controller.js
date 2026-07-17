const { userServices } = require("../service");

const login = async (req, res) => {
  return userServices.login(req, res);
};

const register = async (req, res) => {
  return userServices.register(req, res);
};

const getProfile = async (req, res) => {
  const { userid } = req.userToken;
  return userServices.getProfile(userid);
};
const updateProfile = async (req, res) => {
  const { data } = req.body
  return userServices.updateProfile(data);
};

const changePassword = async (req, res) => {
  const { data } = req.body
  // Luôn lấy id từ token đã xác thực (req.authUser), KHÔNG tin id do client gửi lên,
  // để tài khoản A không thể đổi mật khẩu tài khoản B dù có đoán đúng mật khẩu cũ của B.
  return userServices.changePassword({ ...data, id: req.authUser.id });
}

const getListUser = async (req, res) => {
  return userServices.getListUser(req.query, req.authUser);
}

const updateUser = async (req, res) => {
  return userServices.updateUser(req.body, req.authUser);
}

const deleteUser = async (req, res) => {
  const { id } = req.query;
  return userServices.deleteUser(id, req.authUser);
};

const exportListUser = async (req, res) => {
  return userServices.exportListUser(req, res);
}

module.exports = {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
  getListUser,
  updateUser,
  deleteUser,
  exportListUser
};
