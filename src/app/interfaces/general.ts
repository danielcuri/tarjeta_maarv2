export interface General {
  error: boolean;
  projects: GeneralModel[];
  categories: GeneralModel[];
  risks: GeneralModel[];
  records: Record[];
}

export interface Record {
  id: number;
  worker_fullname: string;
  type: string;
  project_id: number;
  date_info: string;
  project: GeneralModel;
}

export interface GeneralModel {
  id: number;
  name: string;
}

export interface Simple {
  error: boolean;
  msg: string;
  msgs?: string[];
}
export interface UserFileAnswer {
  error: boolean;
  list_files: UserFiles[];
}
export interface UserFiles {
  id: number;
  url_file: string;
  description: string;
  name: string;
  color: string;
  created_at: string;
}
