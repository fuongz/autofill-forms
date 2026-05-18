export type FieldType = 'text' | 'email' | 'number' | 'password' | 'search' | 'tel' | 'url' | 'textarea' | 'select' | 'hidden';

export type FormFieldOption = {
  label: string;
  value: string;
};

export type FormField = {
  name: string;
  label: string;
  type: FieldType;
  options: FormFieldOption[] | null;
  defaultValue: string | null;
  placeholder: string | null;
  isHidden: boolean;
};

export type InitFormRequest = {
  type: 'INIT_FORM';
};

export type InitFormResponse = {
  hostname: string;
  fields: FormField[];
};

export type ApplyFormRequest = {
  type: 'APPLY_FORM_DATA';
  data: Record<string, string>;
};

export type ContentMessage = InitFormRequest | ApplyFormRequest;
