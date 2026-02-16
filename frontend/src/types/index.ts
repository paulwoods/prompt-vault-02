export interface Folder {
    id: string;
    name: string;
}

export interface FolderRequest {
    name: string;
}

export type DeleteFolderMode = 'move' | 'delete';

export interface Prompt {
    id: string;
    userId: string;
    folderId?: string;
    title: string;
    currentBody: string;
    isFavorite: boolean;
    comments?: string;
    forkedFromPromptId?: string;
    forkedFromAuthor?: string;
    rowVersion: number;
    createdAt: string;
    updatedAt: string;
}
