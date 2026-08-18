import { Router } from "express";

export const apiRouter = Router();

apiRouter.get("/", (_request, response) => {
  response.status(200).json({
    name: "TOP API",
    version: "v1",
    philosophy: "Build better lives in the real world."
  });
});
