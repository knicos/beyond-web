import React from 'react';
import { Formik, Field } from 'formik';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { refreshSession } from '../../recoil/selectors';
import { Form, ButtonBar } from '../../components/Form';
import { LoginContainer } from './styledComponents';

async function login(username: string, password: string) {
  try {
    const res = await axios.post('/v1/oauth2/token', {
      username,
      password,
      grant_type: 'password',
      client_id: '614d906bf0d4d418b719b9a8',
      client_secret: 'none',
    });
    console.log('RES', res);
  } catch(err) {

  }
}

export function Login() {
  const refresh = refreshSession();
  let history = useHistory();

  return (
    <Formik
       initialValues={{ username: '', password: '' }}
       onSubmit={async (values) => {
          await login(values.username, values.password);
          refresh();
          history.push(process.env.ASSET_PATH);
       }}
    >
      {({ isSubmitting }) => (
        <LoginContainer>
          <Form id="loginform">
            <fieldset>
              <legend>FT-Lab Login</legend>
              <label htmlFor="username">Username</label>
              <Field type="text" name="username" />
              <label htmlFor="password">Password</label>
              <Field type="password" name="password" />
            </fieldset>
            <ButtonBar>
              <button type="submit" className="primary" disabled={isSubmitting}>
                Login
              </button>
            </ButtonBar>
          </Form>
        </LoginContainer>
      )}
    </Formik>
  );
}
