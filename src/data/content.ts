import type { Technology, Topic } from "@/types";
import qaCatalog from "./qaCatalog.json";

export const technologies = qaCatalog.categories as Technology[];
export const topics = qaCatalog.topics as Topic[];