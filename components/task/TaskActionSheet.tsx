import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout, Radius, Shadow, Spacing } from '../../constants/spacing';
import { Body, BodySmall, H4 } from '../ui/Typography';

export interface TaskActionSheetOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface TaskActionSheetProps {
  visible: boolean;
  title: string;
  actions: TaskActionSheetOption[];
  onClose: () => void;
}

export function TaskActionSheet({
  visible,
  title,
  actions,
  onClose,
}: TaskActionSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={styles.sheet}
        >
          <BodySmall color={Colors.textTertiary} style={styles.kicker}>
            TASK OPTIONS
          </BodySmall>
          <H4 color={Colors.textPrimary} style={styles.title}>
            {title}
          </H4>

          {actions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionRow}
              onPress={() => {
                onClose();
                action.onPress();
              }}
            >
              <Body color={action.destructive ? Colors.error : Colors.textPrimary}>
                {action.label}
              </Body>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.cancelRow} onPress={onClose}>
            <Body color={Colors.textTertiary}>Cancel</Body>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[5],
    paddingBottom: Spacing[8],
    ...Shadow.lg,
  },
  kicker: {
    letterSpacing: 0.8,
    marginBottom: Spacing[2],
  },
  title: {
    marginBottom: Spacing[3],
  },
  actionRow: {
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  cancelRow: {
    paddingVertical: Spacing[4],
    alignItems: 'center',
  },
});
