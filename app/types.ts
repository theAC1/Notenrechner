
export type Schueler = {
    id: number;
    name: string;
    punkte: number;
    note?: number; // Optional because base Schueler might not have it calculated yet
};

export type SortOption = 'name-asc' | 'name-desc' | 'punkte-asc' | 'punkte-desc' | 'note-asc' | 'note-desc';
