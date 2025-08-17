export interface FormMeta {
  id: number;
  title: string;
  status: string;
}
export interface FormField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
}
