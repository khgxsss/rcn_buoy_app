/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { Provider } from 'react-redux';
import { store } from './redux/store'; // ������� ��θ� �ùٸ��� �������ּ���

const ReduxApp = () => (
    <Provider store={store}>
      <App />
    </Provider>
  );
  
  AppRegistry.registerComponent(appName, () => ReduxApp);