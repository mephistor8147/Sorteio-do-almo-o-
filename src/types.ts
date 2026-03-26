export interface Employee {
  id: string;
  name: string;
  photo: string;
  active: boolean;
}

export interface SortHistory {
  id: string;
  date: string;
  order: string[]; // List of employee IDs
  responsibleAdmin?: string;
}

export interface AppConfig {
  title: string;
  bannerUrl: string;
  logoUrl: string;
  nextSortDate?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
}
