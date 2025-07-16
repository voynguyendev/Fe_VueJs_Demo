<script setup>
import { useLayout } from '@/layout/composables/layout';
import AppMenu from './AppMenu.vue';

const { toggleSidebar, layoutState } = useLayout();
</script>

<template>
    <div class="layout-sidebar" :class="{ 'collapsed': layoutState.sidebarCollapsed }">
        <div class="layout-sidebar-logo">
            <span class="logo-text">TMV Assets STK</span>
        </div>
        <app-menu></app-menu>
        <button class="sidebar-collapse-btn" :class="{ 'collapsed': layoutState.sidebarCollapsed }" @click="toggleSidebar">
            <span>
                <i :class="layoutState.sidebarCollapsed ? 'pi pi-angle-double-right' : 'pi pi-angle-double-left'"></i>
                <span v-if="!layoutState.sidebarCollapsed" class="ml-2">Collapse</span>
            </span>
        </button>
    </div>
</template>

<style lang="scss" scoped>
.layout-sidebar-logo {
    display: flex;
    align-items: center;
    padding: 1rem 0;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--surface-border);
    
    .logo-text {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: all 0.3s ease;
    }
}

.sidebar-collapse-btn {
    &:hover {
        transform: translateX(-50%) translateY(-2px);
    }

    span {
        display: flex;
        align-items: center;
        justify-content: center;

        i {
            color: #ff6b6b;  // Light red color
            font-size: 1.1rem;
        }
    }
}
</style>
