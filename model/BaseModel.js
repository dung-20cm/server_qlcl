const { Model } = require("sequelize");
/**
 * Wrapper class Model of sequelize
 *
 * @export
 * @class BaseModel
 * @extends {Model}
 */
class BaseModel extends Model {
  /**
   * Creates an instance of BaseModel.
   * @param {any} args
   * @memberof BaseModel
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * Init model
   *
   * @static
   * @param {Object} attributes
   * @param {Object} options
   * @returns
   * @memberof BaseModel
   */
  static init(attributes, options) {
    return super.init(attributes, {
      ...options,
      hooks: {
        ...options.hooks,
      },
    });
  }

  /**
   * Overide findOne method
   *
   * @static
   * @param {any} options
   * @returns
   * @memberof BaseModel
   */
  static findOne(options) {
    return super.findOne(options);
  }

  static findByIdAndUpdate(id, data) {
    return super.update(data, {
      where: { id },
    });
  }

  /**
   * Overide findAll method
   *
   * @static
   * @param {any} options
   * @returns
   * @memberof BaseModel
   */
  static findAll(options) {
    return super.findAll(options);
  }

  /**
   * Overide update method
   *
   * @static
   * @param {any} values
   * @param {any} options
   * @returns
   * @memberof BaseModel
   */
  static update(values, options) {
    return super.update(values, { individualHooks: true, ...options });
  }

  /**
   * Overide destroy method
   *
   * @static
   * @param {any} options
   * @returns
   * @memberof BaseModel
   */
  static destroy(options) {
    return super.destroy({ individualHooks: true, ...options });
  }

  /**
   * Init associations
   *
   * @static
   * @memberof BaseModel
   */
  static association() {}

  static setObject(value) {
    if (!value) return "";
    return JSON.stringify(value);
  }

  static parseObject(value) {
    try {
      if (value) {
        return JSON.parse(value);
      }
      return {};
    } catch (error) {
      return {};
    }
  }

  static setArr(value) {
    if (!value) return "";
    return JSON.stringify(value);
  }

  static parseArr(value) {
    try {
      if (value) {
        return JSON.parse(value);
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Function clear cache
   *
   * @memberof BaseModel
   */
  clearCache() {}
}

module.exports = BaseModel;
