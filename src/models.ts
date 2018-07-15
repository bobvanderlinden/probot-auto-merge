import { Context } from "probot";
import { Config } from "./config";

export interface HandlerContext {
  log: (msg: string) => void;
  github: Context["github"];
  config: Config;
}

export * from './github-models'
