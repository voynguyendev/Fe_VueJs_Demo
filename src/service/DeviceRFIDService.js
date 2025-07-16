import instanceConnectDeviceRFID from './AxiosInstanceRFID';
import { deviceRFIDApi } from './api';

export const DeviceRFIDService = {
    async getusbinformations() {
        return await instanceConnectDeviceRFID.get(deviceRFIDApi.getusbinformations(), {});
    },
    async connectdeviceusb(params) {
        return await instanceConnectDeviceRFID.post(deviceRFIDApi.connectdeviceusb(), params);
    },
    async writetagrfiddecimal(params) {
        return await instanceConnectDeviceRFID.post(deviceRFIDApi.writetagrfiddecimal(), params);
    },
    async writetagrfiddecimal(params) {
        return await instanceConnectDeviceRFID.post(deviceRFIDApi.writetagrfiddecimal(), params);
    },
    async startstopreadtagRFID(params) {
        return await instanceConnectDeviceRFID.post(deviceRFIDApi.startstopreadtagRFID(), params);
    },
    async readtagrfid() {
        return await instanceConnectDeviceRFID.post(deviceRFIDApi.readtagrfid(), {});
    }
};
