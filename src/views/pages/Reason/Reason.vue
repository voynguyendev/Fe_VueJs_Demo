<script setup>
//#region
import { CostCenterInventoryService } from '@/service/CostCenterInventoryService';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const filters = ref(null);
const rows = ref(null);
const loading = ref(null);
const reason = ref(null);
const editingRows = ref([]);
const toast = useToast();
//#endregion

//#region

onMounted(async () => {
    // Add message handler
    await fetchData();
});

//#endregion

//#region

const fetchData = async () => {
    // flatten filters for query string
    loading.value = true;
    const { data } = await CostCenterInventoryService.getReasons();
    loading.value = false;
    rows.value = data;
};
const onRowEditSave = (event) => {
    let { newData, index } = event;

    CostCenterInventoryService.updateReason(newData.id, { content: newData.content })
        .then(() => {
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Update reason Successfuly ', life: 3000 });
            fetchData();
        })
        .catch((error) => {
            toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
        });

    console.log(index);
    console.log(newData);
};

const onSave = () => {
    CostCenterInventoryService.addReason({ content: reason.value })
        .then(() => {
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Add reason Successfuly ', life: 3000 });
            reason.value = '';
            fetchData();
        })
        .catch((error) => {
            toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
        });
};

const OnDeleteReason = (id) => {
    CostCenterInventoryService.deleteReason(id)
        .then(() => {
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Delete reason Successfuly ', life: 3000 });
            fetchData();
        })
        .catch((error) => {
            toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
        });
};
//#endregion
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Reason Managerment</div>

        <!-- Advanced Search Panel -->
        <div class="advanced-search-panel">
            <div class="search-field">
                <label for="StatusRemark">Reason</label>
                <InputText v-model="reason" id="Reason" placeholder="Reason" />
            </div>

            <div class="search-buttons">
                <Button :disabled="!reason" @click="onSave" label="Save" icon="pi pi-plus" />
            </div>
        </div>
        <ConfirmDialog :style="{ width: '50%' }"></ConfirmDialog>
        <DataTable @row-edit-save="onRowEditSave" v-model:editingRows="editingRows" :value="rows" dataKey="id" :rowHover="true" v-model:filters="filters" filterDisplay="menu" :loading="loading" :filters="filters" showGridlines editMode="row">
            <template #empty> No Reasons found. </template>
            <template #loading> Loading Reasons data. Please wait. </template>
            <Column field="id" header="" style="width: 10%">
                <template #body="{ data }">
                    <Button @click="OnDeleteReason(data.id)" icon="pi pi-delete-left" severity="danger" variant="text" rounded aria-label="Delete" />
                </template>
            </Column>

            <Column field="content" header="Reason" style="width: 70%">
                <template #editor="{ data, field }">
                    <InputText v-model="data[field]" fluid />
                </template>
            </Column>
            <Column :rowEditor="true" style="width: 20%"></Column>
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
