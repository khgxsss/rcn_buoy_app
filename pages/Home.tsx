import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Image,
  FlatList,
  Dimensions,
  useWindowDimensions // Dimensions API ����Ʈ
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

const buoyOnImagePath = require('../assets/img/buoy.png');

const Home: React.FC = () => {
  const fetchedWData = useSelector((state: RootState) => state.auth.fetchedWData);
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    // backgroundColor: isDarkMode ? "#000000" : "#ffffff",
    backgroundColor: "#ffffff",
    flex:1
  };
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  // useWindowDimensions ���� ����Ͽ� ȭ�� ũ�� ��������
  const { width, height } = useWindowDimensions();

  // ȭ�� �ʺ� ���̺��� ũ�� ���� ���, �ƴϸ� ���� ���
  const numColumns = width > height ? 3 : 2;
  const flatListKey = numColumns.toString();

  useEffect(() => {
    // numColumns�� ����� ������ imageSize�� ������Ʈ�մϴ�.
    const newWidth = width / numColumns - 10 * 2;
    setImageSize({ width: newWidth, height: newWidth });
  }, [numColumns]);

  const renderItem = ({ item }) => (
    <View style={[styles.itemContainer, { width: imageSize.width, height: imageSize.height }]}>
      <Image
        source={buoyOnImagePath}
        style={[styles.buoyImage, { width: imageSize.width, height: imageSize.height }]}
        resizeMode="contain"
      />
      <Text style={[styles.deviceIdText, { zIndex: 1 }]}>{item.dev_eui.substring(12)}</Text>
      <Text style={[styles.deviceText, { zIndex: 1 }]}>{item.received_at}</Text>
      <Text style={[styles.dataText, { zIndex: 1 }]}>{'<Location>\n'}{`${item.parsed_string.LATITUDE}\n${item.parsed_string.LONGITUDE}`}</Text>
    </View>
  );

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={backgroundStyle.backgroundColor} />
      <FlatList
        data={fetchedWData}
        renderItem={renderItem}
        keyExtractor={item => item.dev_eui}
        key={flatListKey}
        numColumns={numColumns}
        contentContainerStyle={styles.listContentContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  listContentContainer: {
    alignItems: 'center',
  },
  itemContainer: {
    margin: 10,
    position: 'relative', // �ڽ� ��ҿ� absolute �������� ����ϵ��� ��
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  deviceIdText: {
    fontSize: 24,
    color: '#333333',
    fontWeight: 'bold',
    marginBottom: 8,
    zIndex: 1, // �̹����� ������� ����
    position: 'absolute', // ��ġ�� ���������� ����
    top: 10, // �̹��� ��ܿ��������� ����,
    backgroundColor:'#f0f0f0',
    opacity: 0.7
  },
  deviceText: {
    color: '#333333',
    marginBottom: 8,
    zIndex: 1,
    fontWeight: 'bold',
    position: 'absolute',
    fontSize: 14,
    backgroundColor:'#f0f0f0',
    opacity: 0.7
  },
  dataText: {
    color: '#333333',
    marginBottom: 8,
    zIndex: 1,
    fontWeight: 'bold',
    position: 'absolute',
    bottom: 10, // �̹��� �ϴܿ��������� ����
    fontSize: 14,
    backgroundColor:'#f0f0f0',
    opacity: 0.7
  },
  buoyImage: {
    position: 'absolute', // ��濡 �̹����� �򸮵��� ����
    top: 0,
    left: 0,
    zIndex: 0, // �ٸ� ��Һ��� �ڿ� ������ ����
  }
});

export default Home;
