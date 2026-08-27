import { createRouter, createWebHistory } from "vue-router";

import HomeView from "../views/HomeView.vue";
import IdentityView from "../views/IdentityView.vue";
import GeneratingView from "../views/GeneratingView.vue";
import Workspace from "../components/workspace/Workspace.vue";
import JoinView from "../views/JoinView.vue";
import FirstMovementView from "../views/FirstMovementView.vue";
import ProfileView from "../views/ProfileView.vue";
import TopPageView from "../views/TopPageView.vue";
import PublicProfileView from "../views/PublicProfileView.vue";
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
            path: "/top",
            component: TopPageView,
            meta: { requiresAuth: true }
        },

        {
            path: "/field",
            component: Workspace,
            meta: { requiresAuth: true }
        },

        {
            path: "/workspace",
            redirect: (to) => {
                // Preserve old project notification links after the public TOP Page replaced /workspace.
                if (typeof to.query.project === "string" || typeof to.query.invite === "string") {
                    return { path: "/field", query: to.query };
                }
                return "/top";
            }
        },

        {
            path: "/join",
            component: JoinView
        },

        {
            path: "/onboarding",
            component: FirstMovementView,
            meta: { requiresAuth: true }
        },

        {
            path: "/profile",
            component: ProfileView,
            meta: { requiresAuth: true }
        },

        {
            path: "/people/:personId",
            component: PublicProfileView,
            meta: { requiresAuth: true }
        },

        {
            path: "/explore",
            redirect: "/top"
        },

        {
            path: "/settings",
            redirect: "/profile"
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
