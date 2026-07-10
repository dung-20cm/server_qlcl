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
  return userServices.changePassword(data);
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
