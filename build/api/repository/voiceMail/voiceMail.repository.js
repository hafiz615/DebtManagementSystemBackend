"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceMailRepository = void 0;
const base_repository_1 = require("../base.repository");
const voiceMail_model_1 = require("../../../database/models/voiceMail.model");
class VoiceMailRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(voiceMail_model_1.VoiceMail);
    }
}
exports.VoiceMailRepository = VoiceMailRepository;
//# sourceMappingURL=voiceMail.repository.js.map