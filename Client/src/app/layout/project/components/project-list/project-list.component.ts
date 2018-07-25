import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Project } from '../../../../shared/models/project.model';
import { Router, ActivatedRoute } from '@angular/router';
import {
  PerfectScrollbarConfigInterface,
  PerfectScrollbarComponent, PerfectScrollbarDirective
} from 'ngx-perfect-scrollbar';
import { ProjectService } from '../../../../shared/services/project.service';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit, OnDestroy {

  public props = {
    deletedPrjId: null,

    displayCreateProjectModal: 'none',
    displayDeleteProjectModal: 'none',

    newProject: {
      prj_name: null,
      perror: null
    },

    optionDisabled: false,

    sortTypes: ['Newest First', 'A - Z', 'Z -  A'],
    selectedSortType: 0,

    pageData: {
      pageTitle: 'All Projects',
      isPageDetail: false
    }
  };

  public projects: any = [];
  public $uns: any = [];

  constructor(public service: ProjectService, public router: Router) {

    // GET_PROJECT_LIST_RESPONSE
    this.$uns.push(this.service.onGetProjectList.subscribe((message) => {
      const success = message['success'];
        if (success) {
          if (message['projects'] != null) {
            this.projects = message['projects'];
            this.sortProject(this.props.selectedSortType);
          }
        } else {
      }
    }));

    // CREATE_PROJECT_RESPONSE
    this.$uns.push(this.service.onCreateProject.subscribe((message) => {
      const success = message['success'];
        if (success) {
          this.props.newProject.perror = '';
          this.props.displayCreateProjectModal = 'none';
          this.router.navigate(['/detail', message['prj_id']]);
        } else {
          this.props.newProject.perror = 'This project name already exits...';
        }
    }));

    // DELETE_PROJECT_RESPONSE
    this.$uns.push(this.service.onDeleteProject.subscribe((message) => {
      const success = message['success'];
      if (success) {
        const index = this.projects.findIndex(p => p.prj_id === message.prj_id);
        this.projects.splice(index, 1);
      } else {
      }
    }));
  }

  ngOnInit() {
    // GET PROJECT LIST
    this.projects = this.service._getProjectList();
  }

  ngOnDestroy() {
    this.$uns.forEach($uns => {
      $uns.unsubscribe();
    });
  }

  sortProject(type) {
    if (type === 0) {
      this.props.selectedSortType = 0;
      this.projects.sort((leftSide, rightSide): number => {
          if (leftSide.prj_created_at < rightSide.prj_created_at) {
              return 1;
          } else if (leftSide.prj_created_at > rightSide.prj_created_at) {
              return -1;
          }
          return 0;
      });
    } else if (type === 1) {
      this.props.selectedSortType = 0;
      this.projects.sort((leftSide, rightSide): number => {
          if (leftSide.prj_name < rightSide.prj_name) {
              return -1;
          } else if (leftSide.prj_name > rightSide.prj_name) {
              return 1;
          }
          return 0;
      });
    } else {
      this.props.selectedSortType = 0;
      this.projects.sort((leftSide, rightSide): number => {
          if (leftSide.prj_name < rightSide.prj_name) {
              return 1;
          } else if (leftSide.prj_name > rightSide.prj_name) {
              return -1;
          }
          return 0;
      });
    }
  }

  // CreateProjectModal Dialog management
  openCreateProjectModal() {
    this.props.displayCreateProjectModal = 'block';
  }
  cancelCreateProject() {
    this.props.displayCreateProjectModal = 'none';
  }
  okCreateProject() {
    if (this.props.newProject.prj_name && (this.props.newProject.prj_name).trim() !== '') {
      this.service._createProject(this.props.newProject.prj_name);
      this.props.displayCreateProjectModal = 'none';
    } else {
      this.props.newProject.perror = 'Please enter project name.';
    }
  }

  // DeleteProjectModal Dialog management
  deleteProject( prj_id ) {
    this.openDeleteProjectModal();
    this.props.deletedPrjId = prj_id;
  }
  openDeleteProjectModal() {
    this.props.displayDeleteProjectModal = 'block';
  }
  cancelDeleteProject() {
    this.props.displayDeleteProjectModal = 'none';
  }
  okDeleteProject() {
    this.props.displayDeleteProjectModal = 'none';
    this.service._deleteProject(this.props.deletedPrjId);
  }

  // Show Project Video
  showProjectVideo(result_video, representative, project_name) {

  }

  isImage(path) {
    if (!path) {
        return false;
    }
    return !!path.match(/.+(\.jpg|\.jpeg|\.png|\.gif)$/);
  }

  isVideo(path) {
    if (!path) {
        return false;
    }
    return !!path.match(/.+(\.mp4|\.avi|\.mpeg|\.flv|\.mov)$/);
  }
}
