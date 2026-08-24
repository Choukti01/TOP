import { createRouter, createWebHistory } from "vue-router";

import HomeView from "../views/HomeView.vue";
import IdentityView from "../views/IdentityView.vue";
import GeneratingView from "../views/GeneratingView.vue";
import Workspace from "../components/workspace/Workspace.vue";
import JoinView from "../views/JoinView.vue";
import ProfileView from "../views/ProfileView.vue";
import { restoreTopSession } from "../lib/auth";

const router = createRouter({

    history: createWebHistory(import.meta.env.BASE_URL),

    scrollBehavior() {
        return { top: 0 };
    },

    routes: [

        {
            path: "/",
            component: HomeView
        },

        {
            path: "/identity",
            component: IdentityView,
            meta: { requiresAuth: true }
        },

        {
            path: "/generating",
            component: GeneratingView
        },

        {
            path: "/workspace",
            component: Workspace,
            meta: { requiresAuth: true }
        },

        {
            path: "/join",
            component: JoinView
        },

        {
            path: "/profile",
            component: ProfileView,
            meta: { requiresAuth: true }
        },

        {
            path: "/explore",
            redirect: "/workspace"
        },

        {
            path: "/settings",
            redirect: "/workspace"
        },

        {
            path: "/:pathMatch(.*)*",
            redirect: "/"
        }

    ]

});

router.beforeEach(async (to) => {
    if (!to.meta.requiresAuth) return true;
    const user = await restoreTopSession();
    return user ? true : { path: "/join", query: { next: to.fullPath } };
});

export default router;
