import {
  AggregateOptions,
  PipelineStage,
  PopulateOptions,
  ProjectionType,
  QueryOptions,
} from 'mongoose';
import {FilterQuery} from 'mongoose';

export interface IBaseRepository<D> {
  getAll<T>(
    filter?: FilterQuery<T>,
    projectField?: string | ProjectionType<T>,
    select?: string,
    sort?: QueryOptions<T>,
    populate?: PopulateOptions | (PopulateOptions | string)[],
    lean?: boolean,
    page?: number,
    limit?: number
  ): Promise<T[] | []>;
  getAllWithoutPagination<T>(
    filter?: FilterQuery<T>,
    projectField?: string | ProjectionType<T>,
    select?: string,
    sort?: QueryOptions<T>,
    populate?: PopulateOptions | (PopulateOptions | string)[],
    lean?: boolean,
    page?: number,
    limit?: number
  ): Promise<T[] | []>;
  getOne<T>(
    filter?: FilterQuery<T>,
    projectField?: string | ProjectionType<T>,
    select?: string,
    populate?: PopulateOptions | (PopulateOptions | string)[],
    lean?: boolean
  ): Promise<T | null>;
  getById<T>(
    id: string,
    projectField?: string | ProjectionType<T>,
    select?: string,
    populate?: PopulateOptions | (PopulateOptions | string)[],
    lean?: boolean
  ): Promise<T | null>;
  create<T>(entity: D): Promise<T>;
  updateById<T>(id: string, updateQuery: QueryOptions<T>): Promise<T | null>;
  updateByOne<T>(
    filter: FilterQuery<T>,
    updateQuery: QueryOptions<T>
  ): Promise<T | null>;
  upsert<T>(
    filter: FilterQuery<T>,
    updateQuery: QueryOptions<T>
  ): Promise<T | null>;
  delete<T>(filter?: FilterQuery<T>): Promise<boolean>;
  deleteMany<T>(filter?: FilterQuery<T>): Promise<boolean>;
  getCount<T>(filter?: FilterQuery<T>): Promise<number>;
  applyAggregate<T>(
    aggregate?: PipelineStage[],
    options?: AggregateOptions
  ): Promise<T>;
  findAll<T>(filter?: FilterQuery<T>): Promise<T[] | []>;
}
