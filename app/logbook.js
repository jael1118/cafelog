import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, TextInput, Modal, FlatList, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🌟 全面同步為「寫新紀錄頁」的紫羅蘭 x 粉色治癒系配色
const colors = {
  primary: '#FCA5F1',         // 粉紅色 (強調色、FAB按鈕)
  secondary: '#EBE5F5',       // 淺紫 (標籤底色、選中背景)
  background: '#F8F8FC',      // 極淺灰紫底色
  text: '#4A4A4A',            // 深灰文字
  grayText: '#888888',        // 次要灰字
  primaryText: '#9B7ED9',     // 深紫色 (標籤文字、圖標)
  heart: '#FCA5F1',           // 愛心粉紅
  white: '#FFFFFF',
};

export default function LogbookScreen() {
  const router = useRouter();
  const pathname = usePathname();

  // --- 狀態管理 ---
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState('newest'); 
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

  // === 🔄 自動去保險箱拿資料 ===
  useFocusEffect(
    useCallback(() => {
      const fetchLogs = async () => {
        try {
          const storedLogs = await AsyncStorage.getItem('cafe_logs');
          if (storedLogs) {
            setLogs(JSON.parse(storedLogs));
          }
        } catch (error) {
          console.error("讀取紀錄失敗", error);
        }
      };
      fetchLogs();
    }, [])
  );

  // === 🔍 搜尋與排序邏輯 ===
  const processedLogs = useMemo(() => {
    let filtered = logs.filter(log => {
      const query = searchQuery.toLowerCase();
      const matchTitle = log.title?.toLowerCase().includes(query);
      const matchLocation = log.location?.toLowerCase().includes(query);
      const matchTags = log.tags?.toLowerCase().includes(query);
      const matchNote = log.note?.toLowerCase().includes(query);
      return matchTitle || matchLocation || matchTags || matchNote;
    });

    return filtered.sort((a, b) => {
      if (sortType === 'newest') {
        return new Date(b.date) - new Date(a.date);
      } else if (sortType === 'oldest') {
        return new Date(a.date) - new Date(b.date);
      } else if (sortType === 'rating') {
        return b.rating - a.rating; 
      }
      return 0;
    });
  }, [logs, searchQuery, sortType]);

  // === 🎨 渲染單張卡片 ===
  const renderLogCard = ({ item }) => {
    const logDate = new Date(item.date);
    const month = logDate.getMonth() + 1;
    const day = String(logDate.getDate()).padStart(2, '0');
    const tagsArray = item.tags ? item.tags.split(' ').filter(t => t.trim() !== '') : [];

    return (
      <TouchableOpacity 
        style={styles.cardContainer} 
        activeOpacity={0.9}
        // 🌟 修正路徑：改成你設定的 '/log'
        onPress={() => router.push({ pathname: '/log', params: { date: item.date } })}
      >
        <View style={styles.cardImageWrapper}>
          <ImageBackground 
            source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=300&auto=format&fit=crop' }} 
            style={styles.cardImage}
          >
            <View style={styles.imageOverlay}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateBadgeMonth}>{month}月</Text>
                <Text style={styles.dateBadgeDay}>{day}</Text>
              </View>

              <View style={styles.imageBottomInfo}>
                <View style={styles.imageLocationRow}>
                  <Ionicons name="location-outline" size={12} color={colors.white} />
                  <Text style={styles.imageLocationText} numberOfLines={1}>{item.location || '秘密基地'}</Text>
                </View>
                <View style={styles.imageRatingRow}>
                  {[1, 2, 3, 4, 5].map((heart) => (
                    <Ionicons 
                      key={heart} 
                      name="heart" 
                      size={10} 
                      color={heart <= item.rating ? colors.heart : 'rgba(255,255,255,0.4)'} 
                      style={{ marginRight: 2 }}
                    />
                  ))}
                  <Text style={styles.imageRatingText}>{Number(item.rating).toFixed(1)}</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.cardTextWrapper}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            
            {/* 🌟 鉛筆編輯按鈕：加上停止冒泡與攜帶資料跳轉 */}
            <TouchableOpacity 
              style={styles.editIconBtn}
              onPress={(e) => {
                e.stopPropagation(); // 阻止點擊事件穿透到卡片本身
                router.push({ 
                  pathname: '/addlog', 
                  params: { editLogData: JSON.stringify(item) } 
                });
              }}
            >
              <Ionicons name="pencil" size={12} color={colors.primaryText} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.cardNote} numberOfLines={2}>{item.note || '沒有留下筆記...'}</Text>
          
          <View style={styles.cardTagsRow}>
            {tagsArray.slice(0, 2).map((tag, idx) => (
              <View key={idx} style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {tagsArray.length > 2 && (
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>...</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>紀錄本</Text>
      </View>

      <View style={styles.toolbarRow}>
        <View style={styles.searchPill}>
          <Ionicons name="search" size={16} color={colors.primaryText} />
          <TextInput 
            style={styles.searchInput}
            placeholder="搜尋內容"
            placeholderTextColor={colors.grayText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.sortPill} onPress={() => setIsSortModalVisible(true)}>
          <Ionicons name="list" size={16} color={colors.primaryText} />
          <Text style={styles.sortText}>
            {sortType === 'newest' ? '最新' : sortType === 'oldest' ? '最舊' : '評分'}
          </Text>
        </TouchableOpacity>
      </View>

      {processedLogs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>找不到相關紀錄 ☕️</Text>
        </View>
      ) : (
        <FlatList
          data={processedLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderLogCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={isSortModalVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsSortModalVisible(false)}>
          <View style={styles.sortModalCard}>
            <Text style={styles.sortModalTitle}>選擇排序方式</Text>
            
            <TouchableOpacity style={styles.sortOptionBtn} onPress={() => { setSortType('newest'); setIsSortModalVisible(false); }}>
              <Text style={[styles.sortOptionText, sortType === 'newest' && styles.sortOptionTextActive]}>最新紀錄優先</Text>
              {sortType === 'newest' && <Ionicons name="checkmark" size={20} color={colors.primaryText} />}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sortOptionBtn} onPress={() => { setSortType('oldest'); setIsSortModalVisible(false); }}>
              <Text style={[styles.sortOptionText, sortType === 'oldest' && styles.sortOptionTextActive]}>最舊紀錄優先</Text>
              {sortType === 'oldest' && <Ionicons name="checkmark" size={20} color={colors.primaryText} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.sortOptionBtn} onPress={() => { setSortType('rating'); setIsSortModalVisible(false); }}>
              <Text style={[styles.sortOptionText, sortType === 'rating' && styles.sortOptionTextActive]}>最高評分優先</Text>
              {sortType === 'rating' && <Ionicons name="checkmark" size={20} color={colors.primaryText} />}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => router.push('/addlog')}>
        <Ionicons name="add" size={32} color={colors.white} />
      </TouchableOpacity>

      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/')}>
            <Ionicons name="calendar-outline" size={22} color={pathname === '/' ? colors.primaryText : colors.grayText} />
            <Text style={[styles.tabText, pathname === '/' && styles.tabTextActive]}>主頁</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/map')}>
            <Ionicons name="map-outline" size={22} color={pathname === '/map' ? colors.primaryText : colors.grayText} />
            <Text style={[styles.tabText, pathname === '/map' && styles.tabTextActive]}>地圖</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/logbook')}>
            <View style={styles.tabItemActiveBg}>
              <Ionicons name="book-outline" size={22} color={colors.primaryText} />
            </View>
            <Text style={[styles.tabText, styles.tabTextActive]}>紀錄</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/setting')}>
            <Ionicons name="settings-outline" size={22} color={pathname === '/setting' ? colors.primaryText : colors.grayText} />
            <Text style={[styles.tabText, pathname === '/setting' && styles.tabTextActive]}>設定</Text>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  
  header: { paddingHorizontal: 25, paddingTop: 40, paddingBottom: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  
  toolbarRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15 },
  searchPill: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderColor: colors.secondary, borderWidth: 1, borderRadius: 25, paddingHorizontal: 15, height: 40, marginRight: 10 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: colors.text },
  sortPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.secondary, borderRadius: 25, paddingHorizontal: 18, height: 40 },
  sortText: { marginLeft: 5, fontSize: 14, color: colors.primaryText, fontWeight: 'bold' },

  listContent: { paddingHorizontal: 20, paddingBottom: 120 }, 
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.grayText, fontSize: 16 },

  cardContainer: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 20, marginBottom: 15, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, overflow: 'hidden', height: 130 },
  
  cardImageWrapper: { width: 140, height: '100%' },
  cardImage: { flex: 1, resizeMode: 'cover' },
  imageOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'space-between', padding: 8 },
  
  dateBadge: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', alignItems: 'center' },
  dateBadgeMonth: { fontSize: 10, fontWeight: 'bold', color: colors.text },
  dateBadgeDay: { fontSize: 18, fontWeight: '900', color: colors.text, marginTop: -2 },
  
  imageBottomInfo: { justifyContent: 'flex-end' },
  imageLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  imageLocationText: { fontSize: 10, color: colors.white, fontWeight: '600' },
  imageRatingRow: { flexDirection: 'row', alignItems: 'center' },
  imageRatingText: { fontSize: 10, color: colors.white, fontWeight: 'bold', marginLeft: 4 },

  cardTextWrapper: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, flex: 1, marginRight: 5 },
  
  // 編輯按鈕樣式同步
  editIconBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' },
  
  cardNote: { fontSize: 12, color: colors.grayText, lineHeight: 18, marginTop: 4 },
  
  cardTagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  tagBadge: { backgroundColor: colors.secondary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6 },
  tagText: { color: colors.primaryText, fontSize: 10, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  sortModalCard: { backgroundColor: colors.white, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, paddingBottom: 40 },
  sortModalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 20, textAlign: 'center' },
  sortOptionBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  sortOptionText: { fontSize: 16, color: colors.text },
  sortOptionTextActive: { color: colors.primaryText, fontWeight: 'bold' },

  fab: { position: 'absolute', bottom: 110, right: 20, backgroundColor: colors.primary, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6, zIndex: 10 },

  tabBarWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'transparent' },
  tabBar: { flexDirection: 'row', height: 85, backgroundColor: colors.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 10, paddingHorizontal: 15 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 15 },
  tabItemActiveBg: { backgroundColor: colors.secondary, width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginTop: -8, marginBottom: 2 },
  tabText: { fontSize: 10, color: colors.grayText, marginTop: 4, fontWeight: 'bold' },
  tabTextActive: { color: colors.primaryText }
});