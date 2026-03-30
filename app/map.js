import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

const colors = {
  primary: '#8D6E63', secondary: '#F5EEDC', background: '#FFFFFF', text: '#5D4037', white: '#FFFFFF', accent: '#D7CCC8'
};

export default function MapScreen() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{ latitude: 25.0330, longitude: 121.5654, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      >
        <Marker coordinate={{ latitude: 25.0350, longitude: 121.5600 }}>
          <View style={styles.customMarker}><Ionicons name="cafe" size={16} color={colors.white} /></View>
        </Marker>
      </MapView>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text} style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="點擊查詢店家..." placeholderTextColor="#999" />
      </View>

      <View style={styles.catContainer}>
        <TouchableOpacity style={styles.speechBubble}>
          <Text style={styles.speechText}>今天想去哪間...？</Text>
        </TouchableOpacity>
        <View style={styles.catAvatar}><Text style={{ fontSize: 30 }}>🐱</Text></View>
      </View>

      {/* --- 手工貼上的底部導覽列 --- */}
      {/* --- 手工貼上的底部導覽列 --- */}
      <View style={styles.tabBar}>
        {/* 1. 首頁 */}
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/')}>
          <Ionicons name={pathname === '/' ? "home" : "home-outline"} size={26} color={pathname === '/' ? colors.primary : colors.accent} />
        </TouchableOpacity>
        
        {/* 2. 地圖 */}
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/map')}>
          <Ionicons name={pathname === '/map' ? "map" : "map-outline"} size={26} color={pathname === '/map' ? colors.primary : colors.accent} />
        </TouchableOpacity>

        {/* 3. 紀錄 */}
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/logbook')}>
          <Ionicons name={pathname === '/logbook' ? "book" : "book-outline"} size={26} color={pathname === '/logbook' ? colors.primary : colors.accent} />
        </TouchableOpacity>

        {/* 4. 設定 */}
        <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/setting')}>
          <Ionicons name={pathname === '/setting' ? "person" : "person-outline"} size={26} color={pathname === '/settings' ? colors.primary : colors.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 }, // 讓地圖填滿剩下的空間
  searchContainer: { position: 'absolute', top: 60, left: 20, right: 20, flexDirection: 'row', backgroundColor: colors.white, borderRadius: 30, paddingHorizontal: 15, paddingVertical: 12, alignItems: 'center', elevation: 4 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },
  customMarker: { backgroundColor: colors.primary, padding: 6, borderRadius: 15, borderWidth: 2, borderColor: colors.white },
  catContainer: { position: 'absolute', bottom: 100, left: 20, flexDirection: 'row', alignItems: 'flex-end' },
  speechBubble: { backgroundColor: colors.white, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, borderBottomLeftRadius: 0, marginBottom: 20, marginRight: -10, elevation: 3 },
  speechText: { color: colors.text, fontWeight: 'bold' },
  catAvatar: { width: 60, height: 60, backgroundColor: colors.text, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: colors.white, zIndex: 2 },
  
  // 導覽列樣式 (和首頁一模一樣)
  tabBar: { flexDirection: 'row', height: 80, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F5EEDC', paddingBottom: 20 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});