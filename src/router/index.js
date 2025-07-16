import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '/',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/assetclasses',
                    name: 'assetclasses',
                    component: () => import('@/views/pages/AssetClass/AssetClass.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/costcenters',
                    name: 'costcenters',
                    component: () => import('@/views/pages/CostCenter/CostCenter.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/t-assets',
                    name: 'assets',
                    component: () => import('@/views/pages/Asset/Asset.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/inventories/costcenters',
                    name: 'inventorycostcenters',
                    component: () => import('@/views/pages/Inventories/CostCenter/CostCenter.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/inventories/costcenters/:periodId/:costcenter',
                    name: 'costcenterlistdetailByperiodIdAndCostCenter',
                    component: () => import('@/views/pages/Inventories/CostCenter/CostCenterListDetail.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/inventories/costcenters/:id',
                    name: 'costcenterlistdetailById',
                    component: () => import('@/views/pages/Inventories/CostCenter/CostCenterListDetail.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/inventories/mobile/costcenters',
                    name: 'mobile_costcenters',
                    component: () => import('@/views/pages/Inventories/Mobile/CostCenter/CostCenter.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/inventories/mobile/costcenters/:periodId/:costcenter',
                    name: 'mobile_costcenterlistdetail',
                    component: () => import('@/views/pages/Inventories/Mobile/CostCenter/CostCenterListDetail.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/inventories/mobile/updateCostCenterDetail/:id',
                    name: 'mobile_updatecostcenterdetail',
                    component: () => import('@/views/pages/Inventories/Mobile/CostCenter/UpdateCostCenterDetail.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/inventories/mobile/history',
                    name: 'mobile_history',
                    component: () => import('@/views/pages/Inventories/Mobile/History.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/periods',
                    name: 'periods',
                    component: () => import('@/views/pages/Period/Period.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/requesttoopens',
                    name: 'requesttoopens',
                    component: () => import('@/views/pages/RequestToOpen/RequestToOpen.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/reasons',
                    name: 'reasons',
                    component: () => import('@/views/pages/Reason/Reason.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: '/uikit/formlayout',
                    name: 'formlayout',
                    component: () => import('@/views/uikit/FormLayout.vue')
                },
                {
                    path: '/uikit/input',
                    name: 'input',
                    component: () => import('@/views/uikit/InputDoc.vue')
                },
                {
                    path: '/uikit/button',
                    name: 'button',
                    component: () => import('@/views/uikit/ButtonDoc.vue')
                },
                {
                    path: '/uikit/table',
                    name: 'table',
                    component: () => import('@/views/uikit/TableDoc.vue')
                },
                {
                    path: '/uikit/list',
                    name: 'list',
                    component: () => import('@/views/uikit/ListDoc.vue')
                },
                {
                    path: '/uikit/tree',
                    name: 'tree',
                    component: () => import('@/views/uikit/TreeDoc.vue')
                },
                {
                    path: '/uikit/panel',
                    name: 'panel',
                    component: () => import('@/views/uikit/PanelsDoc.vue')
                },

                {
                    path: '/uikit/overlay',
                    name: 'overlay',
                    component: () => import('@/views/uikit/OverlayDoc.vue')
                },
                {
                    path: '/uikit/media',
                    name: 'media',
                    component: () => import('@/views/uikit/MediaDoc.vue')
                },
                {
                    path: '/uikit/message',
                    name: 'message',
                    component: () => import('@/views/uikit/MessagesDoc.vue')
                },
                {
                    path: '/uikit/file',
                    name: 'file',
                    component: () => import('@/views/uikit/FileDoc.vue')
                },
                {
                    path: '/uikit/menu',
                    name: 'menu',
                    component: () => import('@/views/uikit/MenuDoc.vue')
                },
                {
                    path: '/uikit/charts',
                    name: 'charts',
                    component: () => import('@/views/uikit/ChartDoc.vue')
                },
                {
                    path: '/uikit/misc',
                    name: 'misc',
                    component: () => import('@/views/uikit/MiscDoc.vue')
                },
                {
                    path: '/uikit/timeline',
                    name: 'timeline',
                    component: () => import('@/views/uikit/TimelineDoc.vue')
                },
                {
                    path: '/pages/empty',
                    name: 'empty',
                    component: () => import('@/views/pages/Empty.vue')
                },
                {
                    path: '/pages/crud',
                    name: 'crud',
                    component: () => import('@/views/pages/Crud.vue')
                },
                {
                    path: '/documentation',
                    name: 'documentation',
                    component: () => import('@/views/pages/Documentation.vue')
                }
            ]
        },
        {
            path: '/landing',
            name: 'landing',
            component: () => import('@/views/pages/Landing.vue')
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },

        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/Auth/Login.vue')
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/Auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/Auth/Error.vue')
        }
    ]
});
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    await authStore.loginFromStorage();
    if (to.meta.requiresAuth) {
        if (authStore.loggedIn) {
            next();
        } else {
            if (authStore.loggedIn) {
                next();
            } else {
                next('/auth/login');
            }
        }
    } else {
        next();
    }
});
export default router;
