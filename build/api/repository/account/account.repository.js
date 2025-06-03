"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountRepository = void 0;
const account_model_1 = require("../../../database/models/account.model");
const base_repository_1 = require("../base.repository");
class AccountRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(account_model_1.Account);
    }
}
exports.AccountRepository = AccountRepository;
//# sourceMappingURL=account.repository.js.map