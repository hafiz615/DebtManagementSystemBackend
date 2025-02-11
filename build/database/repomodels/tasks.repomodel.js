"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tasks = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Tasks {
    constructor() {
        this.dueDate = '';
        this.caseId = '';
        this.assignee = '';
        this.assigneeId = '';
        this.title = '';
        this.status = 'To do';
        this.notes = '';
        this.isDeleted = false;
        this.isCompleted = false;
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Tasks = Tasks;
//# sourceMappingURL=tasks.repomodel.js.map