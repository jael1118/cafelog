import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Keyboard, TouchableWithoutFeedback, ActivityIndicator, Alert, Image, Linking, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import * as Location from 'expo-location';

const colors = {
  primary: '#8D6E63', secondary: '#F5EEDC', background: '#FFFFFF', text: '#5D4037', white: '#FFFFFF', accent: '#D7CCC8'
};

const placeholderImages = [
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=300&auto=format&fit=crop'
];

let globalSavedRegion = null;
let globalSavedCafes = [];

export default function MapScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const mapRef = useRef(null);

  const [allCafes, setAllCafes] = useState(globalSavedCafes);
  const [displayedCafes, setDisplayedCafes] = useState(globalSavedCafes);
  const [userRegion, setUserRegion] = useState(globalSavedRegion);
  const [currentMapRegion, setCurrentMapRegion] = useState(globalSavedRegion); 
  
  const [isLoading, setIsLoading] = useState(!globalSavedRegion); 
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [showSearchHereBtn, setShowSearchHereBtn] = useState(false); 
  const [isFirstLoad, setIsFirstLoad] = useState(true); 

  const excludeKeywords = ['50嵐', '清心', '麻古', '可不可', '迷客夏', '茶湯會', '萬波', '得正', '八曜', '手搖', '茶飲', 'TEA', 'Tea', '大苑子', '龜記', 'CoCo', '鮮茶道'];

  useEffect(() => {
    if (globalSavedRegion) {
      return; 
    }

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('權限不足', '請開啟定位權限以顯示所在地點的咖啡廳');
        const defaultLoc = { latitude: 25.0330, longitude: 121.5654, latitudeDelta: 0.02, longitudeDelta: 0.02 };
        globalSavedRegion = defaultLoc; 
        setUserRegion(defaultLoc);
        fetchRealCafes(defaultLoc.latitude, defaultLoc.longitude);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const currentLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      
      globalSavedRegion = currentLoc; 
      setUserRegion(currentLoc);
      setCurrentMapRegion(currentLoc);
      fetchRealCafes(currentLoc.latitude, currentLoc.longitude);
    })();
  }, []);

  const fetchRealCafes = async (lat, lng) => {
    try {
      setIsLoading(true);
      setShowSearchHereBtn(false); 
      
      const query = `[out:json];node(around:3000,${lat},${lng})["amenity"="cafe"];out;`;
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        console.log('API 忙碌中，請稍後再試');
        setIsLoading(false);
        return;
      }

      const text = await response.text(); 
      const data = JSON.parse(text); 

      const realData = data.elements
        .filter(node => node.tags && node.tags.name)
        .filter(node => {
           const cafeName = node.tags.name;
           const isBubbleTea = excludeKeywords.some(keyword => cafeName.includes(keyword));
           return !isBubbleTea;
        })
        .map((node) => ({
          id: node.id.toString(),
          name: node.tags.name,
          lat: node.lat,
          lng: node.lon,
          imageUrl: placeholderImages[Math.floor(Math.random() * placeholderImages.length)],
          address: node.tags['addr:street'] ? `${node.tags['addr:street']}${node.tags['addr:housenumber'] || ''}` : '看地圖定位尋寶去 🐾',
          businessHours: node.tags.opening_hours || '營業時間未提供',
          rating: (Math.random() * (5.0 - 3.8) + 3.8).toFixed(1),
          tags: ['#真實店家', node.tags.internet_access === 'wlan' ? '#有WiFi' : '#新發現']
        }));

      globalSavedCafes = realData; 
      setAllCafes(realData);
      setDisplayedCafes(realData);
      setIsLoading(false);
    } catch (error) {
      console.log("抓取失敗", error); 
      setIsLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);
    if (text) {
      const filtered = allCafes.filter(cafe => 
        cafe.name.toLowerCase().includes(text.toLowerCase())
      );
      setDisplayedCafes(filtered);
    } else {
      setDisplayedCafes(allCafes);
    }
    setSelectedCafe(null);
  };

  const goToCurrentLocation = async () => {
    try {
      let location = await Location.getCurrentPositionAsync({});
      const currentLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      
      mapRef.current?.animateToRegion(currentLoc, 800);
      globalSavedRegion = currentLoc;
      setCurrentMapRegion(currentLoc);
    } catch (error) {
      console.log("定位失敗", error);
    }
  };

  // ==========================================
  // 🗺️ 修改：打開 Google Maps，直接搜尋「店名」
  // ==========================================
  const openGoogleMaps = (cafe) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cafe.name)}`;
    Linking.openURL(url).catch((err) => {
      console.error('無法打開地圖', err);
      Alert.alert('錯誤', '無法開啟地圖應用程式');
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        
        {userRegion ? (
          <MapView
            ref={mapRef} 
            style={styles.map}
            initialRegion={userRegion}
            showsUserLocation={true}
            onPress={() => setSelectedCafe(null)}
            onRegionChangeComplete={(region) => {
              globalSavedRegion = region; 
              setCurrentMapRegion(region);
              if (!isFirstLoad) {
                setShowSearchHereBtn(true); 
              }
              setIsFirstLoad(false);
            }}
          >
            {displayedCafes.map((cafe) => (
              <Marker 
                key={cafe.id}
                coordinate={{ latitude: cafe.lat, longitude: cafe.lng }}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedCafe(cafe);
                }}
              >
                <View style={[styles.customMarker, selectedCafe?.id === cafe.id && styles.activeMarker]}>
                  <Ionicons name="cafe" size={16} color={selectedCafe?.id === cafe.id ? colors.primary : colors.white} />
                </View>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={styles.loadingFull}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{marginTop: 10, color: colors.text}}>正在定位你的位置...</Text>
          </View>
        )}

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.text} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="搜尋附近咖啡廳..." 
            placeholderTextColor="#999" 
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>

        {userRegion && (
          <TouchableOpacity style={styles.locateButton} onPress={goToCurrentLocation}>
            <Ionicons name="locate" size={22} color={colors.primary} />
          </TouchableOpacity>
        )}

        {showSearchHereBtn && currentMapRegion && !isLoading && (
          <TouchableOpacity 
            style={styles.searchHereBtn}
            onPress={() => fetchRealCafes(currentMapRegion.latitude, currentMapRegion.longitude)}
          >
            <Ionicons name="refresh" size={16} color={colors.primary} style={{marginRight: 5}} />
            <Text style={styles.searchHereText}>在地圖此區域搜尋</Text>
          </TouchableOpacity>
        )}

        {isLoading && userRegion && (
          <View style={styles.loadingFloating}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingFloatingText}>搜尋附近店家...</Text>
          </View>
        )}

        {selectedCafe ? (
          <View style={styles.detailCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cafeName} numberOfLines={1}>{selectedCafe.name}</Text>
              <TouchableOpacity onPress={() => setSelectedCafe(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((item, index) => (
                <Ionicons key={index} name="star" size={14} color="#FF6B6B" style={{marginRight: 2}} />
              ))}
              <Text style={styles.ratingScore}>{selectedCafe.rating}</Text>
            </View>

            <View style={styles.cardMainContent}>
              <Image source={{ uri: selectedCafe.imageUrl }} style={styles.cafeImage} />
              
              <View style={styles.cardInfoColumn}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>地址:</Text>
                  <Text style={styles.detailText} numberOfLines={2}>{selectedCafe.address}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>營業時間:</Text>
                  <Text style={styles.detailText} numberOfLines={1}>{selectedCafe.businessHours}</Text>
                </View>

                <View style={styles.tagsContainer}>
                  {selectedCafe.tags.map((tag, index) => (
                    <View key={index} style={styles.tagBadge}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
            
            <View style={styles.actionButtonRow}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.mapButton]} 
                onPress={() => openGoogleMaps(selectedCafe)}
              >
                <Ionicons name="map" size={16} color={colors.primary} style={{marginRight: 4}} />
                <Text style={styles.mapButtonText}>開啟地圖</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.logButton]} 
                onPress={() => router.push('/log')}
              >
                <Ionicons name="pencil" size={16} color={colors.white} style={{marginRight: 4}} />
                <Text style={styles.logButtonText}>寫紀錄</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.catContainer}>
            <TouchableOpacity style={styles.speechBubble}>
              <Text style={styles.speechText}>今天想去哪裡喝咖啡？</Text>
            </TouchableOpacity>
            <View style={styles.catAvatar}><Text style={{ fontSize: 30 }}>🐱</Text></View>
          </View>
        )}

        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/')}>
            <Ionicons name={pathname === '/' ? "home" : "home-outline"} size={26} color={pathname === '/' ? colors.primary : colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/map')}>
            <Ionicons name={pathname === '/map' ? "map" : "map-outline"} size={26} color={pathname === '/map' ? colors.primary : colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/logbook')}>
            <Ionicons name={pathname === '/logbook' ? "book" : "book-outline"} size={26} color={pathname === '/logbook' ? colors.primary : colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/setting')}>
            <Ionicons name={pathname === '/setting' ? "person" : "person-outline"} size={26} color={pathname === '/settings' ? colors.primary : colors.accent} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingFull: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  searchContainer: { position: 'absolute', top: 60, left: 20, right: 20, flexDirection: 'row', backgroundColor: colors.white, borderRadius: 30, paddingHorizontal: 15, paddingVertical: 12, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },
  
  locateButton: { position: 'absolute', top: 130, right: 20, backgroundColor: colors.white, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, zIndex: 10 },
  searchHereBtn: { position: 'absolute', top: 130, alignSelf: 'center', flexDirection: 'row', backgroundColor: colors.white, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, zIndex: 10 },
  searchHereText: { color: colors.primary, fontWeight: 'bold', fontSize: 14 },
  
  loadingFloating: { position: 'absolute', top: 130, alignSelf: 'center', flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, alignItems: 'center', elevation: 3 },
  loadingFloatingText: { color: colors.primary, marginLeft: 8, fontWeight: 'bold', fontSize: 12 },

  customMarker: { backgroundColor: colors.primary, padding: 6, borderRadius: 15, borderWidth: 2, borderColor: colors.white },
  activeMarker: { backgroundColor: colors.white, borderColor: colors.primary },
  catContainer: { position: 'absolute', bottom: 100, left: 20, flexDirection: 'row', alignItems: 'flex-end' },
  speechBubble: { backgroundColor: colors.white, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, borderBottomLeftRadius: 0, marginBottom: 20, marginRight: -10, elevation: 3 },
  speechText: { color: colors.text, fontWeight: 'bold' },
  catAvatar: { width: 60, height: 60, backgroundColor: colors.text, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: colors.white },
  
  detailCard: { position: 'absolute', bottom: 100, left: 20, right: 20, backgroundColor: colors.white, borderRadius: 20, padding: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  cafeName: { fontSize: 20, fontWeight: 'bold', color: colors.text, flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  ratingScore: { fontSize: 12, color: colors.text, marginLeft: 5, fontWeight: 'bold' },
  cardMainContent: { flexDirection: 'row', marginBottom: 15 },
  cafeImage: { width: 90, height: 90, borderRadius: 15, marginRight: 15 },
  cardInfoColumn: { flex: 1, justifyContent: 'space-between' },
  detailItem: { flexDirection: 'row', marginBottom: 5 },
  detailLabel: { fontSize: 12, color: '#666', marginRight: 5, width: 60 }, 
  detailText: { fontSize: 12, color: colors.text, flex: 1 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  tagBadge: { backgroundColor: colors.secondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 15, marginRight: 6, marginBottom: 6 },
  tagText: { color: colors.text, fontSize: 10, fontWeight: 'bold' },
  
  actionButtonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  mapButton: { backgroundColor: colors.secondary, marginRight: 10 },
  logButton: { backgroundColor: colors.primary },
  mapButtonText: { color: colors.primary, fontWeight: 'bold', fontSize: 14 },
  logButtonText: { color: colors.white, fontWeight: 'bold', fontSize: 14 },
  
  tabBar: { flexDirection: 'row', height: 80, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F5EEDC', paddingBottom: 20 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});