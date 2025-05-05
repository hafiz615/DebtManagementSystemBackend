// utils/axiosLogger.ts
import axios from 'axios';
import Log from '../database/models/logs.model';
import {InternalAxiosRequestConfig} from 'axios';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: Date;
    logEntry?: any; // Adjust the type of logEntry based on your Log model
  };
}

const axiosInstance = axios.create();

axiosInstance.interceptors.request.use(
  async (config: CustomAxiosRequestConfig) => {
    const {url, method, data, params} = config;
    const userId = (config.headers as any).userId; // Assuming userId is passed in headers

    config.metadata = {startTime: new Date()};
    const logEntry = new Log({
      url,
      method,
      requestPayload: data || params,
      responsePayload: null,
      responseStatus: null,
      userId,
      timeTaken: null,
      calledAt: new Date(),
    });

    config.metadata.logEntry = logEntry;

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  async response => {
    const config = response.config as CustomAxiosRequestConfig;
    const {data, status} = response;
    const endTime = new Date();
    const timeTaken =
      endTime.getTime() - (config.metadata?.startTime?.getTime() || 0);

    const logEntry = config.metadata?.logEntry;
    if (logEntry) {
      logEntry.responsePayload = data;
      logEntry.responseStatus = status;
      logEntry.timeTaken = timeTaken;

      await logEntry.save();
    }

    return response;
  },
  async error => {
    const config = error.config as CustomAxiosRequestConfig;
    if (config && config.metadata?.logEntry) {
      const endTime = new Date();
      const timeTaken =
        endTime.getTime() - (config.metadata.startTime?.getTime() || 0);

      const logEntry = config.metadata.logEntry;
      logEntry.responsePayload = error.response?.data;
      logEntry.responseStatus = error.response?.status;
      logEntry.timeTaken = timeTaken;

      await logEntry.save();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
