import * as Form from '../index';
import * as chai from 'chai';
import { chaiMatchSnapshot } from 'chai-match-snapshot';
// require("mocha-snapshots");

chai.should();
chai.use(chaiMatchSnapshot);

class Test extends Form.FormState {
  @Form.requiredField required: string = null;
  @Form.field ok = '';
  @Form.field(Form.emailValidator) badEmail = 'bad';
  @Form.field(Form.emailValidator) okEmail = 'ok@ok.com';
}

it('fails', () => {
  const test = new Test();

  // works
  expect(test.validate()).toMatchSnapshot();

  // does not work
  test.validate().should.matchSnapshot();
});
