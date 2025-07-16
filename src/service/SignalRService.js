import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { ref } from 'vue';
const connection = ref(null)
const isConnected = ref(false)
const error = ref(null)

export const SignalRService={
    async startConnection  (hubUrl)  {
        try {
            connection.value = new HubConnectionBuilder()
              .withUrl(hubUrl)
              .configureLogging(LogLevel.Information)
              .withAutomaticReconnect()
              .build()
      
            await connection.value.start()
            isConnected.value = true
          } catch (err) {
            error.value = err
            console.error('Connection failed:', err)
          }
    },
    async addHandler   (methodName, callback)  {
        connection.value?.on(methodName, callback);
    },
    async stopConnection   ()  {
        if (connection.value) {
            await connection.value.stop()
            isConnected.value = false
          }
    },
    
}