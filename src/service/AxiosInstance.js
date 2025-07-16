import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { useGlobalStore } from '../stores/global';
const baseURL = import.meta.env.VITE_API_BASE_URL;

const instance = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

instance.interceptors.request.use(
    function (config) {
        const globalStore = useGlobalStore();
        // spinning start to show
        // UPDATE: Add this code to show global loading indicator
        if (globalStore.disiableLoading) globalStore.loading = false;
        else globalStore.loading = true;

        return config;
    },
    function (error) {
        const globalStore = useGlobalStore();
        globalStore.loading = false;
        globalStore.disiableLoading = false;
        return Promise.reject(error);
    }
);

instance.interceptors.response.use(
    (response) => {
        const globalStore = useGlobalStore();
        globalStore.loading = false;
        globalStore.disiableLoading = false;
        return response;
    },
    async (error) => {
        const globalStore = useGlobalStore();
        globalStore.loading = false;
        globalStore.disiableLoading = false;
        const authStore = useAuthStore();
        // if()

        if (error.response && error.response.config && error.response.status === 401) {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken != null) {
                try {
                    const response = await instance({
                        method: 'post',
                        url: '/auth/refresh-token',
                        data: {
                            refreshToken: refreshToken,
                            userId: authStore.userId
                        }
                    });

                    localStorage.setItem('authToken', response.data.accessToken);
                    localStorage.setItem('refreshToken', response.data.refreshToken);
                    instance.defaults.headers.common['Authorization'] = `bearer ${response.data.accessToken}`;
                    error.config.headers['Authorization'] = `bearer ${response.data.accessToken}`;
                } catch (error) {
                    authStore.logout();
                }
            } else {
                authStore.logout();
            }
            return axios(error.config);
        } else if (error.response && error.response.data?.errors && error.response.status === 400) {
            error.message = error.response.data.errors.generalErrors.join(',');
            return Promise.reject(error);
        } else {
            return Promise.reject(error);
        }
    }
);

export default instance;
