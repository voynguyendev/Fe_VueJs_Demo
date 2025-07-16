<script setup>
import { CommonService } from '@/service/CommonService';
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import AppMenuItem from './AppMenuItem.vue';
const authStore = useAuthStore();
const model = ref([
    {
        label: '',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/' }]
    },
    {
        label: '',
        items: [
            { label: 'CostCenters', icon: 'pi pi-fw pi-desktop', to: '/costcenters', visible: !CommonService.isMobile() },
            { label: 'AssetClasses', icon: 'pi pi-fw pi-briefcase', to: '/assetclasses', visible: !CommonService.isMobile() },
            { label: 'Assets', icon: 'pi pi-fw pi-table', to: '/t-assets', visible: !CommonService.isMobile() },
            {
                label: 'Inventory',
                icon: 'pi pi-fw pi-warehouse',
                items: [
                    { label: 'Cost Center', icon: 'pi pi-fw pi-table', to: '/inventories/costcenters', visible: !CommonService.isMobile() },
                    { label: 'Cost Center', icon: 'pi pi-fw pi-table', to: '/inventories/mobile/costcenters', visible: CommonService.isMobile() },
                    { label: 'History', icon: 'pi pi-history', to: '/inventories/mobile/history', visible: CommonService.isMobile() }
                ]
            },
            { label: 'Periods', icon: 'pi pi-fw pi-calendar-clock', to: '/periods', visible: !CommonService.isMobile() },
            { label: 'Request To Opens', icon: 'pi pi-fw pi-calendar-clock', to: '/requesttoopens', visible: !CommonService.isMobile() },
            { label: 'Reasons', icon: 'pi pi-fw pi-graduation-cap', to: '/reasons', visible: !CommonService.isMobile() },
            {
                label: 'Login',
                icon: 'pi pi-fw pi-sign-in',
                to: '/auth/login',
                visible: !authStore.loggedIn
            },
            {
                label: 'Logout',
                icon: 'pi pi-fw pi-sign-out',
                visible: authStore.loggedIn,
                command: () => {
                    authStore.logout();
                }
            }
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
