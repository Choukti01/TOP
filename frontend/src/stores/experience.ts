import { defineStore } from "pinia";

export enum ExperienceState {

    INTRO = "INTRO",

    TRANSITION = "TRANSITION",

    MISSION_CONTROL = "MISSION_CONTROL",

    WORLD = "WORLD"

}

export const useExperienceStore = defineStore(

    "experience",

    {

        state: () => ({

            state: ExperienceState.INTRO

        }),

        actions: {

           enter(){

this.state =

ExperienceState.TRANSITION;

setTimeout(()=>{

this.state =

ExperienceState.MISSION_CONTROL;

},2500);

},

            showMissionControl() {

                this.state =

                    ExperienceState.MISSION_CONTROL;

            },

            enterWorld() {

                this.state =

                    ExperienceState.WORLD;

            }

        }

    }

);
