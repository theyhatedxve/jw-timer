import {
  FlatList,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';

import { timerEn as text } from '../../../constants/strings/timerEn';

import ActionButton from '../common/ActionButton';
import SettingsButton from '../common/SettingsButton';

import {
  digitSize,
  sectionColor,
  styles,
} from '../../styles/timer/timerAgenda.styles';

import {
  useTimerAgenda,
  type TimerAgendaRow,
} from '../../hooks/useTimerAgenda';

import type { useTimerSession } from '../../hooks/useTimerSession';

type Model = ReturnType<typeof useTimerSession>;

function AwakeWhilePresented() {
  useKeepAwake('jw-timer-presentation', {
    suppressDeactivateWarnings: true,
  });

  return null;
}

function TimerControls({ model }: { readonly model: Model }) {
  const completed = model.timer.status === 'completed';

  const actions = [
    {
      label: model.timer.status === 'running'
        ? text.pause
        : model.timer.status === 'paused'
          ? text.resume
          : text.start,
      onPress: model.toggleRunning,
      disabled: model.locked || completed,
      variant: styles.startControl,
    },
    {
      label: model.isLastPart ? text.finish : text.next,
      onPress: model.advancePart,
      disabled: model.locked || completed,
      variant: undefined,
    },
    {
      label: text.restart,
      onPress: model.confirmReset,
      disabled: model.locked,
      variant: styles.restartControl,
    },
    {
      label: model.fullscreen
        ? text.exitFullscreen
        : text.fullscreen,
      onPress: model.toggleFullscreen,
      disabled: !model.fullscreen && model.locked,
      variant: undefined,
    },
  ];

  return (
    <View style={styles.actions}>
      {actions.map(action => (
        <Pressable
          key={action.label}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          accessibilityState={{ disabled: action.disabled }}
          disabled={action.disabled}
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.control,
            action.variant,
            action.disabled && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.controlLabel}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function SessionMessages({
  model,
}: {
  readonly model: Model;
}) {
  const saved = model.pendingRecovery;

  return (
    <>
      {model.notice ? (
        <View style={styles.notice}>
          <Text accessibilityRole="alert" style={styles.text}>
            {model.notice}
          </Text>
        </View>
      ) : null}

      {model.error ? (
        <View style={styles.notice}>
          <Text accessibilityRole="alert" style={styles.text}>
            {model.error}
          </Text>

          {model.ready && !saved ? (
            <ActionButton
              label={text.retrySaving}
              onPress={model.retrySaving}
            />
          ) : null}
        </View>
      ) : null}

      {saved ? (
        <View style={styles.notice}>
          <Text accessibilityRole="header" style={styles.heading}>
            {text.recover}
          </Text>

          <Text style={styles.text}>
            {saved.program.title} · {model.recoveryTitle}
          </Text>

          <Text style={styles.muted}>
            {new Date(saved.savedAtMs).toLocaleString()}
            {' · '}
            {Math.floor(saved.elapsedMs / 1000)} seconds saved
          </Text>

          <Text style={styles.text}>
            {text.recoveryNote}
          </Text>

          <ActionButton
            label={saved.status === 'ready'
              ? text.restoreReady
              : text.restorePaused}
            onPress={model.restoreCheckpoint}
          />

          <ActionButton
            label={text.restartRecovered}
            onPress={model.restartRecoveredPart}
          />
        </View>
      ) : null}
    </>
  );
}

interface RowProps {
  readonly row: TimerAgendaRow;
  readonly compact: boolean;
  readonly disabled: boolean;
  readonly onMenu: (index: number) => void;
}

function AgendaRow({
  row,
  compact,
  disabled,
  onMenu,
}: RowProps) {
  const tone = sectionColor(row.sectionIndex);

  return (
    <View>
      {row.startsSection ? (
        <Text
          accessibilityRole="header"
          style={[
            styles.sectionHeader,
            { color: tone, borderLeftColor: tone },
          ]}
        >
          {row.sectionTitle}
        </Text>
      ) : null}

      <View
        style={[
          styles.agendaRow,
          compact && styles.compactRow,
          row.current && styles.selectedRow,
        ]}
      >
        <View style={!compact ? styles.flexible : undefined}>
          <Text style={[styles.text, { color: tone }]}>
            {row.index + 1}. {row.title}
          </Text>

          {row.current ? (
            <Text style={styles.muted}>
              {text.selectedPart}
            </Text>
          ) : null}
        </View>

        <View style={styles.rowValues}>
          <View style={styles.valueColumn}>
            {compact ? (
              <Text style={styles.muted}>{text.duration}</Text>
            ) : null}

            <Text style={styles.number}>
              {row.durationLabel}
            </Text>
          </View>

          <View style={styles.valueColumn}>
            {compact ? (
              <Text style={styles.muted}>{text.timer}</Text>
            ) : null}

            <Text
              accessibilityLiveRegion="none"
              style={styles.number}
            >
              {row.timerLabel}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${text.partMenu}: ${row.title}`}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={() => onMenu(row.index)}
            style={({ pressed }) => [
              styles.menu,
              disabled && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text
              accessible={false}
              allowFontScaling={false}
              style={styles.menuGlyph}
            >
              ⋮
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function TimerSessionView(model: Model) {
  const agenda = useTimerAgenda(model);
  const presenting = model.fullscreen && model.active;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" hidden={presenting} />

      {presenting && model.keepAwake ? (
        <AwakeWhilePresented />
      ) : null}

      {model.fullscreen ? (
        <ScrollView
          contentContainerStyle={styles.fullscreenContent}
        >
          <SessionMessages model={model} />

          <Text style={styles.heading}>
            {model.partTitle}
          </Text>

          <Text style={styles.text}>
            {model.stateLabel}
          </Text>

          <Text
            accessibilityLabel={
              `${model.stateLabel}: ${model.digits}`
            }
            accessibilityLiveRegion="none"
            style={[
              styles.fullscreenDigits,
              digitSize(model.displaySize),
              model.overtime && styles.overtime,
            ]}
          >
            {model.digits}
          </Text>

          <TimerControls model={model} />
        </ScrollView>
      ) : (
        <>
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.content}
            data={agenda.rows}
            keyExtractor={row => row.id}
            ListHeaderComponent={
              <View style={styles.header}>
                <View style={styles.topRow}>
                  <View style={styles.titleBlock}>
                    <Text
                      accessibilityRole="header"
                      style={styles.title}
                    >
                      {model.program.title}
                    </Text>

                    <Text style={styles.text}>
                      {agenda.week}
                    </Text>
                  </View>

                  <SettingsButton
                    onPress={model.openSettings}
                  />
                </View>

                <View style={styles.clockBox}>
                  <Text style={styles.muted}>
                    {text.currentTime} · {agenda.timezone}
                  </Text>

                  <Text
                    accessibilityLiveRegion="none"
                    style={styles.clock}
                  >
                    {agenda.clock}
                  </Text>
                </View>

                <View style={styles.actions}>
                  <ActionButton
                    label={text.managePrograms}
                    onPress={model.openPrograms}
                  />

                  {model.program.meetingId ? (
                    <ActionButton
                      label={text.editProgram}
                      disabled={model.locked}
                      onPress={model.editLoadedProgram}
                    />
                  ) : null}
                </View>

                <SessionMessages model={model} />

                {model.program.meetingId &&
                !model.program.meetingDate ? (
                  <Text style={styles.muted}>
                    {text.legacyMetadata}
                  </Text>
                ) : null}

                {!model.pendingRecovery ? (
                  <View style={styles.currentCard}>
                    <Text style={styles.muted}>
                      {model.stateLabel}
                    </Text>

                    <Text style={styles.heading}>
                      {model.partTitle}
                    </Text>

                    <Text
                      accessibilityLabel={
                        `${model.stateLabel}: ${model.digits}`
                      }
                      accessibilityLiveRegion="none"
                      style={[
                        styles.currentDigits,
                        model.overtime && styles.overtime,
                      ]}
                    >
                      {model.digits}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.topRow}>
                  <Text style={[styles.text, styles.flexible]}>
                    {text.keepAwake}
                  </Text>

                  <Switch
                    accessibilityLabel={text.keepAwake}
                    value={model.keepAwake}
                    onValueChange={model.setKeepAwake}
                  />
                </View>

                <Text style={styles.muted}>
                  {text.snapshotNote}
                </Text>

                {!agenda.compact ? (
                  <View style={styles.tableHeader}>
                    <Text style={[styles.muted, styles.flexible]}>
                      {text.title}
                    </Text>

                    <View style={styles.rowValues}>
                      <View style={styles.valueColumn}>
                        <Text style={styles.muted}>
                          {text.duration}
                        </Text>
                      </View>

                      <View style={styles.valueColumn}>
                        <Text style={styles.muted}>
                          {text.timer}
                        </Text>
                      </View>

                      <View style={styles.menu} />
                    </View>
                  </View>
                ) : null}
              </View>
            }
            renderItem={({ item }) => (
              <AgendaRow
                row={item}
                compact={agenda.compact}
                disabled={model.locked}
                onMenu={model.openPartMenu}
              />
            )}
          />

          <View style={styles.footer}>
            <Text
              accessibilityLiveRegion="none"
              style={styles.text}
            >
              {text.estimatedFinish}: {agenda.estimatedFinish}
            </Text>

            <Text style={styles.muted}>
              {agenda.estimateNote}
            </Text>

            <TimerControls model={model} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}