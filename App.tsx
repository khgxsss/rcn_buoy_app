import React, { useState, useEffect } from 'react';
import {
  Button,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
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
import { setDeviceData } from './redux/deviceSlice';
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

  // MQTT Ŭ���̾�Ʈ �ʱ�ȭ �� ����
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
    initializeMQTT();

    // Ŭ���̾�Ʈ ���� �� �ɼ� ����
    const client = new Paho.MQTT.Client('ws://14.50.159.2:1884/', 'client2');

    // ���� �ν�Ʈ �� ó��
    client.onConnectionLost = (error: { errorCode: number, errorMessage: string,invocationContext:string }) => {
      if (error.errorCode !== 0) {
        console.log('onConnectionLost:' + error.errorMessage);
        if (error.errorCode ===7){
          console.log("Need Wifi or Cellular activated")
        }
        reconnect(client);  // ���� ���� �� �翬�� �õ�
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
            reconnect(client);  // ��������� �翬�� �õ�
          },
          useSSL: false
        });
      }, 2000);  // 2�� �Ŀ� �翬�� �õ�
    };

    // �޽��� ���� �� ó��
    client.onMessageArrived = (message) => {
      const newDeviceData = JSON.parse(message.payloadString); // �޽����� ��ü��� ����
      const devEui = newDeviceData.dev_eui;
      console.log(newDeviceData);
    
      // Set device coordinates
      const parsedString = newDeviceData.parsed_string;
      let deviceCoord = newDeviceData.deviceCoord;
    
      // ��ǥ�� 0�� �ƴ� ��쿡�� ������Ʈ
      if (parseFloat(parsedString.LATITUDE) !== 0 && parseFloat(parsedString.LONGITUDE) !== 0) {
        deviceCoord = {
          latitude: parseFloat(parsedString.LATITUDE),
          longitude: parseFloat(parsedString.LONGITUDE),
        };
      }
    
      const updatedDeviceData = {
        ...newDeviceData,
        deviceCoord, // ��ǥ�� 0�� �ƴ� ��쿡�� ������Ʈ
      };
    
      const existingDeviceIndex = fetchedWData.findIndex(device => device.dev_eui === devEui);
    
      if (existingDeviceIndex !== -1) {
        // ���� dev_eui�� �ִ� ��� �ֽ�ȭ
        const updatedDeviceList = [...fetchedWData];
        updatedDeviceList[existingDeviceIndex] = updatedDeviceData;
        dispatch(setFetchedWData(updatedDeviceList));
      } else {
        // ���ο� dev_eui�� �ִ� ��� ����Ʈ�� �߰�
        dispatch(setFetchedWData([...fetchedWData, updatedDeviceData]));
      }
    };
    

    // MQTT ������ ����
    client.connect({ 
      onSuccess: () => {
        console.log('Connected');
        console.log(`v3/rcnapp1@ttn/devices/${user?.user.id}/up`)
        client.subscribe(`v3/rcnapp1@ttn/devices/${user?.user.id}/up`);
      },
      useSSL: false,
      onFailure: (error:{errorCode:number,errorMessage:string,invocationContext:string}) => {
        console.log('Connection failed:', error.errorMessage);
        if (error.errorCode ===7){
          console.log("Need Wifi or Cellular activated")
        }
        reconnect(client);  // ���� ���� �� �翬�� �õ�
      }
    });

    return () => {
      if (client.isConnected()) {
        client.disconnect();
      }
    };
  }, []);

  // wifi �� cellular on off ����
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

    // ������Ʈ �𸶿�Ʈ �� �̺�Ʈ ������ ����
    return () => {
        unsubscribe();
    };
  }, []);

  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
        // iOS ���� ȭ������ �̵�
        Linking.openURL('app-settings:');
    } else {
      // �ȵ���̵� Wi-Fi ���� ȭ������ �̵�
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
        <Tab.Navigator>
          <Tab.Screen name="Device" component={Home} options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="home" color={color} size={size} />
              ),
            }}/>
          <Tab.Screen name="Map" component={MapComponent} options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="map" color={color} size={size} />
            ),
          }}/>
          {/* <Tab.Screen name="View History" component={ViewHistory} options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="history" color={color} size={size} />
            ),
          }}/> */}
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
