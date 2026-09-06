import type {
  Attributes,
  CountOptions,
  CreateOptions,
  CreationAttributes,
  FindOptions,
  InstanceDestroyOptions,
  InstanceUpdateOptions,
  Model,
  ModelStatic,
} from 'sequelize';
export class BaseRepository<M extends Model> {
  constructor(protected readonly model: ModelStatic<M>) {}
  findAll(options: FindOptions<Attributes<M>> = {}) {
    return this.model.findAll(options);
  }
  findById(id: number) {
    return this.model.findByPk(id);
  }
  findOne(options: FindOptions<Attributes<M>> = {}) {
    return this.model.findOne(options);
  }
  create(data: CreationAttributes<M>, options: CreateOptions<Attributes<M>> = {}) {
    return this.model.create(data, options);
  }
  updateInstance(
    instance: M,
    data: Partial<Attributes<M>>,
    options: InstanceUpdateOptions<Attributes<M>> = {}
  ) {
    return instance.update(data, options);
  }
  async deleteInstance(instance: M, options: InstanceDestroyOptions = {}) {
    await instance.destroy(options);
    return true;
  }
  count(options: Omit<CountOptions<Attributes<M>>, 'group'> = {}) {
    return this.model.count(options);
  }
}
