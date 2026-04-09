import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🌟 換上統一的紫羅蘭與粉色系治癒配色
const colors = {
  primary: '#FCA5F1',         // 粉紅色 (強調色)
  secondary: '#EBE5F5',       // 淺紫 (編輯按鈕、標籤底色)
  background: '#F8F8FC',      // 極淺灰紫底色
  text: '#4A4A4A',            // 深灰標題
  grayText: '#888888',        // 次要灰字
  tagBg: '#EBE5F5',           // 標籤底色
  tagText: '#9B7ED9',         // 標籤文字 (深紫)
  heart: '#FCA5F1',           // 愛心粉紅
  heartEmpty: '#E0E0E0',      // 愛心空底色
  white: '#FFFFFF'
};

export default function LogDetailScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams(); 
  
  const [dayLogs, setDayLogs] = useState([]);

  useEffect(() => {
    const fetchDayLogs = async () => {
      try {
        const storedLogs = await AsyncStorage.getItem('cafe_logs');
        if (storedLogs) {
          const allLogs = JSON.parse(storedLogs);
          const filteredLogs = allLogs.filter(log => log.date === date);
          setDayLogs(filteredLogs);
        }
      } catch (error) {
        console.error("讀取紀錄失敗", error);
      }
    };
    if (date) fetchDayLogs();
  }, [date]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {dayLogs.length === 0 ? (
          <Text style={styles.emptyText}>這天還沒有喝咖啡的紀錄喔 ☕️</Text>
        ) : (
          dayLogs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              
              <View style={styles.headerRow}>
                <Text style={styles.titleText}>{log.title}</Text>
                <Text style={styles.timeText}>{log.displayTime}</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.thumbnailBox}>
                  {log.imageUrl ? (
                    <Image source={{ uri: log.imageUrl }} style={styles.thumbnailImage} />
                  ) : (
                    <Ionicons name="cafe" size={30} color={colors.secondary} />
                  )}
                </View>

                <View style={styles.metaColumn}>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-sharp" size={14} color={colors.grayText} />
                    <Text style={styles.locationText}>{log.location || '未填寫地點'}</Text>
                  </View>

                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((heart) => (
                      <Ionicons 
                        key={heart}
                        name="heart" 
                        size={14} 
                        color={heart <= log.rating ? colors.heart : colors.heartEmpty} 
                        style={{ marginRight: 3 }}
                      />
                    ))}
                    <Text style={styles.ratingNumber}>{Number(log.rating).toFixed(1)}</Text>
                  </View>
                </View>

                {/* 🌟 編輯按鈕：點擊時把這筆 log 變成字串，一起帶去新增頁面！ */}
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => router.push({ 
                    pathname: '/addlog', // 注意：請確認你的檔案名稱是 addlog.js 還是 add-log.js
                    params: { editLogData: JSON.stringify(log) } 
                  })}
                >
                  <Ionicons name="pencil" size={14} color={colors.tagText} />
                </TouchableOpacity>
              </View>

              {log.tags ? (
                <View style={styles.tagsContainer}>
                  {log.tags.split(' ').filter(t => t.trim() !== '').map((tag, index) => (
                    <View key={index} style={styles.tagBadge}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <Text style={styles.noteText}>{log.note}</Text>

              {/* 🌟 修正：讀取你在 addlog 存下的「大照片」 (largeImageUrl) */}
              {log.largeImageUrl && (
                 <Image source={{ uri: log.largeImageUrl }} style={styles.largeImage} />
              )}

              <View style={styles.divider} />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  navBar: { paddingHorizontal: 15, paddingTop: 10, paddingBottom: 10 },
  backBtn: { padding: 5, alignSelf: 'flex-start' },
  content: { flex: 1, paddingHorizontal: 25 },
  emptyText: { textAlign: 'center', color: colors.grayText, marginTop: 50, fontSize: 16 },
  
  logCard: { marginBottom: 30 },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  titleText: { fontSize: 22, fontWeight: '900', color: colors.text, flex: 1 },
  timeText: { fontSize: 11, color: colors.grayText, marginBottom: 4 },

  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  thumbnailBox: { width: 65, height: 65, backgroundColor: colors.white, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F0F0' },
  thumbnailImage: { width: '100%', height: '100%' },
  
  metaColumn: { flex: 1, justifyContent: 'center' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  locationText: { fontSize: 13, color: colors.grayText, marginLeft: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingNumber: { fontSize: 12, color: colors.grayText, marginLeft: 6, fontWeight: 'bold' },
  
  // 編輯按鈕換成淺紫色底、深紫色筆
  editButton: { backgroundColor: colors.secondary, width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-start' },

  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  tagBadge: { backgroundColor: colors.tagBg, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 15, marginRight: 8, marginBottom: 8 },
  tagText: { color: colors.tagText, fontSize: 12, fontWeight: 'bold' },

  noteText: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 20 },
  
  largeImage: { width: '100%', height: 200, backgroundColor: '#E0E0E0', borderRadius: 15, marginTop: 10 },
  
  divider: { height: 1, backgroundColor: '#EBE5F5', marginVertical: 25 }
});