import { createRouter, createWebHistory } from "vue-router";

import HomeView from "../views/HomeView.vue";
import IdentityView from "../views/IdentityView.vue";
import GeneratingView from "../views/GeneratingView.vue";
import Workspace from "../components/workspace/Workspace.vue";

const router = createRouter({

    history: createWebHistory(),

    routes: [

        {
            path: "/",
            component: HomeView
        },

        {
            path: "/identity",
            component: IdentityView
        },

        {
            path: "/generating",
            component: GeneratingView
        },

        {
            path: "/workspace",
            component: Workspace
        },

        {
            path: "/explore",
            redirect: "/workspace"
        },

        {
            path: "/settings",
            redirect: "/workspace"
        }

    ]

});

export default router;
