import { createRouter, createWebHistory } from "vue-router";
import authMiddleware from "../middleware/auth.middleware";
import {
  showBackground,
  roomID,
  gameID,
} from "../store";

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

router.beforeEach(async (to, from, next) => {
  if (!from.name) {
    // First-time load handling
    if (roomID.value && !gameID.value && to.name !== "room") {
      next(`/rooms/${roomID.value}`); // Redirect to last room if available
      return;
    }
    if (roomID.value && gameID.value && to.name !== "game") {
      next(`/game/${gameID.value}`); // Redirect to last game if available
      return;
    }
  }
  if (to.name === "room") {
    localStorage.setItem("roomID", to.params.id);
    roomID.value = to.params.id;
  }
  // Continue with navigation if no issues
  next();
});

router.afterEach(async (to, from) => {
  if (to.name === "game") {
    // Hide background on 'game' route
    showBackground.value = false;
  }
});

export default router;
