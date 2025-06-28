export interface EnterpriseAnswer {
    error: boolean;
    enterprises: Enterprise[];
}

export interface Enterprise {
    id: number;
    name: string;
    ruc?: string;
    project: Project[];
}

export interface Project {
    id: number;
    enterpriseId: number;
    name: string;
}
