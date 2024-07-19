"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksRepository = void 0;
const tasks_model_1 = require("../../../database/models/tasks.model");
const base_repository_1 = require("../base.repository");
class TasksRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(tasks_model_1.Tasks);
    }
}
exports.TasksRepository = TasksRepository;
//# sourceMappingURL=tasks.repository.js.map