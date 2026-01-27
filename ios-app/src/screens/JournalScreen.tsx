/**
 * JournalScreen
 * Write and edit journal entries for a specific date
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, Check, Trash2 } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { useJournal } from '../hooks/useJournal';
import IconButton from '../components/ui/IconButton';
import Button from '../components/ui/Button';

type RootStackParamList = {
  Home: undefined;
  Favorites: undefined;
  Journal: { date: string };
};

type JournalScreenRouteProp = RouteProp<RootStackParamList, 'Journal'>;

export function JournalScreen() {
  const navigation = useNavigation();
  const route = useRoute<JournalScreenRouteProp>();
  const { isDarkMode, colors } = useTheme();
  const { getEntry, saveEntry, deleteEntry } = useJournal();

  const date = new Date(route.params.date);
  const existingEntry = getEntry(date);
  const [content, setContent] = useState(existingEntry?.content || '');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(content !== (existingEntry?.content || ''));
  }, [content, existingEntry]);

  const backgroundColor = isDarkMode ? '#111827' : '#f9fafb';
  const headerBg = isDarkMode ? '#1f2937' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#111827';
  const subtitleColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const inputBg = isDarkMode ? '#1f2937' : '#ffffff';
  const inputBorder = isDarkMode ? '#374151' : '#e5e7eb';
  const placeholderColor = isDarkMode ? '#6b7280' : '#9ca3af';

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const handleSave = () => {
    saveEntry(date, content);
    navigation.goBack();
  };

  const handleDelete = () => {
    deleteEntry(date);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: headerBg }]}>
          <View style={styles.headerLeft}>
            <IconButton
              onPress={() => navigation.goBack()}
              variant="ghost"
              isDark={isDarkMode}
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={20} color={isDarkMode ? '#d1d5db' : '#374151'} />
            </IconButton>
            <View>
              <Text style={[styles.title, { color: textColor }]}>Journal</Text>
              <Text style={[styles.subtitle, { color: subtitleColor }]}>
                {formatDate()}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {existingEntry && (
              <IconButton
                onPress={handleDelete}
                variant="ghost"
                isDark={isDarkMode}
                accessibilityLabel="Delete entry"
              >
                <Trash2 size={20} color="#ef4444" />
              </IconButton>
            )}
          </View>
        </View>

        {/* Content */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.content}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: inputBg,
                borderColor: inputBorder,
                color: textColor,
              },
            ]}
            placeholder="Write about your day with your furry friend..."
            placeholderTextColor={placeholderColor}
            multiline
            textAlignVertical="top"
            value={content}
            onChangeText={setContent}
            autoFocus={!existingEntry}
          />
        </Animated.View>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            { backgroundColor: headerBg, borderTopColor: inputBorder },
          ]}
        >
          <View style={styles.footerInfo}>
            <Text style={[styles.charCount, { color: subtitleColor }]}>
              {content.length} characters
            </Text>
          </View>
          <Button
            onPress={handleSave}
            disabled={!hasChanges && !content.trim()}
            variant={hasChanges || content.trim() ? 'primary' : 'secondary'}
          >
            <View style={styles.saveButtonContent}>
              <Check size={18} color="#ffffff" />
              <Text style={styles.saveButtonText}>Save</Text>
            </View>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  footerInfo: {},
  charCount: {
    fontSize: 13,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default JournalScreen;
