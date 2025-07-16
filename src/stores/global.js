import { defineStore } from 'pinia';

export const useGlobalStore = defineStore('global', {
    state: () => {
        return {
            loading: false,
            disiableLoading: false,
            costcenter: '',
            periodId: ''
        };
    }
});
