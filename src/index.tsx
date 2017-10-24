import * as React from 'react';
import * as mom from 'moment';
import { observer } from 'mobx-react';
import { style } from 'typestyle';
import i18n from 'es2015-i18n-tag';
import {
  FormComponent,
  FormGroupProps,
  Form as SUIForm,
  Label as SUILabel,
  Input as SuiInput,
  TextArea as SUITextArea,
  FormInputProps,
  FormSelectProps,
  FormRadioProps,
  FormTextAreaProps,
  FormFieldProps,
  Dropdown
} from 'semantic-ui-react';

import DatePickerView from 'react-datepicker';

import { observable, IObservableArray, action } from 'mobx';

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

export { default as gql } from 'graphql-tag';

export type Validator = (value: any, fieldName: string) => string;
export type FieldHolder = {
  [index: string]: FieldModel;
};

export interface FieldDefinition {
  key: string;
  validators?: Validator[]
}

export function getField<T extends FormState, U = any>(owner: T, key: keyof T): FieldModel<U> {
  return owner.fields[key];
}

export type FormStateListener = (owner: any, oldValue: any, newValue: any) => void;

export class FormState {

  fields: FieldMap;
  fieldDefinitions: FieldDefinition[];
  listeners: FormStateListener[] = [];
  validationMessage: string;

  constructor() {
    if (this.fieldDefinitions && this.fieldDefinitions.length) {
      this.fields = {};
      for (let field of this.fieldDefinitions) {
        this.fields[field.key] = new FieldModel(this, field.key, field.validators);
      }
    }
  }

  getPart(origin: any, key: string) {
    if (this.fields[key]) {
      return this.fields[key];
    }
    return origin[key];
  }

  checkField(listener: FormStateListener, field: any) {
    if (field instanceof FormState) {
      field.addListener(listener);
    } else if (field instanceof FieldModel) {
      field.listen(this.listeners);
    } else if (field instanceof FieldCollection) {
      field.listen(this.listeners);
    }
  }

  addListener(listener: FormStateListener) {
    this.listeners.push(listener);

    // notify all fields
    for (let fieldName of Object.getOwnPropertyNames(this)) {
      let field = this.getPart(this, fieldName);

      if (typeof field != 'string' && (Array.isArray(field) || field.length)) {
        for (let i=0; i<field.length; i++) {
          this.checkField(listener, field[i]);
        }
      } else {
        this.checkField(listener, field);
      }
    }
  }

  removeListener(listener: FormStateListener) {
    this.listeners.splice(this.listeners.indexOf(listener), 1);
  }

  // initFields(data: any) {
  //   let ownerKeys = Object.getOwnPropertyNames(this);

  //   for (let key of Object.getOwnPropertyNames(this.fields)) {
  //     if (ownerKeys.indexOf(key) === -1) {
  //       throw new Error(`Field '${key}' does not exists on owner!`);
  //     } 

  //     let field = this.fields[key];
  //     field.store = this;
  //     field.key = key; 
  //     if (data[key] != null) {
  //       field.value = data[key];
  //     } else if (field.value == null) {
  //       field.value = field.defaultValue;
  //     }
  //   }
  // }

  changeField(key: string, value: any) {
    if (this.fields[key] === undefined) {
      throw new Error(`Store has no key "${key}"`);
    }
    (this as any)[key] = value;
  }

  validate(): string {
    let valid = true;
    let fields = (this as any).fields as { [index: string]: FieldModel<any> };
    this.validationMessage = '';
    for (let key of Object.getOwnPropertyNames(fields)) {
      let field = fields[key];
      let message = field.validate();
      if (message) {
        this.validationMessage += i18n`Field '${field.key}': ${message}\n`;
      }
    }
    return this.validationMessage.trim();
  }

  isValid() {
    return this.validate() === '';
  }
}

function initField(owner: any, key: string, validators?: Validator[]) {
  if (!owner.fieldDefinitions) { owner.fieldDefinitions = [] };
  owner.fieldDefinitions.push({key, validators});
  return observable(owner, key);
}

export function field(...validators: Validator[]): any;
export function field(owner: any, key: string): any;
export function field(...params: any[]): any {
  if (params.length > 1 && typeof params[1] === 'string') {
    const owner = params[0];
    const key = params[1];
    return initField(owner, key);
  } else {
    return function (owner: any, key: string) {
      return initField(owner, key, params);
    }
  }
}

export function requiredField(...validators: Validator[]): any;
export function requiredField(owner: any, key: string): any;
export function requiredField(...params: any[]): any {
  if (params.length > 1 && typeof params[1] === 'string') {
    const owner = params[0];
    const key = params[1];
    return initField(owner, key, [requiredValidator]);
  } else {
    return function (owner: any, key: string) {
      return initField(owner, key, params.concat([requiredValidator]));
    }
  }
}

// export const baseModel = types.model(
//   'BaseModel',
//   {},
//   {
//     changeField(key: string, value: any) {
//       (this as FieldHolder)[key] = value;
//     },
//     validate(): boolean {
//       let valid = true;
//       let fields = (this as any).fields as { [index: string]: FieldModel };
//       let message = '';
//       for (let key of Object.getOwnPropertyNames(fields)) {
//         let field = fields[key];
//         valid = valid && field.isValid();
//       }
//       return valid;
//     }
//   }
// );

export interface IFormExtension {
  fields: { [index: string]: FieldModel };
  changeField: (key: string, value: any) => void;
  validate(): boolean;
}

// export function createFormStateFromModel<T, U, V>(
//   name: string,
//   model: IModelType<T, U, V>
// ): IModelType<T, U, V & IFormExtension> {
//   return types.compose(name, model, baseModel) as any;
// }

// export function createStore<T, U, V>(name: string, fields: T, functions: U): IModelType<T, U, V & IFormExtension> {
//   // return types.model(name, fields, functions) as any;
//   return types.compose(name, types.model(name, fields, functions), baseModel) as any;
// }

export class FieldCollection<T> {
  array: T[];
  fields: IObservableArray<FieldModel<T>>;
  validators: Validator[];
  listeners: FormStateListener[];

  constructor(array: T[], ...validators: Validator[]) {
    this.array = [...array];
    this.validators = validators;
    this.fields = observable([]);
    for (let i=0; i<array.length; i++) {
      this.fields.push(new FieldModel(this.array, i, validators));
    }
  }

  listen(listeners: FormStateListener[]) {
    this.listeners = listeners;
  }

  add(value: T) {
    let original: T[];
    if (this.listeners) {
      original = [...this.array];
    }

    this.array.push(value);
    this.fields.push(new FieldModel(this.array, this.array.length - 1, this.validators));

    if (this.listeners) {
      this.listeners.forEach(l => l(this, original, this.array));
    }
  }

  @action removeAt(index: number) {
    let original: T[];
    if (this.listeners) {
      original = [...this.array];
    }

    this.array.splice(index, 1);
    this.fields.splice(index, 1);

    // re-index so we have correct indices
    this.fields.forEach((c, i) => c.key = i);

    if (this.listeners) {
      this.listeners.forEach(l => l(this, original, this.array));
    }
  }

  @action remove(field: FieldModel) {
    this.removeAt(this.fields.indexOf(field));
  }
}

export class FieldModel<T = any> {
  @observable message = '';
  hasError: boolean = false;
  validators: Validator[] = [];
  store: Owner ;
  key: string | number = '';
  listeners: FormStateListener[];

  constructor(owner: Owner | T[], key: string | number, validators: Validator[] = []) {
    this.store = owner as Owner;
    this.key = key;
    this.validators = validators;

    if (owner === undefined) {
      throw new Error('Owner does not exists for key: ' + key);
    }
  }

  listen(listeners: FormStateListener[]) {
    this.listeners = listeners;
  }

  get value(): T {
    if (this.store == null) {
      throw new Error(`Store for key '${this.key}' does not exist`)
    }
    return (this.store as any)[this.key];
  }

  set value(value: T) {
    let originalValue = this.value;

    if (this.store.changeField) {
      this.store.changeField(this.key as string, value);
    } else {
      (this.store as any)[this.key] = value;
    }

    if (this.listeners) {
      this.listeners.forEach(l => l(this, originalValue, value));
    }
  }

  validate(): string {
    if (!this.validators) {
      return null;
    }
    if (this.message) {
      this.message = '';
    }
    for (let validator of this.validators) {
      let message = validator(this.value, this.key as string);
      if (message) {
        this.hasError = true;
        this.message = message;
        return message;
      }
    }
    if (this.hasError) {
      this.hasError = false;
    }
    return null;
  }

  onChange(value: T) {
    this.value = value != null ? value : '' as any;
    this.validate();
  }

  isValid() {
    return this.validate() === null;
  }
}

export interface FieldMap {
  [key: string]: FieldModel;
}

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
  for (let name of Object.getOwnPropertyNames(model)) {
    if (Array.isArray(model[name])) {
      for (let i in model[name]) {
        let message = validateField(model[name][i]);
        if (message) {
          return message;
        }
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

export interface Owner {
  // [key: string]: any;
  changeField?(key: string, value: any): void;
  fields?: { [index: string]: FieldModel };
}

export function isValid<T extends Owner>(store: T, key?: keyof T) {
  if (!key) {
    return validate(store);
  }
  return (store as any).fields[key].isValid();
}

export function bind<T extends Owner>(store: T, bind: keyof T, ...validators: Validator[]) {
  const typed = store as any;
  if (!typed.fields) {
    typed.fields = {};
  }
  if (!typed.changeField) {
    throw new Error(`Incorrect owner, it needs to define 'changeField' method`);
  }
  if (!typed.fields[bind]) {
    typed.fields[bind] = new FieldModel(store, bind, validators);
  }
  return typed.fields[bind];
}

export interface FormElement {
  owner?: FieldModel;
  store?: Owner;
  bind?: string;
  validators?: Validator[];
}

export class FormControl<P, T> extends React.Component<P & FormElement, {}> {
  owner: FieldModel;

  constructor(props: FormElement) {
    super();

    if (props.owner) {
      this.owner = props.owner;
    } else {
      this.owner = bind(props.store, props.bind as any, ...props.validators);
    }
    // if (!props.owner) {
    //   console.error(`Component with following props needs to define owner`);
    //   console.error(props);
    //   throw new Error(`Component '${props['name']}' needs to define owner`);
    // }
  }

  componentWillUpdate(nextProps: Readonly<P & FormElement>) {
    this.owner = nextProps.owner;
  }

  update: any = (_e: React.SyntheticEvent<any>, formEvent: FormEvent) => {
    // this.props.owner.value = formEvent.value;
    this.owner.onChange(formEvent.value);
  };

  validate = () => {
    this.owner.validate();
  }

  get value() {
    return this.owner.value;
  }
}

interface ErrorProps {
  owner: FieldModel;
}
const ErrorLabel = ({ owner }: ErrorProps) =>
  <SUILabel color="red" className={errorStyle}>
    {owner.message}
  </SUILabel>;

@observer
export class Input extends FormControl<FormInputProps, any> {
  render() {
    // console.log('Rendering: ' + this.value);
    let { label, className, owner, ...rest } = this.props;
    return (
      <Form.Field error={this.owner.hasError} width={this.props.width} className={this.props.className}>
        {label &&
          <label>
            {label}
          </label>}
        <SuiInput onChange={this.update} onBlur={this.validate} value={this.value} placeholder={this.props.placeholder || label} {...rest} />
        {this.owner.hasError && <ErrorLabel owner={this.owner} />}
      </Form.Field>
    );
  }
}

Input.displayName = 'MobxInput';

@observer
export class TextArea extends FormControl<FormTextAreaProps, {}> {
  render() {
    let { label, className, owner, ...rest } = this.props;
    return (
      <Form.Field error={this.owner.hasError} width={this.props.width} className={className}>
        {label &&
          <label>
            {label}
          </label>}
        <SUITextArea
          onChange={this.update}
          value={this.value}
          placeholder={this.props.placeholder || label}
          {...rest}
        />
        {this.owner.hasError && <ErrorLabel owner={this.owner} />}
      </Form.Field>
    );
  }
}

TextArea.displayName = 'MobxBoundTextArea';

export interface Props {
  format?: string;
  onChange?(date: Date): void;
}

let id_helper = 0;
function randomID() {
  return (Date.now() + id_helper++).toString();
}

class DateControl extends React.Component<any, any> {
  focus() {
    /**/
  }
  clear = (e: React.KeyboardEvent<any>) => {
    if (e.keyCode === 8 || e.keyCode === 46) {
      this.props.clear();
    }
  };
  render() {
    const { clear, ...rest } = this.props;
    return <SuiInput {...rest} icon="calendar" readOnly={true} onKeyDown={this.clear} />;
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
export class DatePicker extends FormControl<FormInputProps & DateProps, {}> {
  static defaultProps = {
    format: 'DD MMM YYYY'
  };
  prohibit() {
    return false;
  }
  clear() {
    this.owner.value = null;
  }
  updateDate = (moment: any) => {
    this.update(null, { value: moment.toDate() });
  };
  render() {
    const { format, placeholder, owner, ...rest } = this.props as any;
    const moment = require('moment');
    return (
      <div className="three wide field">
        {this.props.label &&
          <label>
            {this.props.label}
          </label>}
        <DatePickerView
          {...rest}
          customInput={<DateControl clear={this.clear.bind(this)} />}
          onChange={this.updateDate}
          dateFormat={format}
          placeholderText={placeholder}
          selected={this.owner.value ? moment(this.owner.value) : null}
        />
      </div>
    );
  }
}

DatePicker.displayName = 'DatePicker';

export interface LabelProps {
  label: string;
}
export const Label = (props: FormFieldProps & LabelProps) => {
  const { children, ...rest } = props;
  return (
    <Form.Field {...rest}>
      <label>
        {props.label}
      </label>
    </Form.Field>
  );
};

Label.displayName = 'MobxBoundLabel';

@observer
export class Select extends FormControl<FormSelectProps, {}> {
  updateSelect = (_e: any, selectValue: { name: string; value: any }) => {
    // this.props.owner.value = selectValue.value;
    this.owner.onChange(selectValue.value);
  };

  render() {
    let { label, className, owner, options = [], ...rest } = this.props;

    return (
      <Form.Field error={this.owner.hasError} width={this.props.width} className={this.props.className}>
        {label &&
          <label>
            {label}
          </label>}
        <Dropdown onChange={this.updateSelect as any} options={options} value={this.value} {...rest} selection={true} />
        {this.owner.hasError && <ErrorLabel owner={this.owner} />}
      </Form.Field>
    );
  }
}

Select.displayName = 'MobxBoundSelect';

@observer
export class Radio extends FormControl<FormRadioProps, {}> {
  update = (e: React.SyntheticEvent<HTMLInputElement>) => {
    // this.props.owner.value = formEvent.checked;
    this.owner.onChange(e.currentTarget.checked);
  };

  render() {
    let { label, className, owner, ...rest } = this.props;
    return <Form.Radio onChange={this.update} value={'radio'} {...rest} />;
  }
}

Radio.displayName = 'MobxBoundRadio';

@observer
export class Checkbox extends FormControl<FormRadioProps, {}> {
  update = (e: React.SyntheticEvent<HTMLInputElement>) => {
    // this.props.owner.value = formEvent.checked;
    this.owner.onChange(e.currentTarget.checked);
  };

  render() {
    let { owner, ...rest } = this.props;
    let checked = this.owner.value === 'true';
    return <Form.Checkbox onChange={this.update} value={'checkbox'} checked={checked} {...rest} />;
  }
}

Checkbox.displayName = 'MobxBoundCheckbox';

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

const emailReg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
function isEmail(n: string) {
  return emailReg.test(n);
}

export function emailValidator(value: string) {
  return value == null || value === '' || isEmail(value) ? '' : i18n`Email has incorrect format!`;
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

export function lengthValidator(length: number, message?: string) {
  return (value: number | string) => {
    return value == null || value === '' || value.toString().length >= length
      ? ''
      : message || i18n`Too short! Minimum ${length} characters`;
  };
}

export function equalityValidator(comparer: () => string | string, message?: string) {
  return (value: string) => {
    let val1 = value ? value.toString() : value.toString();
    let val2 = typeof comparer === 'function' ? comparer() : comparer;

    return val1 === val2 ? '' : message || i18n`Value ${val1} does not match ${val2}`;
  };
}
