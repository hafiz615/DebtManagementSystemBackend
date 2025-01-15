"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    constructor(model) {
        this.model = model;
    }
    async getAll(filter, projectField, select, sort, populate, lean, page, limit) {
        let result = this.model.find(filter || {}, projectField || '');
        select && result.select(select);
        sort && result.sort(sort);
        populate && result.populate(populate);
        if (page && limit) {
            const skip = (page - 1) * limit;
            result.skip(skip).limit(limit);
        }
        lean && result.lean(lean);
        return (await result.exec()) || [];
    }
    async getAllWithoutPagination(filter, projectField, select, sort, populate, lean, page, limit) {
        let result = this.model.find(filter || {}, projectField || '');
        select && result.select(select);
        sort && result.sort(sort);
        populate && result.populate(populate);
        if (page && limit) {
            const skip = (page - 1) * limit;
            result.skip(skip).limit(limit);
        }
        lean && result.lean(lean);
        return (await result.exec()) || [];
    }
    async getOne(filter, projectField, select, populate, lean = true) {
        const query = this.model.findOne(filter, projectField);
        select && query.select(select);
        populate && query.populate(populate);
        lean && query.lean();
        return (await query.exec()) || null;
    }
    async getById(id, projectField, select, populate, lean = true) {
        const query = this.model.findById(id, projectField || {});
        select && query.select(select);
        populate && query.populate(populate);
        lean && query.lean();
        return (await query.exec()) || null;
    }
    async create(entity) {
        return new this.model(entity).save();
    }
    async createMany(entities) {
        const datasets = entities.map(entity => ({ ...entity }));
        return (await this.model.insertMany(datasets));
    }
    async updateMany(filter, updateQuery) {
        return await this.model.updateMany(filter, updateQuery, {
            new: true,
        });
    }
    async updateById(id, updateQuery) {
        return await this.model.findByIdAndUpdate({ _id: id }, updateQuery, {
            new: true,
        });
    }
    async updateByOne(filter, updateQuery) {
        return await this.model.findOneAndUpdate(filter, updateQuery, {
            new: true,
        });
    }
    async upsert(filter, updateQuery) {
        return await this.model.findOneAndUpdate(filter, updateQuery, {
            new: true,
            upsert: true,
        });
    }
    async delete(filter) {
        const result = await this.model.deleteOne(filter).exec();
        return result.deletedCount === 1 ? true : false;
    }
    async deleteMany(filter) {
        const result = await this.model.deleteMany(filter).exec();
        return result.deletedCount > 1 ? true : false;
    }
    async getCount(filter) {
        return (await this.model.countDocuments(filter || {})) || 0;
    }
    async applyAggregate(aggregate, options) {
        const response = await this.model.aggregate(aggregate, options).exec();
        return response;
    }
    async findAll(filter) {
        return (await this.model.find(filter).exec());
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=base.repository.js.map