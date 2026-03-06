export interface SelectOption {
  label: string;
  value: string | number;
  icon?: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'tel' | 'checkbox' | 'radio-group';
  required?: boolean;
  value?: any;
  placeholder?: string;
  options?: SelectOption[];
  icon?: string;
  linkText?: string;
  linkUrl?: string;
  labelHtml?: string;
  validators?: any[];
  errorMessages?: Record<string, string>;
  equalTo?: string;
}
