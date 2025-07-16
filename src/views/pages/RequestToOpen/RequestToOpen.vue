<script setup>
//#region
import { CostCenterInventoryService } from '@/service/CostCenterInventoryService';
import { FilterMatchMode } from '@primevue/core/api';
import moment from 'moment';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, onMounted, ref } from 'vue';
const confirm = useConfirm();

const toast = useToast();

const filters = ref(null);
const rows = ref(null);
const totalRecords = ref(null);
const loading = ref(null);

const isChecking = ref(false);
const dataPeriod = {
    pagination: {
        first: 0,
        rows: 10,
        sortField: null,
        sortOrder: null // 1 = asc, -1 = desc
    }
};

//#endregion

//#region

onMounted(async () => {
    // Add message handler
    await fetchData();
});

onBeforeMount(async () => {
    initFilters();
});

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        fixedAssetNumber: { matchMode: FilterMatchMode.CONTAINS },
        subAssetNumber: { matchMode: FilterMatchMode.CONTAINS }
    };
}

const onLazyEvent = async (event) => {
    // event contains: first, rows, sortField, sortOrder, filters
    dataPeriod.pagination = { ...event };
    fetchData();
};
//#endregion

//#region

const fetchData = async () => {
    // flatten filters for query string
    const params = {
        pageNumber: dataPeriod.pagination.first / dataPeriod.pagination.rows + 1,
        pageSize: dataPeriod.pagination.rows
    };
    loading.value = true;
    const { data } = await CostCenterInventoryService.getAllRequestToOpensRequest(params);
    loading.value = false;
    rows.value = data.items;
    totalRecords.value = data.totalRecords;
};

const approveRequest = (id) => {
    confirm.require({
        message: 'Do you want to approve this request?',
        header: 'Danger Zone',
        icon: 'pi pi-info-circle',
        rejectLabel: 'Cancel',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Approve',
            severity: 'danger'
        },
        accept: async () => {
            await CostCenterInventoryService.approveRequestToOpenCostCenterInventory(id)
                .then((response) => {
                    if (response.data) {
                        if (response.data) {
                            fetchData();
                            toast.add({ severity: 'success', summary: 'Successful', detail: "You've approved ", life: 3000 });
                        }
                    }
                })
                .catch((error) => {
                    toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
                });

            //toast.add({ severity: 'info', summary: 'Confirmed', detail: 'Record deleted', life: 3000 });
        },
        reject: () => {
            //toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
        }
    });
};
const rejectRequest = (id) => {
    confirm.require({
        message: 'Do you want to reject this request?',
        header: 'Danger Zone',
        icon: 'pi pi-info-circle',
        rejectLabel: 'Cancel',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Reject',
            severity: 'danger'
        },
        accept: async () => {
            await CostCenterInventoryService.rejectRequestToOpenCostCenterInventory(id)
                .then((response) => {
                    if (response.data) {
                        if (response.data) {
                            fetchData();
                            toast.add({ severity: 'success', summary: 'Successful', detail: "You've rejected ", life: 3000 });
                        }
                    }
                })
                .catch((error) => {
                    toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
                });

            //toast.add({ severity: 'info', summary: 'Confirmed', detail: 'Record deleted', life: 3000 });
        },
        reject: () => {
            //toast.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
        }
    });
};
//#endregion
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Request To Open Managerment</div>

        <!-- Advanced Search Panel -->

        <ConfirmDialog :style="{ width: '50%' }"></ConfirmDialog>
        <DataTable
            paginatorTemplate="CurrentPageReport  FirstPageLink PrevPageLink  NextPageLink LastPageLink RowsPerPageDropdown"
            :value="rows"
            :lazy="true"
            :paginator="!isChecking"
            :rows="dataPeriod.pagination.rows"
            :totalRecords="totalRecords"
            :first="dataPeriod.pagination.first"
            dataKey="id"
            :rowHover="true"
            v-model:filters="filters"
            filterDisplay="menu"
            :loading="loading"
            :filters="filters"
            @page="onLazyEvent"
            @sort="onLazyEvent"
            @filter="onLazyEvent"
            showGridlines
            :globalFilterFields="['fixedAssetNumber', 'subAssetNumber']"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            currentPageReportTemplate="Page {currentPage}  of {totalPages} ({totalRecords} Items)"
        >
            <template #empty> No Periods found. </template>
            <template #loading> Loading Periods data. Please wait. </template>
            <Column field="status" header="Status" style="min-width: 12rem">
                <template #body="{ data }">
                    <Button style="margin-right: 1rem" v-if="data.status == 'Waiting For Approve'" @click="approveRequest(data.id)" label="Approve" icon="pi pi-lock"></Button>
                    <Button v-if="data.status == 'Waiting For Approve'" @click="rejectRequest(data.id)" label="Reject" icon="pi pi-lock"></Button
                ></template>
            </Column>
            <Column field="status" header="Status" style="min-width: 12rem">
                <template #body="{ data }"> {{ data.status }} </template>
            </Column>
            <Column field="comment" header="Comment" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.comment }}
                </template>
            </Column>
            <Column field="createdBy" header="Requester" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.createdBy }}
                </template>
            </Column>
            <Column field="createdAt" header="Date Request" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ moment(data.createdAt).format('YYYY-MM-DD') }}
                </template>
            </Column>
            <Column field="contenRequest" header="Content Request" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.contenRequest }}
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Popup Dialog -->
</template>

<style scoped lang="scss">
:deep(.p-datatable-frozen-tbody) {
    font-weight: bold;
}

:deep(.p-datatable-scrollable .p-frozen-column) {
    font-weight: bold;
}

:deep(.p-datatable-filter-rule .p-select) {
    display: none !important;
}

.advanced-search-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* 1. The panel container */
.advanced-search-panel {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 0.5rem;
    align-items: end;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 2. Each field wrapper */
.search-field {
    display: flex;
    flex-direction: column;
}

.search-field label {
    margin-bottom: 0.25rem;
    font-weight: 600;
    color: #333;
}

/* 3. Button group */
.search-buttons {
    display: contents;
    gap: 0.5rem;
    align-items: center;
}

:deep(.p-dialog-header) {
    border-bottom: 1px solid #e5e7eb;
    padding: 1.25rem;
}

:deep(.p-dialog-content) {
    padding: 0;
}

.p-field label {
    color: #374151;
}

:deep(.p-inputtext) {
    border-radius: 6px;
    transition: border-color 0.2s;
}

:deep(.p-inputtext:hover),
:deep(.p-inputtext:focus) {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 1px var(--primary-color);
}

:deep(.p-dropdown:hover),
:deep(.p-calendar:hover) {
    border-color: var(--primary-color);
}

:deep(.p-button) {
    transition: all 0.2s;
    min-width: 100px;
}
</style>
