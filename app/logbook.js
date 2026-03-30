import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

const colors = { primary: '#8D6E63', secondary: '#F5EEDC', background: '#FAFAFA', text: '#5D4037', accent: '#D7CCC8', white: '#FFFFFF' };

export default function LogbookScreen() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>紀錄本</Text>
      </View>

      {/* 搜尋與排序欄 */}
      <View style={styles.toolsRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#999" style={{marginRight: 8}} />
          <TextInput placeholder="搜尋內容" style={{flex: 1, color: colors.text}} />
        </View>
        <TouchableOpacity style={styles.sortButton}>
          <Ionicons name="filter" size={18} color={colors.text} style={{marginRight: 5}} />
          <Text style={{color: colors.text, fontWeight: 'bold'}}>排序</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{padding: 20}}>
        {/* 咖啡廳紀錄卡片 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatarPlaceholder}><Text style={{color: colors.white}}>圖</Text></View>
            <View style={styles.cardInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.cafeName}>cafelog</Text>
                <Text style={styles.dateText}>2023年10月5日 12:05</Text>
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="heart" size={12} color="#FF6B6B" />
                <Ionicons name="heart" size={12} color="#FF6B6B" />
                <Ionicons name="heart" size={12} color="#FF6B6B" />
                <Ionicons name="heart" size={12} color="#FF6B6B" />
                <Ionicons name="heart-outline" size={12} color="#FF6B6B" />
                <Text style={styles.ratingText}>4.0</Text>
                <Ionicons name="location" size={12} color={colors.text} style={{marginLeft: 10}} />
                <Text style={styles.locationText}>juu cafe</Text>
              </View>
            </View>
          </View>
          <Text style={styles.reviewText} numberOfLines={2}>
            Incredible Ethiopian pour-over with notes of jasmine and citrus. The...
          </Text>
        </View>

        {/* 空白佔位卡片 */}
        <View style={[styles.card, { height: 100 }]} />
        <View style={[styles.card, { height: 100 }]} />
        
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* 懸浮新增按鈕 */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Ionicons name="add" size={32} color={colors.white} />
      </TouchableOpacity>

      {/* --- 手工貼上的底部導覽列 --- */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  toolsRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10 },
  searchBar: { flex: 1, flexDirection: 'row', backgroundColor: colors.white, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.secondary, marginRight: 10 },
  sortButton: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.secondary },
  content: { flex: 1 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', marginBottom: 10 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#5D4037', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardInfo: { flex: 1, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  cafeName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  dateText: { fontSize: 10, color: '#999' },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 12, color: colors.text, marginLeft: 4, fontWeight: 'bold' },
  locationText: { fontSize: 12, color: colors.text, marginLeft: 4 },
  reviewText: { fontSize: 14, color: '#666', lineHeight: 20 },
  fab: { position: 'absolute', bottom: 100, right: 20, backgroundColor: '#5D4037', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  tabBar: { flexDirection: 'row', height: 80, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.secondary, paddingBottom: 20, elevation: 10 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});