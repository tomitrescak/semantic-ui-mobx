import 'luis/dist/client/config/interfaces';
import 'react-datepicker/dist/react-datepicker.css';

import * as React from 'react';

import { renderLuis } from 'luis';
import { style } from 'typestyle'; 

import { FormState, requiredField, Input, Form, TextArea, DatePicker, Select, Radio, Checkbox } from '../index';


class State extends FormState {
  @requiredField inputField = '';
}

storyOf(
  'Input',
  {
    componentWithData() {
      const state = new State();
      return <Form><Input owner={state.fields.inputField} label="My Label" /></Form>;
    }
  }
);

storyOf(
  'TextArea',
  {
    componentWithData() {
      const state = new State();
      return <Form><TextArea owner={state.fields.inputField} label="My Label" /></Form>;
    }
  }
);

storyOf(
  'DatePicker',
  {
    componentWithData() {
      const state = new State();
      return <Form>
        <DatePicker fluid owner={state.fields.inputField} label="My Label" />
        <DatePicker fluid owner={state.fields.inputField} label="My Label" />
        <DatePicker fluid owner={state.fields.inputField} label="My Label" />
      </Form>;
    }
  }
);

storyOf(
  'Select',
  {
    componentWithData() {
      const state = new State();
      return <Form><Select owner={state.fields.inputField} label="My Label" options={[{text: 'Value 1', value: '0'}, {text: 'Value 2', value: '1'}]} /></Form>;
    }
  }
);

storyOf(
  'Radio',
  {
    componentWithData() {
      const state = new State();
      return <Form>
        <Radio owner={state.fields.inputField} value="1" label="My Label 1" />
        <Radio owner={state.fields.inputField} value="2" label="My Label 2" />
        <Radio owner={state.fields.inputField} value="3" label="My Label 3" />
        <Radio owner={state.fields.inputField} value="4" label="My Label 4" />
      </Form>;
    }
  }
);

storyOf(
  'Checkbox',
  {
    componentWithData() {
      const state = new State();
      return <Form><Checkbox owner={state.fields.inputField} label="My Label" /></Form>;
    }
  }
);

renderLuis();
