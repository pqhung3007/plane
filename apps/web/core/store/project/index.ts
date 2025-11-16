import type { CoreRootStore } from "../root.store";
import type { IProjectPublishStore } from "./project-publish.store";
import { ProjectPublishStore } from "./project-publish.store";
import type { IProjectStore } from "./project.store";
import { ProjectStore } from "./project.store";
import type { IProjectTemplateStore } from "./project-template.store";
import { ProjectTemplateStore } from "./project-template.store";
import type { IProjectFilterStore } from "./project_filter.store";
import { ProjectFilterStore } from "./project_filter.store";

export interface IProjectRootStore {
  project: IProjectStore;
  projectFilter: IProjectFilterStore;
  publish: IProjectPublishStore;
  template: IProjectTemplateStore;
}

export class ProjectRootStore {
  project: IProjectStore;
  projectFilter: IProjectFilterStore;
  publish: IProjectPublishStore;
  template: IProjectTemplateStore;

  constructor(_root: CoreRootStore) {
    this.project = new ProjectStore(_root);
    this.projectFilter = new ProjectFilterStore(_root);
    this.publish = new ProjectPublishStore(this);
    this.template = new ProjectTemplateStore(_root);
  }
}
