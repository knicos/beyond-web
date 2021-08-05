import React from 'react';
import {ThemeProvider, createGlobalStyle} from 'styled-components';
import theme from './theme';
import {BrowserRouter} from 'react-router-dom';
import {PageHeader} from './components/PageHeader';
import {Router} from './router';
import {RecoilRoot} from 'recoil';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    background: #efefef;
    font-family: 'Open Sans', Helvetica, Sans-Serif;
  }
`;

export default function App() {
	return (
        <ThemeProvider theme={theme}>
            <GlobalStyle />
            <RecoilRoot>
                <BrowserRouter>
                    <PageHeader />
                    <Router />
                </BrowserRouter>
            </RecoilRoot>
        </ThemeProvider>
    );
}
