import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from 'react';

interface FieldProps extends LabelHTMLAttributes<HTMLLabelElement> {
  label: string;
  htmlFor?: string;
}

export function Field({ label, htmlFor, children, ...props }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={htmlFor} {...props}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="select" {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="textarea" {...props} />;
}
