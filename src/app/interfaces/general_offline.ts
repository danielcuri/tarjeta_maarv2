export interface OfflineGeneral {
    error: boolean;
    enterprises: Enterprise[];
    categories: GeneralModel[];
    risks: GeneralModel[];
    records: Record[];
    version : Version;
    message: string;
    default_password: boolean;
    coronaforms: any;
    covid_records: any[];
    disciplines: GeneralModel[]
}
export interface Version {
    android: string;
    ios: string;
    link_android: string;
    link_ios : string;
}

export interface Record {
    id: number;
    projectId: number;
    project_name?: string;
    categoryId: number;
    type: string;
    area: string;
    latitude: string;
    longitude: string;
    worker_fullname: string;
    worker_id_number: string;
    description?: any;
    suggestions?: any;
    boss_title: string;
    boss_signature: string;
    boss_fullname: string;
    url_img_front: string;
    url_img_back: string;
    completed: string;
    created_at: string;
    date_info: string;
    risks_list: number[];
    project: Project;
}

export interface GeneralModel {
    id: number;
    name: string;
}

export interface Enterprise {
    id: number;
    name: string;
    project: Project[];
}

export interface Project {
    id: number;
    enterpriseId: number;

    name: string;
}
