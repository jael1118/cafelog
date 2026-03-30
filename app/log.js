import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LogScreen() {
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={28} color="#5D4037" /></TouchableOpacity>
        <Text style={styles.title}>紀錄詳情</Text>
        <View style={{width: 28}} />
      </View>
      <View style={styles.content}>
        <Ionicons name="cafe-outline" size={100} color="#D7CCC8" />
        <Text style={styles.text}>10月 18日 的紀錄</Text>
        <Text style={styles.subText}>(這裡會放照片、評分和筆記)</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60, backgroundColor: '#F5EEDC' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#5D4037' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 20, fontWeight: 'bold', color: '#5D4037', marginTop: 20 },
  subText: { fontSize: 14, color: '#8D6E63', marginTop: 10 }
});