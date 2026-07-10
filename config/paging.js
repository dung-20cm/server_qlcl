const Paging = (page, limit) => {
  let paging = {};
  limit = parseInt(limit) || 10;
  page = parseInt(page) || 1;

  if (page && limit) {
    paging.offset = limit * (page - 1);
  }
  if (limit) {
    paging.limit = limit;
  }
  return paging;
};

module.exports = {
  Paging,
};
