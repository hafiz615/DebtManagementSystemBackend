"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCopier = void 0;
class DataCopier {
    static copy(target, source) {
        let response = {};
        response = { ...target };
        let keys = Object.keys(target);
        for (let key of keys) {
            if (target[key]) {
                if (target[key].constructor === Array) {
                    if (source[key] != undefined) {
                        response[key] = [];
                        for (let item of source[key]) {
                            response[key].push(item);
                        }
                    }
                }
                else if (typeof target[key] === 'object') {
                    if (source[key] != undefined) {
                        response[key] = source[key];
                    }
                }
                else {
                    if (source[key] != undefined) {
                        response[key] = source[key];
                    }
                }
            }
            else {
                if (source[key] != undefined) {
                    response[key] = source[key];
                }
            }
        }
        return response;
    }
}
exports.DataCopier = DataCopier;
//# sourceMappingURL=dataCopier.util.js.map