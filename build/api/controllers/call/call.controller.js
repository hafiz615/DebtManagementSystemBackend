"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../../utils/responseHelper.util"));
// import CaseService from '../../services/case.service';
const call_service_1 = __importDefault(require("../../services/call.service"));
class CallController {
    constructor() {
        this.callTwiml = async (req, res) => {
            try {
                const response = await this.callService.callTwiml(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                res.type('text/xml');
                return res.status(constants_util_1.default.CODE.OK).send(response[1]);
            }
            catch (error) {
                console.log('error', error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.updateCall = async (req, res) => {
            try {
                const response = await this.callService.updateCall(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: response[1],
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.updateConferenceParticipant = async (req, res) => {
            try {
                const response = await this.callService.updateConferenceParticipant(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: response[1],
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.callSummary = async (req, res) => {
            try {
                const response = await this.callService.callSummary(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Summary for this call'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.callFallBack = async (req, res) => {
            try {
                const response = await this.callService.callFallback(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                res.type('text/xml');
                return res.status(constants_util_1.default.CODE.OK).send(response[1]);
            }
            catch (error) {
                console.log('error', error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.callRecordingStatus = async (req, res) => {
            try {
                const response = await this.callService.callRecordingStatus(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.NO_CONTENT)
                        .send(responseHelper_util_1.default.get4xxResponse(response));
                }
                return res.status(constants_util_1.default.CODE.CREATED).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.CREATED,
                    data: response[1],
                    message: constants_util_1.default.successUpdateMessage('Call Recording'),
                }));
            }
            catch (error) {
                console.log('error', error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.conferenceStartEvent = async (req, res) => {
            try {
                const response = await this.callService.conferenceStartEvent(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response));
                }
                return res.status(constants_util_1.default.CODE.CREATED).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.CREATED,
                    data: response[1],
                    message: constants_util_1.default.successUpdateMessage('Call Sid'),
                }));
            }
            catch (error) {
                console.log('error', error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.conferenceRecordingStatus = async (req, res) => {
            try {
                const response = await this.callService.conferenceRecordingStatus(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.NO_CONTENT)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.CREATED).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.CREATED,
                    data: response[1],
                    message: response[1],
                }));
            }
            catch (error) {
                console.log('error', error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.addParticipant = async (req, res) => {
            try {
                const response = await this.callService.addParticipant(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.CREATED).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.CREATED,
                    data: response[1],
                    message: response[1],
                }));
            }
            catch (error) {
                console.log('error', error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.getCalls = async (req, res) => {
            try {
                const response = await this.callService.getCalls(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.OK)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('All Calls for this Case'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.getAllTheParticipants = async (req, res) => {
            try {
                const response = await this.callService.getAllTheParticipants(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.OK)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Particpants'),
                }));
            }
            catch (error) {
                console.log('error', error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.callStatus = async (req, res) => {
            try {
                const response = await this.callService.callStatus(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response));
                }
                return res.status(constants_util_1.default.CODE.CREATED).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.CREATED,
                    data: response[1],
                    message: constants_util_1.default.callMadesuccessMessage('Call'),
                }));
            }
            catch (error) {
                console.log('error', error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.getToken = async (req, res) => {
            try {
                const response = await this.callService.getToken(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Token'),
                }));
            }
            catch (error) {
                console.log('error', error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.getIncomingCallSid = async (req, res) => {
            try {
                const response = await this.callService.getIncomingCallSid(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Parent Call Sid'),
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.callerName = async (req, res) => {
            try {
                const response = await this.callService.callerName(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.OK)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Caller name'),
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.getMissedCalls = async (req, res) => {
            try {
                const response = await this.callService.getMissedCalls(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.OK)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Missed Calls'),
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.voiceMail = async (req, res) => {
            try {
                const response = await this.callService.voiceMail(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                res.type('text/xml');
                return res.status(constants_util_1.default.CODE.OK).send(response[1]);
            }
            catch (error) {
                console.log('error voice mail', error.message);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.getVoiceMails = async (req, res) => {
            try {
                const response = await this.callService.getVoiceMails(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.OK)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('All Voice Mails'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.voiceMailRecording = async (req, res) => {
            const VoiceResponse = require('twilio').twiml.VoiceResponse;
            let twiml = new VoiceResponse();
            try {
                const response = await this.callService.voiceMailRecording(req);
                if (!response[0]) {
                    twiml.say('We encountered an issue saving your voicemail. Please try again later.');
                    res.type('text/xml');
                    return res.status(200).send(twiml.toString());
                }
                res.type('text/xml');
                return res.status(200).send(response[1]);
            }
            catch (error) {
                console.log('Error in voiceMailRecording:', error.message);
                twiml.say('We encountered an error. Please try again later.');
                res.type('text/xml');
                return res.status(200).send(twiml.toString());
            }
        };
        this.voiceMailRecordingStatus = async (req, res) => {
            try {
                const response = await this.callService.voiceMailRecordingStatus(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response));
                }
                res.type('text/xml');
                return res.status(constants_util_1.default.CODE.CREATED).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.CREATED,
                    data: response[1],
                    message: constants_util_1.default.successUpdateMessage('Cases'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.deleteCall = async (req, res) => {
            try {
                const response = await this.callService.deleteCall(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: response[1],
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.removeParticipant = async (req, res) => {
            try {
                const response = await this.callService.removeParticipant(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: response[1],
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.completeConference = async (req, res) => {
            try {
                const response = await this.callService.completeConference(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.OK)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: response[1],
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.OK)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.getAllUserNumbers = async (req, res) => {
            try {
                const response = await this.callService.getAllUserNumbers();
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.OK)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('All User Twilio Numbers'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.telnyxCallStatus = async (req, res) => {
            try {
                const response = await this.callService.telnyxCallStatus(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response));
                }
                return res.status(constants_util_1.default.CODE.CREATED).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.CREATED,
                    data: response[1],
                    message: constants_util_1.default.callMadesuccessMessage('Call'),
                }));
            }
            catch (error) {
                // console.log('error', error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.telnyxCallFallBack = async (req, res) => {
            try {
                const response = await this.callService.telnyxCallFallback(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(response[1]);
            }
            catch (error) {
                console.log('error', error.response.data.errors);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.telnyxToken = async (req, res) => {
            try {
                const response = await this.callService.telnyxToken(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response));
                }
                return res.status(constants_util_1.default.CODE.CREATED).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.CREATED,
                    data: response[1],
                    message: constants_util_1.default.successCreatedMessage('Token'),
                }));
            }
            catch (error) {
                console.log('error', error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.telnyxEvents = async (req, res) => {
            try {
                const response = await this.callService.telnyxEvents(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(response[1]);
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.telnyxPhoneNo = async (req, res) => {
            try {
                const response = await this.callService.telnyxPhoneNo(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Phone No'),
                }));
            }
            catch (error) {
                console.log('error', error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.callService = new call_service_1.default();
    }
}
exports.default = new CallController();
//# sourceMappingURL=call.controller.js.map