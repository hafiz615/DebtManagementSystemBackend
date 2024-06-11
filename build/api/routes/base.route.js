"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_routes_1 = __importDefault(require("./user.routes"));
const case_routes_1 = __importDefault(require("./case.routes"));
const upload_routes_1 = __importDefault(require("./upload.routes"));
const debtor_routes_1 = __importDefault(require("./debtor.routes"));
const creditor_routes_1 = __importDefault(require("./creditor.routes"));
const payment_routes_1 = __importDefault(require("./payment.routes"));
const settings_routes_1 = __importDefault(require("./settings.routes"));
const enum_routes_1 = __importDefault(require("./enum.routes"));
function setup(app) {
    app.use('/api/v1/user', user_routes_1.default);
    app.use('/api/v1/case', case_routes_1.default);
    app.use('/api/v1/upload', upload_routes_1.default);
    app.use('/api/v1/debtor', debtor_routes_1.default);
    app.use('/api/v1/creditor', creditor_routes_1.default);
    app.use('/api/v1/payment', payment_routes_1.default);
    app.use('/api/v1/settings', settings_routes_1.default);
    app.use('/api/v1/enum', enum_routes_1.default);
}
exports.default = setup;
//# sourceMappingURL=base.route.js.map