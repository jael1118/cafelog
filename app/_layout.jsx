import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Image, StyleSheet, StatusBar, Text } from 'react-native';

export default function RootLayout() {
  const [isShowSplash, setIsShowSplash] = useState(true);

  // 🌟 啟動畫面邏輯移到這裡：整個 App 週期只會執行這一次
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 1. 顯示啟動畫面 (使用你的圖片)
  if (isShowSplash) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar hidden={true} />
        <Image 
          source={require('../assets/icon.png')} 
          style={styles.splashImage} 
          resizeMode="contain" 
        />
        <Text style={styles.splashText}>Cafe Log</Text>
      </View>
    );
  }

  // 2. 正式進入 Stack 導航
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F8F8FC' },
        // 🌟 預設動畫：從右滑入 (給日期細節頁、紀錄詳情頁用)
        animation: 'slide_from_right', 
      }}
    >
      {/* 🌟 設定「底部按鈕」對應的分頁：切換時「不顯示動畫」 */}
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="map" options={{ animation: 'none' }} />
      <Stack.Screen name="setting" options={{ animation: 'none' }} />
      
      {/* 🌟 針對有叉叉的頁面：設定從下面上來 */}
      <Stack.Screen 
        name="addlog" 
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }} 
      />

      {/* 💡 備註：logbook 如果你點日期要滑入，這裡就不要設定 animation: 'none' */}
    </Stack>
  );
}

const styles = StyleSheet.create({
  splashContainer: { flex: 1, backgroundColor: '#F8F8FC', justifyContent: 'center', alignItems: 'center' },
  splashImage: { width: 160, height: 160, marginBottom: 20 },
  splashText: { fontSize: 24, fontWeight: '900', color: '#9B7ED9', letterSpacing: 2 },
});