import React, {useEffect} from 'react';
import {ThemeProvider, createGlobalStyle} from 'styled-components';
import theme from './theme';
import {BrowserRouter} from 'react-router-dom';
import {PageHeader} from './components/PageHeader';
import {Router} from './router';
import {RecoilRoot, useRecoilSnapshot} from 'recoil';
import {PeerRoot} from './services/PeerRoot';
import {StreamWatcher} from './services/StreamWatcher';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    background: #efefef;
    font-family: 'Open Sans', Helvetica, Sans-Serif;
  }

  div#root {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
  }
`;

function DebugObserver(): React.ReactElement {
    const snapshot = useRecoilSnapshot();
    useEffect(() => {
      console.log('The following atoms were modified:');
      for (const node of snapshot.getNodes_UNSTABLE({isModified: true})) {
        console.log(node.key, snapshot.getLoadable(node));
      }
    }, [snapshot]);
  
    return null;
  }

export default function App() {
	return (
        <ThemeProvider theme={theme}>
            <GlobalStyle />
            <React.Suspense fallback="Loading...">
                <RecoilRoot>
                    <PeerRoot />
                    <StreamWatcher />
                    <BrowserRouter>
                        <PageHeader />
                        <Router />
                    </BrowserRouter>
                </RecoilRoot>
            </React.Suspense>
        </ThemeProvider>
    );
}
