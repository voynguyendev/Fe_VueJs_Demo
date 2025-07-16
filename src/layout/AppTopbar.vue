<script setup>
import { useLayout } from '@/layout/composables/layout';
import { useAuthStore } from '../stores/auth';
import AppConfigurator from './AppConfigurator.vue';
const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout();
const authStore = useAuthStore();
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="toggleMenu">
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/" class="layout-topbar-logo">
                <img src="@/assets/images/logo-default.png" alt="Toyota Logo" style="height: 65px" />
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <div class="relative">
                    <AppConfigurator />
                </div>
            </div>

            <div v-if="authStore.loggedIn" class="layout-topbar-menu lg:block">
                <div class="layout-topbar-menu-content">
                    <span class="userinfor">{{ authStore.userName }}</span>
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-user"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.layout-topbar-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
}

.userinfor {
    color: #059669;
    font-weight: bold !important;
}
</style>
