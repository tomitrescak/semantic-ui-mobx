import * as React from 'react';
import * as moment from 'moment';
import { observer } from 'mobx-react';
import { style } from 'typestyle';
import i18n from 'es2015-i18n-tag';
import { types, IType } from 'mobx-state-tree';

import { IModelType } from "mobx-state-tree/lib/types/complex-types/object";
import { ISnapshottable } from "mobx-state-tree/lib/types/type";
import { IMSTNode } from "mobx-state-tree/lib/core";
import { FormComponent, FormGroupProps, Form as SUIForm, Label as SUILabel, Input as SuiInput, FormInputProps, FormSelectProps, FormRadioProps, FormTextAreaProps, FormFieldProps } from 'semantic-ui-react';

import DatePickerView from 'react-datepicker';

export { Form as SUIForm } from 'semantic-ui-react';

export const Form = SUIForm;
export const Field = SUIForm.Field;
export const Group = SUIForm.Group;

const errorStyle = style({
  marginTop: '3px!important'
});

export interface FormEvent {
  checked?: boolean;
  label: string;
  name: string;
  required: boolean;
  type: string;
  value: any;
}

export type Validator = (value: string | number) => string;


export const FieldModel = types.model(
  "FormField",
  {
    value: '',
    message: '',
    hasError: false,
    validators: types.frozen as IType<Validator[], Validator[]>
  },
  {
    validate(): string {
      for (let validator of this.validators) {
        let message = validator(this.value);
        if (message) {
          this.hasError = true;
          return message;
        }
      }
      this.hasError = false;
      return null;
    },
    onChange(value: string | number | boolean) {
      this.value = value ? value.toString() : '';
      this.validate();
    },
    isValid() {
      return this.validate() === null;
    }
  }
);

function validateField(field: any) {
  if (field && field.validate) {
    let message = field.validate();
    if (message) {
      return message;
    }
  }
  return null;
}

export function validate(model: any): string {
  for (let name in Object.getOwnPropertyNames(model)) {
    if (Array.isArray(model[name])) {
      for (let i in model[name]) {
        let message = validateField(model[name][i]);
        if (message) { return message; }
      }
    }
    let message = validateField(model[name]);
    if (message) {
      return message;
    }   
  }
  return null;
}

export function hasError(model: any) {
  return validate(model) !== null;
}

export type FieldType = typeof FieldModel.Type;
// export type IndexType = {
//   [index: string]: FieldType;
// }

// export const FormModel = types.model("Form", {
//   message: types.string,
//   hasError: types.boolean,
//   fields: types.frozen as IType<IndexType, IndexType>
// }, {
//   validate(): string {
//     for (let name in this.fields) {
//       let field = this.fields[name];
//       let message = field.validate();
//       if (message) {
//         this.hasError = true;
//         return message;
//       }
//     }
//     this.hasError = false;
//     return null;
//   },
//   isValid() {
//     return this.validate() === null;
//   }
// })

export interface FormElement<T> {
  owner: FieldType;
}

export class FormControl<P, T> extends React.PureComponent<P & FormElement<T>, {}> {
  update: any = (_e: React.SyntheticEvent<any>, formEvent: FormEvent) => {
    // this.props.owner.value = formEvent.value;
    this.props.owner.onChange(formEvent.value);
  }

  get value() {
    return this.props.owner.value;
  }
}

interface ErrorProps {
  owner: FieldType;
}
const Error = ({ owner }: ErrorProps) => (
  <SUILabel color="red" className={errorStyle}>{owner.message}</SUILabel>
);

@observer
export class Input extends FormControl<FormInputProps, any> {
  render() {
    // console.log('Rendering: ' + this.value);
    let { owner, label, className, ...rest } = this.props;
    return (
      <Form.Field error={owner.hasError} width={this.props.width} className={this.props.className}>
        {label && <label>{label}</label>}
        <SuiInput onChange={this.update} value={this.value} placeholder={this.props.placeholder || label} {...rest } />
        {owner.hasError && <Error owner={this.props.owner} />}
      </Form.Field>
    );
  }
}

Input.displayName = 'BoundInput';

@observer
export class TextArea extends FormControl<FormTextAreaProps, {}> {

  render() {
    let { owner, label, className, ...rest } = this.props;
    return (
      <Form.Field error={owner.hasError} width={this.props.width} className={className}>
        {label && <label>{label}</label>}
        <Form.TextArea onChange={this.update} value={this.value} placeholder={this.props.placeholder || label} {...rest } />
        {owner.hasError && <Error owner={owner} />}
      </Form.Field>
    );
  }
};

TextArea.displayName = 'BoundTextArea';

export interface Props {
  format?: string;
  onChange?(date: Date): void;
}

let id_helper = 0;
function randomID() {
  return (Date.now() + id_helper++).toString();
}

class DateControl extends React.Component<any, any> {
  focus() { /**/ }
  clear = (e: React.KeyboardEvent<any>) => {
    if (e.keyCode === 8 || e.keyCode === 46) {
      this.props.clear();
    }
  }
  render() {
    const { clear, ...rest } = this.props;
    return (
      <SuiInput {...rest } icon="calendar" readOnly={true} onKeyDown={this.clear} />
    );
  }
}

export interface DateProps {
  [param: string]: any;
  format?: string;
}

interface State {
  val: Date;
}

@observer
export class DatePicker extends FormControl<FormInputProps & DateProps, {}>  {
  static defaultProps = {
    format: 'DD MMM YYYY'
  };
  prohibit() {
    return false;
  }
  clear() {
    this.props.owner.value = null;
  }
  updateDate = (moment: any) => {
    this.update(null, { value: moment.toDate() });
  }
  render() {
    const { format, placeholder, owner, ...rest } = this.props as any;
    return (
      <div className="three wide field">
        {this.props.label && <label>{this.props.label}</label>}
        <DatePickerView
          {...rest}
          customInput={<DateControl clear={this.clear.bind(this)} />}
          onChange={this.updateDate}
          dateFormat={format}
          placeholderText={placeholder}
          selected={this.value ? moment(this.value) : null} />
      </div>
    );
  }
};

DatePicker.displayName = 'DatePicker';

export interface LabelProps {
  label: string;
}
export const Label = (props: FormFieldProps & LabelProps) => {
  const { children, ...rest } = props;
  return (
    <Form.Field {...rest}>
      <label>{props.label}</label>
    </Form.Field>
  );
}

Label.displayName = 'BoundLabel';

@observer
export class Select extends FormControl<FormSelectProps, {}>  {
  updateSelect = (_e: any, selectValue: { name: string, value: any }) => {
    // this.props.owner.value = selectValue.value;
    this.props.owner.onChange(selectValue.value);
  }

  render() {
    let { owner, label, className, ...rest } = this.props;
    return (
      <Form.Field error={owner.hasError} width={this.props.width} className={this.props.className}>
        {label && <label>{label}</label>}
        <Form.Select onChange={this.updateSelect as any} value={this.value} {...rest } />
        {owner.hasError && <Error owner={this.props.owner} />}
      </Form.Field>
    );
  }
};

Select.displayName = 'BoundSelect';

@observer
export class Radio extends FormControl<FormRadioProps, {}> {
  update = (e: React.SyntheticEvent<HTMLInputElement>) => {
    // this.props.owner.value = formEvent.checked;
    this.props.owner.onChange(e.currentTarget.checked);
  }

  render() {
    let { owner, label, className, ...rest } = this.props;
    return (
      <Form.Radio onChange={this.update} value={'radio'} {...rest } />
    );
  }
};

Radio.displayName = 'BoundRadio';

@observer
export class Checkbox extends FormControl<FormRadioProps, {}> {
  update = (e: React.SyntheticEvent<HTMLInputElement>) => {
    // this.props.owner.value = formEvent.checked;
    this.props.owner.onChange(e.currentTarget.checked);
  }

  render() {
    let { owner, ...rest } = this.props;
    let checked = this.props.owner.value === 'true';
    return (
      <Form.Checkbox onChange={this.update} value={'checkbox'} checked={checked} {...rest } />
    );
  }
};

Checkbox.displayName = 'BoundCheckbox';

// Fields and validators

export function requiredValidator(value: string | number) {
  return value === '' || value == null ? i18n`This field is required` : '';
}

export function regExValidator(reg: RegExp, format?: string) {
  return (value: string) => {
    if (reg.exec(value)) {
      return '';
    }
    if (format) {
      return i18n`Expecting format: ${format}`;
    }
    return i18n`Unexpected format`;
  };
}


const intReg = /^(\+|\-)?\d+$/;
function isInt(n: string) {
  return intReg.test(n);
}

const positiveIntReg = /^(\+)?\d+$/;
function isPositiveInt(n: string) {
  return positiveIntReg.test(n);
}

const nonZeroIntReg = /^(\+)?[1-9]\d*$/;
function isNonZeroInt(n: string) {
  return nonZeroIntReg.test(n);
}

const floatReg = /^(\+|\-)?\d*\.?\d+$/;
function isFloat(n: string) {
  return floatReg.test(n);
}

const positiveFloatReg = /^(\+)?\d*\.?\d+$/;
function isPositiveFloat(n: string) {
  return floatReg.test(n);
}

const nonZeroFloatReg = /^(\+)?[1-9]\d*\.?\d+$/;
function isNonZeroFloat(n: string) {
  return nonZeroFloatReg.test(n);
}

export function intPositiveValidator(value: number | string) {
  return value == null || value === '' || isPositiveInt(value.toString()) ? '' : i18n`Expected positive integer value`;
}

export function intValidator(value: number | string) {
  return value == null || value === '' || isInt(value.toString()) ? '' : i18n`Expected integer value`;
}

export function intNonZeroValidator(value: number | string) {
  return value == null || value === '' || isNonZeroInt(value.toString()) ? '' : i18n`Expected non-zero integer value`;
}

export function floatValidator(value: number | string) {
  return value == null || value === '' || isFloat(value.toString()) ? '' : i18n`Expected float value`;
}

export function floatPositiveValidator(value: number | string) {
  return value == null || value === '' || isPositiveFloat(value.toString()) ? '' : i18n`Expected positive float value`;
}

export function floatNonZeroValidator(value: number | string) {
  return value == null || value === '' || isNonZeroFloat(value.toString()) ? '' : i18n`Expected non-zero float value`;
}

// field constructors

export function requiredField(value: any, validators?: Validator[]) {
  validators = [requiredValidator].concat(validators || []);
  return types.optional(FieldModel, { validators });
}

export function simpleField(value: any, validators?: Validator[]) {
  validators = [].concat(validators || []);
  return types.optional(FieldModel, { validators });
}




