<script setup>
import router from '@/router';
import { CostCenterInventoryService } from '@/service/CostCenterInventoryService';
import { useGlobalStore } from '@/stores/global';
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
const toast = useToast();
const costcenterDetail = ref({});
const statusScans = ['Complete', 'Not Found', 'Incomplete'];
const statusAssets = ['Use', 'Not Use', 'Damage'];
const reasons = ref([]);
const reason = ref('');
const baseURL = import.meta.env.VITE_API_BASE_URL;
const route = useRoute();
const selectedImage = ref(null);
const globalStore = useGlobalStore();
const fileupload = ref(null);
onMounted(async () => {});
onBeforeMount(async () => {
    if (route.params.id) {
        CostCenterInventoryService.getReasons()
            .then((response) => {
                reasons.value = response.data.map((x) => x.content);
                reasons.value.push('Other');
                reason.value = reasons.value[0];
            })
            .catch(() => {});
        var dataDetail = await CostCenterInventoryService.getCostCenterInventoryDetailById(route.params.id);
        costcenterDetail.value = dataDetail.data;
    }
});
const onSelect = (event) => {
    selectedImage.value = event.files[0];
};
const save = () => {
    var reasonvalue = '';
    if (costcenterDetail.value.statusScan == 'Not Found') {
        if (reason.value != 'Other') {
            reasonvalue = reason.value;
        } else {
            reasonvalue = costcenterDetail.value.remark;
        }
    } else {
        reasonvalue = costcenterDetail.value.remark;
    }
    CostCenterInventoryService.updateCostCenterInventoryDetail({
        id: costcenterDetail.value.id,
        file: selectedImage.value != null ? selectedImage.value : null,
        assetId: costcenterDetail.value.assetId,
        fixedAssetNumber: costcenterDetail.value.fixedAssetNumber,
        subAssetNumber: costcenterDetail.value.subAssetNumber,
        statusScan: costcenterDetail.value.statusScan,
        statusAsset: costcenterDetail.value.statusAsset,
        remark: reasonvalue
    })
        .then((response) => {
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Saved successfully', life: 3000 });
            costcenterDetail.value = response.data;
            clearFiles();
        })
        .catch((error) => {
            toast.add({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
        });
};
const cancel = () => {
    if (globalStore.periodId && globalStore.costcenter) router.push(`/inventories/mobile/costcenters/${globalStore.periodId}/${globalStore.costcenter}`);
};
const clearFiles = () => {
    // This will remove all selected files from the queue
    fileupload.value.clear();
    selectedImage.value = null;
};
</script>

<template>
    <Fluid>
        <div class="flex mt-8">
            <div class="card flex flex-col gap-4 w-full">
                <div v-if="costcenterDetail?.statusScan == 'Not Found'" class="flex flex-wrap statusHeaderNotFound">NOT FOUND</div>
                <div v-if="costcenterDetail?.statusScan != 'Not Found'" class="flex flex-wrap statusHeaderFound">FOUND</div>

                <label for="firstname2" class="label">Asset No</label>
                <div class="flex md:flex-row gap-4">
                    <div class="flex flex-wrap gap-2 w-full">
                        <InputText :disabled="true" id="FixedAssetNumber" v-model="costcenterDetail.fixedAssetNumber" type="text" />
                    </div>
                    <div class="flex flex-wrap gap-2 w-full">
                        <InputText :disabled="true" v-model="costcenterDetail.subAssetNumber" id="lastname2" type="text" />
                    </div>
                </div>
                <label for="address" class="label">Asset Name</label>
                <div class="flex flex-wrap">
                    <InputText :disabled="true" v-model="costcenterDetail.assetName" id="AssetName" rows="4" />
                </div>
                <label for="address" class="label">Cost Center</label>
                <div class="flex flex-wrap">
                    <InputText :disabled="true" v-model="costcenterDetail.costCenterName" id="CostCenterName" rows="4" />
                </div>

                <label for="address" class="label">Asset Status</label>
                <div class="flex flex-wrap">
                    <Select :options="statusAssets" v-model="costcenterDetail.statusAsset" placeholder="Select a Asset Status" />
                </div>

                <label for="address" class="label">Plate Status</label>
                <div class="flex flex-wrap">
                    <Select :options="statusScans" v-model="costcenterDetail.statusScan" placeholder="Select a Scan Status" />
                </div>

                <label v-if="costcenterDetail?.statusScan == 'Not Found'" for="address" class="label">Reason</label>
                <div v-if="costcenterDetail?.statusScan == 'Not Found'" class="flex flex-wrap">
                    <Select :options="reasons" v-model="reason" placeholder="Select a Reason" />
                </div>
                <label for="address" class="label">Note</label>
                <div class="flex flex-wrap">
                    <Textarea :disabled="costcenterDetail.statusScan == 'Not Found' && reason != 'Other'" id="address" v-model="costcenterDetail.remark" rows="4" />
                </div>
                <label for="address" class="label">Icon/Image</label>
                <div class="flex flex-wrap" style="justify-content: center">
                    <Image v-if="!selectedImage && costcenterDetail.imageDefault && costcenterDetail.imageDefault?.imagePathSmall" alt="Image" preview>
                        <template #image>
                            <img style="height: 100px; width: 100px" :src="`${baseURL}${costcenterDetail.imageDefault?.imagePathSmall}`" alt="image" class="rounded" />
                        </template>
                        <template #preview="slotProps">
                            <img :src="`${baseURL}${costcenterDetail.imageDefault?.imagePath}`" alt="preview" :style="slotProps.style" @click="slotProps.onClick" />
                        </template>
                    </Image>
                    <div style="margin-left: 10px; display: inline-flex">
                        <FileUpload ref="fileupload" mode="basic" accept="image/*" label="Upload an Image" chooseLabel="Upload Image" uploadLabel="Upload" :customUpload="true" @select="onSelect" :chooseButtonProps="{ id: 'selectupload' }" />
                        <Button v-if="selectedImage" @click="clearFiles()" icon="pi pi-delete-left" severity="danger" variant="text" rounded aria-label="Delete" />
                    </div>
                </div>

                <div class="flex md:flex-row gap-4">
                    <div class="flex flex-wrap gap-2 w-full">
                        <Button @click="cancel()" label="Cancel" icon="pi" class="button" />
                    </div>
                    <div class="flex flex-wrap gap-2 w-full">
                        <Button @click="save()" label="Save" icon="pi" class="button" />
                    </div>
                </div>
            </div>
        </div>
    </Fluid>
</template>
<style scoped lang="scss">
.statusHeaderFound {
    height: 4.5rem;
    background: #b6d7a8;
    border-color: black;
    border-width: 0.35rem;
    border-style: solid;
    justify-content: center;
    padding-top: 0.5rem;
    font-size: 2.5rem;
    font-weight: 900;
}
.statusHeaderNotFound {
    height: 4.5rem;
    background: #cf2a27;
    border-color: black;
    border-width: 0.35rem;
    border-style: solid;
    justify-content: center;
    padding-top: 0.5rem;
    font-size: 2.5rem;
    font-weight: 900;
    color: white;
}

.label {
    font-size: 1.2rem;
    font-weight: bold;
}
</style>
