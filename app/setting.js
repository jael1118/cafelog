import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

// 🌟 全面套用治癒系紫羅蘭/粉色系配色
const colors = {
  primary: '#9B7ED9',         // 深紫 (導覽列選中狀態)
  secondary: '#EBE5F5',       // 淺紫 (導覽列選中背景)
  background: '#F8F8FC',      // 極淺灰紫底色
  text: '#5D4037',            // 深棕色 (標題與名稱)
  grayText: '#888888',        // 次要灰色
  white: '#FFFFFF',
  accentPink: '#FCA5F1',      // 編輯按鈕的粉紅
  avatarBg: '#8A8482'         // 質感灰色頭像底色
};

export default function SettingsScreen() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>設定</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{padding: 20}} showsVerticalScrollIndicator={false}>
        
        {/* 個人資料區塊 */}
        <View style={styles.profilePill}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar} />
            <View style={styles.editIconContainer}>
              <Ionicons name="pencil" size={10} color={colors.white} />
            </View>
          </View>
          <Text style={styles.userName}>your name</Text>
        </View>

        {/* 空白選項卡片 */}
        <View style={styles.optionCard} />
        <View style={styles.optionCard} />
        <View style={styles.optionCard} />
        <View style={styles.optionCard} />

        {/* 底部留白避免被導覽列遮擋 */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 🌟 依據設計圖製作的新版導覽列 (設定頁 Active) */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/')}>
             <Ionicons name="calendar-outline" size={22} color={colors.grayText} />
            <Text style={styles.tabText}>主頁</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/map')}>
            <Ionicons name="map-outline" size={22} color={colors.grayText} />
             <Text style={styles.tabText}>地圖</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/logbook')}>
            <Ionicons name="book-outline" size={22} color={colors.grayText} />
             <Text style={styles.tabText}>紀錄</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.tabItem} onPress={() => router.replace('/setting')}>
            {/* 目前在設定頁，所以給它紫色圓形背景 */}
            <View style={styles.tabItemActiveBg}>
               <Ionicons name="settings-outline" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.tabText, styles.tabTextActive]}>設定</Text>
          </TouchableOpacity>
        </View>
      </View>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 40, paddingHorizontal: 25, paddingBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  content: { flex: 1 },
  
  // 個人資料膠囊卡片
  profilePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 25, padding: 15, paddingRight: 40, marginBottom: 30, alignSelf: 'stretch', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  avatarContainer: { position: 'relative', marginRight: 20 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.avatarBg }, 
  editIconContainer: { position: 'absolute', bottom: -2, right: -2, backgroundColor: colors.accentPink, borderRadius: 12, width: 22, height: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.white },
  userName: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  
  // 選項卡片
  optionCard: { backgroundColor: colors.white, borderRadius: 20, height: 95, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  
  // 底部導覽列
  tabBarWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'transparent' },
  tabBar: { flexDirection: 'row', height: 85, backgroundColor: colors.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 10, paddingHorizontal: 15 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 15 },
  tabItemActiveBg: { backgroundColor: colors.secondary, width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginTop: -8, marginBottom: 2 },
  tabText: { fontSize: 10, color: colors.grayText, marginTop: 4, fontWeight: 'bold' },
  tabTextActive: { color: colors.primary }
});