import { createRouter, createWebHistory } from "vue-router";
import authMiddleware from "../middleware/auth.middleware";
const Rooms = () => import("../pages/Rooms.vue");
const RoomDetail = () => import("../pages/RoomDetail.vue");
const Game = () => import("../pages/Game.vue");
const Home = () => import("../pages/Home.vue");
const NotFound = () => import("../pages/NotFound.vue");

const routes = [
  {
    path: "/rooms",
    name: "rooms",
    component: Rooms,
    beforeEnter: authMiddleware, // Apply auth middleware
  },
  {
    path: "/rooms/:id",
    name: "room",
    component: RoomDetail,
    beforeEnter: authMiddleware, // Apply auth middleware
  },
  {
    path: "/game/:id",
    name: "game",
    component: Game,
    beforeEnter: authMiddleware, // Apply auth middleware
  },
  {
    path: "/",
    name: "home",
    component: Home,
  },
  {
    path: "/home", // Alias for /
    redirect: "/", // Redirect /home to /
  },
  {
    path: "/:catchAll(.*)", // Catch-all route for 404
    name: "notfound",
    component: NotFound,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
