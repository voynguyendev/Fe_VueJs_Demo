import router from '@/router';
import { jwtDecode } from 'jwt-decode';
import { defineStore } from 'pinia';
import { AuthService } from '../service/AuthService';

import instance from '../service/AxiosInstance';

export const useAuthStore = defineStore('user', {
    state: () => {
        return {
            userName: '',
            email: '',
            memberSince: '8/12/2020',
            pfp: 'https://picsum.photos/id/22/200/300',
            is2FAEnabled: false,
            userId: '',
            loggedIn: false
        };
    },

    actions: {
        toggle2FA() {
            this.is2FAEnabled = !this.is2FAEnabled;
        },

        changeUserName(userName) {
            this.userName = userName;
        },
        logout() {
            this.userName = '';
            this.email = '';
            this.userId = '';
            this.loggedIn = false;
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            instance.defaults.headers.common['Authorization'] = '';
            router.push('/auth/login');
        },
        async login(username, password) {
            const response = await AuthService.login(username, password);

            this.userId = response.data.userId;
            this.email = response.data.email;
            this.userName = response.data.userName;
            this.loggedIn = true;

            localStorage.setItem('authToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);

            localStorage.setItem('user', JSON.stringify({ userId: response.data.userId, email: response.data.email, userName: response.data.userName }));

            instance.defaults.headers.common['Authorization'] = `bearer ${response.data.accessToken}`;

            //axios.defaults.headers.common['Authorization'] = 'test';

            console.log('login :' + response.data.accessToken);
        },
        async loginFromStorage() {
            var refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken != null && refreshToken != undefined) {
                var jwt = localStorage.getItem('authToken');
                if (jwt != null && jwt != undefined) {
                    this.loggedIn = true;
                    var user = JSON.parse(localStorage.getItem('user'));
                    this.userId = user.userId;
                    this.email = user.email;
                    this.userName = user.userName;
                    const decodedJwt = jwtDecode(jwt);
                    if (Date.now() >= decodedJwt.exp * 1000) {
                        try {
                            const response = await AuthService.refreshtoken(this.userId, refreshToken);

                            if (response.status == 200) {
                                localStorage.setItem('authToken', response.data.accessToken);
                                localStorage.setItem('refreshToken', response.data.refreshToken);
                                jwt = response.data.accessToken;
                            } else {
                                this.logout();
                                return;
                            }
                        } catch (error) {
                            this.logout();
                            return;
                        }
                    }

                    instance.defaults.headers.common['Authorization'] = `bearer ${jwt}`;

                    console.log('loginFromStorage :' + jwt);
                }
            }
        }
    }
});
