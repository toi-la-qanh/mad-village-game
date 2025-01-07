<template>
  <button @click="connect()">Connect</button>
  <button @click="disconnect()">Disconnect</button>
</template>

<script>
import { socket, state } from "../socket";

export default {
  name: "ConnectionManager",

  methods: {
    connect() {
      console.log("Connecting...");
      socket.connect();
    },
    disconnect() {
      console.log("Disconnecting...");
      socket.disconnect();
    },
  },
};
</script>
