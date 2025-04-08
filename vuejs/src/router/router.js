import { createRouter, createWebHistory } from "vue-router";
import authMiddleware from "../middlewares/auth.middleware";
import { socket } from "../socket";
import { roomID } from "../store";

const routes = [
  {
    path: "/rooms",
    name: "rooms",
    component: () => import("../pages/Rooms.vue"),
    beforeEnter: authMiddleware, // Apply auth middleware
  },
  {
    path: "/rooms/:id",
    name: "room",
    component: () => import("../pages/RoomDetail.vue"),
    beforeEnter: authMiddleware,
  },
  {
    path: "/game/:id",
    name: "game",
    component: () => import("../pages/Game.vue"),
    beforeEnter: authMiddleware, // Apply auth middleware
  },
  {
    path: "/instruction",
    name: "instruction",
    component: () => import("../components/GameInstruction.vue"),
  },
  {
    path: "/settings",
    name: "settings",
    component: () => import("../pages/Settings.vue"),
  },
  {
    path: "/",
    name: "home",
    component: () => import("../pages/Home.vue"),
  },
  {
    path: "/home", // Alias for /
    redirect: "/", // Redirect /home to /
  },
  {
    path: "/:catchAll(.*)", // Catch-all route for 404
    name: "notfound",
    component: () => import("../pages/NotFound.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.afterEach(async (to, from) => {
  // Assuming roomID is a reactive ref
  const room = roomID.value;
  const gameID = localStorage.getItem("gameID");
  
  if (!from.name) {
    // First-time load handling
    
    // Redirect to the last room if available
    if (room && !gameID && to.name !== "room") {
      socket.emit("room:join", room);  // Join the room via socket
      router.push({ name: "room", params: { id: room } });  // Use `router` instead of `this.$router`
      return;
    }

    // Redirect to the last game if available
    if (room && gameID && to.name !== "game") {
      socket.emit("room:join", room);  // Join the room via socket
      router.push({ name: "game", params: { id: gameID } });  // Redirect to game
      return;
    }
  }
});

export default router;
