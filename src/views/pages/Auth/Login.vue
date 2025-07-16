<script setup>
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { z } from 'zod';
import { useAuthStore } from '../../../stores/auth';
const { push } = useRouter()
const initialValues = {
  username: '',
  password: ''
};
const toast=useToast()
const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});
const authStore = useAuthStore()
const onFormSubmit = async (data) =>{
   if (data.valid) {
   try
    {
       const response=await authStore.login(data.values.username,data.values.password);
       toast.add({ severity: 'success', summary: 'Successful', detail: "You've successfully logged in", life: 3000 });
       push({ name: 'dashboard' })

    }
    catch(error)
    {
        toast.add({ severity: 'error', summary: 'Successful', detail: "An error occurred. Please try again later.", life: 3000 });
    }
      
   }
}
</script>

<template>
    <FloatingConfigurator />
    <Form  v-slot="$form" :initialValues="initialValues" :resolver="zodResolver(schema)" @submit="onFormSubmit">
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <img src="@/assets/images/logo-default.png" alt="Toyota Logo" style="height:65px; margin-bottom: 2rem; display: block; margin-left: auto; margin-right: auto;" />
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Welcome to TMV Assets STK!</div>
                        <span class="text-muted-color font-medium">Sign in to continue</span>
                    </div>

                    <div>
                        <label for="username1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">User Name</label>
                        <InputText  name="username" placeholder="Username" class="w-full md:w-[30rem] mb-8" />
                      <Message v-if="$form.username?.invalid" severity="error" size="small" variant="simple">
                            {{ $form.username.error?.message }}
                          </Message>

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                        <Password name="password" placeholder="Password":toggleMask="true" class="mb-4" fluid :feedback="false"></Password>
                       <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">
                             {{ $form.password.error?.message }}
                          </Message>
                        <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                            <div class="flex items-center">
                                <Checkbox v-model="checked" id="rememberme1" binary class="mr-2"></Checkbox>
                                <label for="rememberme1">Remember me</label>
                            </div>
                            <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Forgot password?</span>
                        </div>
                        <Button type="submit"  label="Sign In" class="w-full"  ></Button>
                       <Toast/>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </Form>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
.p-error {
  font-size: 0.75rem;
  color: var(--red-600);
}
</style>
