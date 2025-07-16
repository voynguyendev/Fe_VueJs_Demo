import axios from 'axios';
const baseURL = import.meta.env.VITE_API_BASE_URL;

const baseConnectDeviceRFIDURL = import.meta.env.VITE_API_BASE_URL_DEVICE_RFID;

const instanceConnectDeviceRFID = axios.create({
    baseConnectDeviceRFIDURL,
    withCredentials: false,
    headers: {
        'Content-Type': 'application/json'
    }
});

instanceConnectDeviceRFID.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        if (error.response && error.response.data?.errors && error.response.status === 400) {
            error.message = error.response.data.errors.generalErrors.join(',');
            return Promise.reject(error);
        }
        return Promise.reject(error);
    }
);

export default instanceConnectDeviceRFID;
