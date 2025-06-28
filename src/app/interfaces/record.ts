export interface RecordAnswer {
    error: boolean;
    record: Record;
}

export interface Record {
    id: number;
    projectId: number;
    categoryId: number;
    type: string;
    area: string;
    completed: Date;
    latitude: string;
    longitude: string;
    worker_fullname: string;
    worker_id_number: string;
    description?: any;
    suggestions?: any;
    boss_signature: string;
    boss_fullname: string;
    url_front: string;
    url_back: string;
    risks_list: number[];
    project: Project;
    created_at?: string | Date | number | null | undefined;
    uuid?: String;
    disciplines_list: [];
}

export interface Project {
    id: number;
    enterpriseId: number;
    name: string;
}
