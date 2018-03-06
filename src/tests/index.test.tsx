import * as Form from "../index";

class Test extends Form.FormState {
  @Form.requiredField required: string = null;
  @Form.field ok = ''
  @Form.field(Form.emailValidator) badEmail = 'bad';
  @Form.field(Form.emailValidator) okEmail = 'ok@ok.com';
}

it('fails', () => {
  const test = new Test();
  expect(test.validate()).toMatchSnapshot();
})
