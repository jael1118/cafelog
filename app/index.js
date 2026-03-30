import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

// --- 配色與圖示順序 ---
const colors = {
  primary: '#8D6E63', secondary: '#F5EEDC', background: '#FFFFFF',
  text: '#5D4037', accent: '#D7CCC8', white: '#FFFFFF',
};

const statsData = { total: 42, thisYear: 4, thisMonth: 4 };
const monthName = "2023年 10月";
const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
const calendarDates = [
   1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
  15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
  29, 30, 31,  0,  0,  0,  0
];
const datesWithLogs = [5, 12, 14, 18];

export default function HomeScreen() {
  const router = useRouter();
  const pathname = usePathname();

  const renderDateCell = ({ item: day, index }) => {
    const isToday = day === 18;
    const hasLog = datesWithLogs.includes(day);

    if (day === 0) return <View style={styles.calendarCellEmpty} key={`empty-${index}`} />;

    return (
      <TouchableOpacity 
        style={styles.calendarCellContainer} 
        key={`day-${index}`}
        activeOpacity={hasLog ? 0.5 : 1}
        onPress={() => { if (hasLog) router.push('/log'); }}
      >
        <View style={[styles.calendarDayBackground, isToday && styles.todayBackground]}>
          <Text style={[styles.calendarDayText, isToday && styles.todayText, hasLog && styles.logDayText]}>{day}</Text>
        </View>
        {hasLog && (
          <View style={styles.logIconContainer}>
            <Ionicons name="cafe" size={10} color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoArea}>
          <Ionicons name="heart-outline" size={24} color={colors.text} style={styles.logoIcon} />
          <Text style={styles.logoText}>啡曆. Cafélog</Text>
        </View>
        <View style={styles.monthHeader}>
          <TouchableOpacity><Ionicons name="chevron-back" size={18} color={colors.text} /></TouchableOpacity>
          <View style={styles.monthBadge}><Text style={styles.monthLabel}>{monthName}</Text></View>
          <TouchableOpacity><Ionicons name="chevron-forward" size={18} color={colors.text} /></TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.calendarContainer}>
          <View style={styles.daysOfWeekRow}>
            {daysOfWeek.map((day, idx) => (<Text key={idx} style={styles.dayOfWeekText}>{day}</Text>))}
          </View>
          <FlatList
            data={calendarDates}
            renderItem={renderDateCell}
            keyExtractor={(item, index) => index.toString()}
            numColumns={7}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>統計資料</Text>
          <View style={styles.statsRow}>
            <StatsCard label="累積咖啡數" value={statsData.total} unit="咖" />
            <StatsCard label="這年" value={statsData.thisYear} unit="咖" />
            <StatsCard label="這月" value={statsData.thisMonth} unit="咖" />
          </View>
        </View>
      </ScrollView>

      {/* 右下角新增紀錄的 FAB (影片內部的按鈕) */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => console.log('準備新增紀錄！')}>
        <Ionicons name="add" size={32} color={colors.white} />
      </TouchableOpacity>

      {/* --- 手工貼上的底部導覽列 (四個頁面同步更新) --- */}
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

    </SafeAreaView>
  );
}

const StatsCard = ({ label, value, unit }) => (
  <View style={styles.statsCard}>
    <Text style={styles.statsLabel}>{label}</Text>
    <View style={styles.statsValueContainer}>
        <Text style={styles.statsValue}>{value}</Text>
        <Text style={styles.statsUnit}>{unit}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoArea: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { marginRight: 8 },
  logoText: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  monthHeader: { flexDirection: 'row', alignItems: 'center' },
  monthBadge: { backgroundColor: colors.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginHorizontal: 8 },
  monthLabel: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  content: { flex: 1 },
  calendarContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  daysOfWeekRow: { flexDirection: 'row', marginBottom: 15 },
  dayOfWeekText: { flex: 1, textAlign: 'center', color: colors.accent, fontSize: 12, fontWeight: 'bold' },
  calendarCellContainer: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center' },
  calendarCellEmpty: { flex: 1, height: 50 },
  calendarDayBackground: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  todayBackground: { backgroundColor: colors.secondary },
  calendarDayText: { fontSize: 16, color: colors.text },
  todayText: { fontWeight: 'bold' },
  logDayText: { fontWeight: 'bold', color: colors.primary },
  logIconContainer: { position: 'absolute', bottom: 2, right: 8 },
  statsSection: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statsCard: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.secondary, padding: 15, borderRadius: 60, width: '31%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  statsLabel: { fontSize: 10, color: colors.text, marginBottom: 5 },
  statsValueContainer: { flexDirection: 'row', alignItems: 'baseline' },
  statsValue: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  statsUnit: { fontSize: 12, color: colors.text, marginLeft: 2 },
  fab: { position: 'absolute', bottom: 100, right: 20, backgroundColor: colors.text, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  
  // 導覽列樣式 (更新為更精緻的大地色系)
  tabBar: { flexDirection: 'row', height: 80, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.secondary, paddingBottom: 20, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 5 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});