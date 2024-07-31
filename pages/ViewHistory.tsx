import React, { useState } from 'react';
import { ScrollView, Text, TextInput, Button, StyleSheet, View, Modal, FlatList, TouchableOpacity } from 'react-native';
import axios from 'axios';
import DatePicker from 'react-native-date-picker';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { getSeoulDate } from '../utils/utilfuncs';
import Theme from '../constants/Theme';
import HistoryOnMap from '../components/historyOnMap';
import { setRecords, setStartDate, setEndDate } from '../redux/stateSlice';

const ViewHistory: React.FC = () => {
  const [deviceEui, setDeviceEui] = useState<string>('');
  const [isModalVisible, setModalVisible] = useState<boolean>(false);
  const [deviceListModalVisible, setDeviceListModalVisible] = useState<boolean>(false);
  const [deviceEuiList, setDeviceEuiList] = useState<string[]>([]);
  const [showOnMap, setShowOnMap] = useState<boolean>(false);

  const user = useSelector((state: RootState) => state.auth.user);
  const records = useSelector((state:RootState) => state.auth.records);
  const startDate = new Date(useSelector((state: RootState) => state.auth.startDate));
  const endDate = new Date(useSelector((state: RootState) => state.auth.endDate));

  const dispatch = useDispatch();

  const fetchRecords = async () => {
    try {
      if (deviceEui){
        const response = await axios.get('http://14.50.159.2:9987/get_device_data', {
          params: {
            owner_uid: user?.user.id,
            device_eui: deviceEui,
            start_datetime: startDate,
            end_datetime: endDate
          },
        });
        dispatch(setRecords(response.data));
        setModalVisible(true); // Show the modal
      }else {
        console.log("check device")
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDeviceEuiList = async () => {
    try {
      const response = await axios.get('http://14.50.159.2:9987/get_user_devices', {
        params: {
          owner_uid: user?.user.id,
        },
      });
      setDeviceEuiList(response.data.map((device: { dev_eui: string }) => device.dev_eui));
      setDeviceListModalVisible(true); // Show the device list modal
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Select date and device EUI</Text>

      <Text style={styles.label}>Start Date:</Text>
      <DatePicker style={{backgroundColor:Theme.COLORS.BLACK}} date={startDate} onDateChange={(e)=>dispatch(setStartDate(e.toISOString()))} mode="datetime" timeZoneOffsetInMinutes={0} minuteInterval={10} />
      <Text style={styles.label}>End Date:</Text>
      <DatePicker style={{backgroundColor:Theme.COLORS.BLACK}} date={endDate} onDateChange={(e)=>dispatch(setEndDate(e.toISOString()))} mode="datetime" timeZoneOffsetInMinutes={0} minuteInterval={10} />

      <Text style={styles.label}>Device 선택</Text>
      <View style={styles.row}>
        <Text style={styles.input}>{deviceEui}</Text>
        <Button title="찾아보기" onPress={fetchDeviceEuiList} color={Theme.COLORS.BUTTON_COLOR}/>
      </View>

      <Button title="Fetch History" onPress={fetchRecords} color={Theme.COLORS.PRIMARY}/>

      <Modal visible={isModalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Device Usage History</Text>
          {
            showOnMap ? (
              <Button title="Close" onPress={() => setShowOnMap(false)} color={Theme.COLORS.GRADIENT_START}/>
            ):(
              <Button title="Show on Map" onPress={() => setShowOnMap(true)} color={Theme.COLORS.GRADIENT_START}/>
            )
          }
          {
            showOnMap? (
              <HistoryOnMap/>
            ):(
              <>
                <FlatList style={styles.flatlist}
                  data={records}
                  keyExtractor={(item, index) => `record-${index}`}
                  renderItem={({ item }) => (
                    <View style={styles.recordRow}>
                      <Text style={styles.recordCell}>{item.created_at}</Text>
                      <Text style={styles.recordCell}>{item.parsed_string.LATITUDE}, {item.parsed_string.LONGITUDE}</Text>
                    </View>
                  )}
                />
                <Button title="Close" onPress={() => setModalVisible(false)} color={Theme.COLORS.LABEL}/>
              </>
            )
          }
          
        </View>
      </Modal>

      <Modal visible={deviceListModalVisible} animationType="slide" onRequestClose={() => setDeviceListModalVisible(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Device EUI</Text>
          <FlatList
            data={deviceEuiList}
            keyExtractor={(item, index) => `device-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => {
                setDeviceEui(item);
                setDeviceListModalVisible(false);
              }}>
                <View style={styles.deviceRow}>
                  <Text style={styles.deviceCell}>{item}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
          <Button title="Close" onPress={() => setDeviceListModalVisible(false)} color={Theme.COLORS.LABEL}/>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    paddingLeft: 30,
    paddingRight: 30,
    paddingBottom: 30,
    backgroundColor: Theme.COLORS.BLACK
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.COLORS.WHITE
  },
  label: {
    fontSize: 18,
    marginTop: 10,
    color: Theme.COLORS.WHITE
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginTop: 10,
    marginBottom: 20,
    marginRight: 10,
    width: '70%',
    color: Theme.COLORS.WHITE
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    paddingTop: 20,
    backgroundColor:Theme.COLORS.BLACK
  },
  flatlist: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  modalTitle: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 10,
    color: Theme.COLORS.WHITE
  },
  recordRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recordCell: {
    flex: 1,
    textAlign: 'center',
    color: Theme.COLORS.WHITE
  },
  deviceRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  deviceCell: {
    flex: 1,
    textAlign: 'center',
    color: Theme.COLORS.WHITE
  },
});


export default ViewHistory;
