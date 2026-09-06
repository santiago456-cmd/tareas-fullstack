export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findAll(options = {}) {
    return this.model.findAll(options);
  }

  async findById(id) {
    return this.model.findByPk(id);
  }

  async findOne(options = {}) {
    return this.model.findOne(options);
  }

  async create(data, options = {}) {
    return this.model.create(data, options);
  }

  async updateInstance(instance, data, options = {}) {
    return instance.update(data, options);
  }

  async deleteInstance(instance, options = {}) {
    await instance.destroy(options);
    return true;
  }

  async count(options = {}) {
    return this.model.count(options);
  }
}
