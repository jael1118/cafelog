import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

const colors = { primary: '#8D6E63', secondary: '#F5EEDC', background: '#FAFAFA', text: '#5D4037', accent: '#D7CCC8', white: '#FFFFFF' };

export default function SettingsScreen() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>設定</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{padding: 20}}>
        
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
  content: { flex: 1 },
  profilePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 40, padding: 10, paddingRight: 30, marginBottom: 30, alignSelf: 'flex-start', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  avatarContainer: { position: 'relative', marginRight: 15 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E57373' }, // 影片中的紅色頭像
  editIconContainer: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#D4A373', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.white },
  userName: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  optionCard: { backgroundColor: colors.white, borderRadius: 16, height: 80, marginBottom: 15, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  fab: { position: 'absolute', bottom: 100, right: 20, backgroundColor: '#5D4037', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  tabBar: { flexDirection: 'row', height: 80, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.secondary, paddingBottom: 20, elevation: 10 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});