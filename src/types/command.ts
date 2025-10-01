export interface Command {
  id: string;
  title: string;
  command: string;
  description: string;
  tags: string[];
  favorite?: boolean;
  createdAt: Date;
  updatedAt: Date;
}