import React, { useState, useEffect } from 'react';
import {
  Button,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
  LogBox
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import init from 'react_native_mqtt';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from './pages/Home';
// import ViewHistory from './pages/ViewHistory';
import { useDispatch, useSelector } from 'react-redux';
import { setCellularOn, setFetchedWData, setUser, setWifiOn } from './redux/stateSlice';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MapComponent from './pages/MapComponent';
import { updateFirebaseStorage } from './firebase/functions';
import NetInfo from "@react-native-community/netinfo";
import { RootState } from './redux/store';
import IntentLauncher from 'react-native-intent-launcher-fork1';
import Theme from './constants/Theme';
import LoginComponent from './pages/Login';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import ViewHistory from './pages/ViewHistory';

LogBox.ignoreLogs([
  /.*defaultProps.*function components/
]);

const Tab = createBottomTabNavigator();

const App: React.FC = () => {

  const [isModalVisible, setModalVisible] = React.useState(false);
  const isWifiModalVisible = useSelector((state:RootState) => state.auth.isWifiModalVisible);

  // Redux
  const user = useSelector((state:RootState) => state.auth.user);
  const fetchedWData = useSelector((state: RootState) => state.auth.fetchedWData);

  
  const dispatch = useDispatch();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '425037074427-4m6osdig570m5rfcqerftva6df04r8r9.apps.googleusercontent.com',
    });
  }, []);

  // MQTT 클라이언트 초기화 및 설정
  const initializeMQTT = () => {
    init({
      size: 10000,
      storageBackend: AsyncStorage,
      defaultExpires: 1000 * 3600 * 24,
      enableCache: true,
      reconnect: true,
      sync: {},
    });
  };

  useEffect(() => {
    if (user?.idToken) {
      initializeMQTT();
  
      // 클라이언트 생성 및 옵션 설정
      const client = new Paho.MQTT.Client('ws://14.50.159.2:1884/', 'client2');
  
      // 연결 로스트 시 처리
      client.onConnectionLost = (error: { errorCode: number, errorMessage: string, invocationContext: string }) => {
        if (error.errorCode !== 0) {
          console.log('onConnectionLost:' + error.errorMessage);
          if (error.errorCode === 7) {
            console.log("Need Wifi or Cellular activated")
          }
          reconnect(client);  // 연결 실패 시 재연결 시도
        }
      };
  
      const reconnect = (client: { connect: (arg0: { onSuccess: () => void; onFailure: (reconnectError: any) => void; useSSL: boolean; }) => void; subscribe: (arg0: string) => void; }) => {
        setTimeout(() => {
          console.log("Attempting to reconnect...");
          client.connect({
            onSuccess: () => {
              console.log('Reconnected successfully.');
              console.log(`v3/rcnapp1@ttn/devices/${user?.user.id}/up`)
              client.subscribe(`v3/rcnapp1@ttn/devices/${user?.user.id}/up`);
            },
            onFailure: reconnectError => {
              console.log('Reconnection failed:', reconnectError.errorMessage);
              reconnect(client);  // 재귀적으로 재연결 시도
            },
            useSSL: false
          });
        }, 2000);  // 2초 후에 재연결 시도
      };
  
      // 메시지 수신 시 처리
      client.onMessageArrived = (message) => {
        const newDeviceData = JSON.parse(message.payloadString);
        const devEui = newDeviceData.dev_eui;
        console.log(devEui);
  
        const parsedString = newDeviceData.parsed_string;
        let deviceCoord;
  
        if (parseFloat(parsedString.LATITUDE) !== 0 && parseFloat(parsedString.LONGITUDE) !== 0) {
          deviceCoord = {
            latitude: parseFloat(parsedString.LATITUDE),
            longitude: parseFloat(parsedString.LONGITUDE),
          };
          const updatedDeviceData = {
            ...newDeviceData,
            deviceCoord,
          };
  
          dispatch((dispatch, getState) => {
            const fetchedWData = getState().auth.fetchedWData;
            const existingDeviceIndex = fetchedWData.findIndex(device => device.dev_eui === devEui);
            console.log("EXIST?");
            console.log(existingDeviceIndex);
  
            let updatedDeviceList;
            if (existingDeviceIndex !== -1) {
              updatedDeviceList = [...fetchedWData];
              updatedDeviceList[existingDeviceIndex] = updatedDeviceData;
            } else {
              updatedDeviceList = [...fetchedWData, updatedDeviceData];
            }
  
            dispatch(setFetchedWData(updatedDeviceList));
          });
        }
      };
  
  
      // MQTT 서버에 연결
      client.connect({
        onSuccess: () => {
          console.log('Connected');
          console.log(`v3/rcnapp1@ttn/devices/${user?.user.id}/up`)
          client.subscribe(`v3/rcnapp1@ttn/devices/${user?.user.id}/up`);
        },
        useSSL: false,
        onFailure: (error: { errorCode: number, errorMessage: string, invocationContext: string }) => {
          console.log('Connection failed:', error.errorMessage);
          if (error.errorCode === 7) {
            console.log("Need Wifi or Cellular activated")
          }
          reconnect(client);  // 연결 실패 시 재연결 시도
        }
      });
  
      return () => {
        if (client.isConnected()) {
          client.disconnect();
        }
      };
    }
  }, [user]); // user 값이 변경될 때만 실행

  // wifi 와 cellular on off 감지
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isInternetReachable) {
        setModalVisible(false);
        switch (state.type) {
          case 'wifi':
            dispatch(setWifiOn(true))
            dispatch(setCellularOn(false))
            break
          case 'cellular':
            dispatch(setCellularOn(true))
            dispatch(setWifiOn(false))
            break
          default:
            dispatch(setCellularOn(false))
            dispatch(setWifiOn(false))
            break;
        }
      }else {
        dispatch(setWifiOn(false))
        dispatch(setCellularOn(false))
        setModalVisible(true)
      }
      if (isWifiModalVisible) {
        if (state.type !== 'wifi') {
          setModalVisible(true);
        }else {
          setModalVisible(false)
        }
      }
    });

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
        unsubscribe();
    };
  }, []);

  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
        // iOS 설정 화면으로 이동
        Linking.openURL('app-settings:');
    } else {
      // 안드로이드 Wi-Fi 설정 화면으로 이동
      IntentLauncher.startActivity({
        action: 'android.settings.WIFI_SETTINGS',
        category: '',
        data: ''
      });
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        dispatch(setUser(JSON.parse(storedUser)));
        await updateFirebaseStorage(JSON.parse(storedUser), dispatch);
      }
    };
  
    loadUser();
  }, []);  

  return (
    <>
      <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
      >
          <View style={{ width:'100%', height:'100%', position:'absolute', justifyContent: 'center', alignItems: 'center', backgroundColor:'rgba(0,0,0,0.5)' }}>
              <View style={{ width: 300, padding: 20, backgroundColor: 'white', borderRadius: 10 }}>
                  <Text>{!isWifiModalVisible ? 'Needs Internet Connection':'Needs wifi Connection'}</Text>
                  <Text>{!isWifiModalVisible ? 'Please turn on Cellular data or Wifi.':'Please turn on Wifi.'}{'\n'}</Text>
                  <Button title="Go to Settings" onPress={handleOpenSettings} color={Theme.COLORS.BUTTON_COLOR}/>
              </View>
          </View>
      </Modal>
      <LoginComponent/>
      <NavigationContainer>
        <Tab.Navigator initialRouteName='Map' screenOptions={()=>({
          tabBarActiveTintColor:Theme.COLORS.GRADIENT_END,
          headerTitleStyle: {color:'#ffffff'},
          headerStyle:{backgroundColor:Theme.COLORS.GRADIENT_START}
        })}>
          <Tab.Screen name="Live Devices" component={Home} options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="list" color={color} size={size} />
              ),
            }}/>
          <Tab.Screen name="Map" component={MapComponent} options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="map" color={color} size={size} />
            ),
          }}/>
          <Tab.Screen name="View History" component={ViewHistory} options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="history" color={color} size={size} />
            ),
          }}/>
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
