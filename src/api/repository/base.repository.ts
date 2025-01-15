import {
  AggregateOptions,
  FilterQuery,
  Model,
  PipelineStage,
  PopulateOptions,
  ProjectionType,
  QueryOptions,
} from 'mongoose';
import {IBaseRepository} from './base.repository.interface';

export abstract class BaseRepository<D> implements IBaseRepository<D> {
  public readonly model: Model<D>;

  constructor(model: Model<D>) {
    this.model = model;
  }

  async getAll<T>(
    filter?: FilterQuery<T>,
    projectField?: string | ProjectionType<T>,
    select?: string,
    sort?: QueryOptions<T>,
    populate?: PopulateOptions | (PopulateOptions | string)[],
    lean?: boolean,
    page?: number,
    limit?: number
  ): Promise<T[] | []> {
    let result = this.model.find(filter || {}, projectField || '');
    select && result.select(select);
    sort && result.sort(sort);
    populate && result.populate(populate);
    if (page && limit) {
      const skip = (page - 1) * limit;
      result.skip(skip).limit(limit);
    }

    lean && result.lean(lean);
    return ((await result.exec()) as T[]) || [];
  }

  async getAllWithoutPagination<T>(
    filter?: FilterQuery<T>,
    projectField?: string | ProjectionType<T>,
    select?: string,
    sort?: QueryOptions<T>,
    populate?: PopulateOptions | (PopulateOptions | string)[],
    lean?: boolean,
    page?: number,
    limit?: number
  ): Promise<T[] | []> {
    let result = this.model.find(filter || {}, projectField || '');
    select && result.select(select);
    sort && result.sort(sort);
    populate && result.populate(populate);
    if (page && limit) {
      const skip = (page - 1) * limit;
      result.skip(skip).limit(limit);
    }
    lean && result.lean(lean);
    return ((await result.exec()) as T[]) || [];
  }
  async getOne<T>(
    filter?: FilterQuery<T>,
    projectField?: string | ProjectionType<T>,
    select?: string,
    populate?: PopulateOptions | (PopulateOptions | string)[],
    lean = true
  ): Promise<T | null> {
    const query = this.model.findOne(filter, projectField);
    select && query.select(select);
    populate && query.populate(populate);
    lean && query.lean();
    return ((await query.exec()) as T) || null;
  }

  async getById<T>(
    id: string,
    projectField?: string | ProjectionType<T>,
    select?: string,
    populate?: PopulateOptions | (PopulateOptions | string)[],
    lean = true
  ): Promise<T | null> {
    const query = this.model.findById(id, projectField || {});
    select && query.select(select);
    populate && query.populate(populate);
    lean && query.lean();
    return ((await query.exec()) as T) || null;
  }

  async create<T>(entity: D): Promise<T> {
    return new this.model(entity).save() as T;
  }

  async createMany<T>(entities: D[]): Promise<T[]> {
    const datasets = entities.map(entity => ({...entity}));
    return (await this.model.insertMany(datasets)) as T[];
  }

  async updateMany<T>(filter: FilterQuery<T>, updateQuery: QueryOptions<T>) {
    return await this.model.updateMany(filter, updateQuery, {
      new: true,
    });
  }

  async updateById<T>(
    id: string,
    updateQuery: QueryOptions<T>
  ): Promise<T | null> {
    return await this.model.findByIdAndUpdate({_id: id}, updateQuery, {
      new: true,
    });
  }

  async updateByOne<T>(
    filter: FilterQuery<T>,
    updateQuery: QueryOptions<T>
  ): Promise<T | null> {
    return await this.model.findOneAndUpdate(filter, updateQuery, {
      new: true,
    });
  }

  async upsert<T>(
    filter: FilterQuery<T>,
    updateQuery: QueryOptions<T>
  ): Promise<T | null> {
    return await this.model.findOneAndUpdate(filter, updateQuery, {
      new: true,
      upsert: true,
    });
  }

  async delete<T>(filter?: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.deleteOne(filter).exec();
    return result.deletedCount === 1 ? true : false;
  }

  async deleteMany<T>(filter?: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.deleteMany(filter).exec();
    return result.deletedCount > 1 ? true : false;
  }
  async getCount<T>(filter?: FilterQuery<T>): Promise<number> {
    return (await this.model.countDocuments(filter || {})) || 0;
  }

  async applyAggregate<T>(
    aggregate?: PipelineStage[],
    options?: AggregateOptions
  ): Promise<T> {
    const response = await this.model.aggregate(aggregate, options).exec();
    return response as T;
  }
  async findAll<T>(filter?: FilterQuery<T>): Promise<T[] | []> {
    return (await this.model.find(filter).exec()) as T[];
  }
}
