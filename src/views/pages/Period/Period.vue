<script setup>
//#region

import { PeriodService } from '@/service/PeriodService';
import { FilterMatchMode } from '@primevue/core/api';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import moment from 'moment';
import DatePicker from 'primevue/datepicker';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, onMounted, ref } from 'vue';
import { z } from 'zod';
const confirm = useConfirm();
const schema = z.object({
    type: z.string().min(1, 'Type is required'),

    year: z.string().min(1, 'Year is required').pipe(z.coerce.number().int('invalid Number').gte(1000, 'Greater than or equal to 1000.').lte(9999, 'Less than or equal to 9999.')),
    periodCount: z.string().min(1, 'Period Count is required').pipe(z.coerce.number().int('Invalid Number').gte(1, 'Greater than to 1.').lte(50, 'Less than or equal to 50.')),
    startDate: z.preprocess(
        (val) => {
            if (val === '' || val === null) {
                return null;
            }

            return new Date(val);
        },
        z.union([z.date(), z.null().refine((val) => val !== null, { message: 'Start Date is required.' })])
    ),

    endDate: z.preprocess(
        (val) => {
            if (val === '' || val === null) {
                return null;
            }

            return new Date(val);
        },
        z.union([z.date(), z.null().refine((val) => val !== null, { message: 'End Date is required.' })])
    )
});
const initialValues = {
    year: moment().year().toString(),
    periodCount: '',
    startDate: '',
    endDate: '',
    type: 'StockTaking'
};
const displayPopup = ref(false);
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

const typevalue = ref('StockTaking');

//#endregion

//#region
const openPopup = () => {
    displayPopup.value = true;
};
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

const onCreateNewPeriod = async () => {
    openPopup();
};

const onLazyEvent = async (event) => {
    // event contains: first, rows, sortField, sortOrder, filters
    dataPeriod.pagination = { ...event };
    fetchData();
};
//#endregion

//#region
const onFormSubmit = async (data) => {
    if (data.valid) {
        try {
            const response = await PeriodService.createOrupdate({
                year: data.values.year,
                periodCount: data.values.periodCount,
                startDate: data.values.startDate,
                endDate: data.values.endDate,
                type: typevalue.value
            })
                .then((response) => {
                    if (response && response.data) {
                        fetchData();

                        toast.add({ severity: 'success', summary: 'Successful', detail: "You've create successfully", life: 3000 });
                        closePopup();
                    }
                })
                .catch((error) => {
                    toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
                });
        } catch (error) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'An error occurred. Please try again later.', life: 3000 });
        }
    }
};

const closePopup = () => {
    displayPopup.value = false;
};

const fetchData = async () => {
    // flatten filters for query string
    const params = {
        pageNumber: dataPeriod.pagination.first / dataPeriod.pagination.rows + 1,
        pageSize: dataPeriod.pagination.rows,
        sortField: dataPeriod.pagination.sortField,
        sortOrder: dataPeriod.pagination.sortOrder
    };
    loading.value = true;
    const { data } = await PeriodService.getperiods(params);
    loading.value = false;
    rows.value = data.items;
    totalRecords.value = data.totalPage * dataPeriod.pagination.rows;
};

const closePeriod = (id) => {
    confirm.require({
        message: 'Do you want to close this period?',
        header: 'Danger Zone',
        icon: 'pi pi-info-circle',
        rejectLabel: 'Cancel',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Close',
            severity: 'danger'
        },
        accept: async () => {
            await PeriodService.closeperiodbyid({ id: id })
                .then((response) => {
                    if (response.data) {
                        if (response.data.isSuccess) {
                            fetchData();
                            toast.add({ severity: 'success', summary: 'Successful', detail: "You've close successfully", life: 3000 });
                        } else {
                            confirm.require({
                                message: response.data.message,
                                header: 'Danger Zone',
                                icon: 'pi pi-info-circle',
                                rejectLabel: 'Cancel',
                                rejectProps: {
                                    label: 'Cancel',
                                    severity: 'secondary',
                                    outlined: true
                                },
                                acceptProps: {
                                    label: 'Close',
                                    severity: 'danger'
                                },
                                accept: async () => {
                                    await PeriodService.closeperiodbyid({ id: id, isForce: true })
                                        .then((response) => {
                                            if (response.data) {
                                                if (response.data.isSuccess) {
                                                    fetchData();
                                                    toast.add({ severity: 'success', summary: 'Successful', detail: "You've close successfully", life: 3000 });
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
        <div class="font-semibold text-xl mb-4">Periods Managerment</div>

        <!-- Advanced Search Panel -->
        <div class="advanced-search-panel">
            <div class="search-buttons">
                <Button @click="onCreateNewPeriod" label="Create New Period" icon="pi pi-plus" />
            </div>
        </div>
        <ConfirmDialog :style="{ width: '50%' }"></ConfirmDialog>
        <DataTable
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
        >
            <template #empty> No Periods found. </template>
            <template #loading> Loading Periods data. Please wait. </template>

            <Column field="id" header="Id" style="min-width: 12rem">
                <template #body="{ data }">
                    <Button v-if="data.status == 'Openning'" @click="closePeriod(data.id)" label="Close" icon="pi pi-lock"></Button>
                </template>
            </Column>
            <Column field="type" header="Type" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.type }}
                </template>
            </Column>
            <Column field="year" header="Year" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.year }}
                </template>
            </Column>
            <Column field="name" header="Name" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.name }}
                </template>
            </Column>
            <Column field="status" header="Status" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ data.status }}
                </template>
            </Column>
            <Column field="startDate" header="Start Date" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ moment(data.startDate).format('YYYY-MM-DD') }}
                </template>
            </Column>
            <Column field="endDate" header="End Date" style="min-width: 12rem">
                <template #body="{ data }">
                    {{ moment(data.endDate).format('YYYY-MM-DD') }}
                </template>
            </Column>
            <Column field="Total" header="Total" style="min-width: 6rem">
                <template #body="{ data }">
                    {{ data.total }}
                </template>
            </Column>
            <Column field="Complete" header="Complete" style="min-width: 6rem">
                <template #body="{ data }">
                    {{ data.assetStatusComplete }}
                </template>
            </Column>

            <Column field="assetStatusMissing" header="Remain" style="min-width: 6rem">
                <template #body="{ data }">
                    {{ data.assetStatusMissing }}
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Popup Dialog -->
    <Dialog v-model:visible="displayPopup" header="Create Period" :style="{ width: '20rem', borderTop: '5px solid var(--primary-color)' }" :modal="true" :dismissableMask="true">
        <Form v-slot="$form" :initialValues="initialValues" :resolver="zodResolver(schema)" @submit="onFormSubmit">
            <div class="grid p-fluid">
                <!-- Name Field -->

                <div class="flex flex-wrap gap-4" style="margin-bottom: 1rem">
                    <div class="flex items-center gap-2">
                        <RadioButton v-model="typevalue" inputId="ingredient1" name="type" value="StockTaking" />
                        <label for="ingredient1">Stock Taking</label>
                    </div>
                    <div class="flex items-center gap-2">
                        <RadioButton v-model="typevalue" inputId="ingredient2" name="type" value="Counting" />
                        <label for="ingredient2">Counting</label>
                    </div>
                </div>

                <div class="col-12 md:col-6 field mb-4">
                    <label class="block text-sm font-medium mb-2">Year</label>
                    <span class="p-input-icon-left w-full">
                        <InputText name="year" placeholder="Year" />
                    </span>
                    <Message v-if="$form.year?.invalid" severity="error" size="small" variant="simple">
                        {{ $form.year.error?.message }}
                    </Message>
                </div>

                <div class="col-12 md:col-6 field mb-4">
                    <label class="block text-sm font-medium mb-2">Period Count</label>
                    <span class="p-input-icon-left w-full">
                        <InputText name="periodCount" placeholder="Period Count" />
                    </span>
                    <Message v-if="$form.periodCount?.invalid" severity="error" size="small" variant="simple">
                        {{ $form.periodCount.error?.message }}
                    </Message>
                </div>

                <!-- Date Picker -->
                <div class="col-12 md:col-6 field mb-4">
                    <label class="block text-sm font-medium mb-2">Start Date </label>
                    <span class="p-input-icon-left w-full">
                        <DatePicker name="startDate" dateFormat="yy-mm-dd" />
                    </span>

                    <Message v-if="$form.startDate?.invalid" severity="error" size="small" variant="simple">
                        {{ $form.startDate.error?.message }}
                    </Message>
                </div>

                <!-- Date Picker -->
                <div class="col-12 md:col-6 field mb-4">
                    <label class="block text-sm font-medium mb-2">End Date </label>
                    <span class="p-input-icon-left w-full">
                        <DatePicker name="endDate" dateFormat="yy-mm-dd" />
                    </span>

                    <Message v-if="$form.endDate?.invalid" severity="error" size="small" variant="simple">
                        {{ $form.endDate.error?.message }}
                    </Message>
                </div>
            </div>

            <!-- Form Actions -->
            <div class="flex justify-content-end gap-3 border-t pt-4 mt-4">
                <Button label="Cancel" icon="pi pi-times" class="p-button-outlined p-button-secondary" @click="closePopup" />
                <Button type="submit" label="Create Period" icon="pi pi-check" class="p-button-success" :disabled="processing" />
            </div>
        </Form>
    </Dialog>
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
