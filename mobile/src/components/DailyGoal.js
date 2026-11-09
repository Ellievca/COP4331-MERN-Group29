import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/theme';
import { goalStyles as styles } from '../styles/components';
import { DAILY_GOAL } from '../utils/format';

const SIZE = 104;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// "Your daily rhythm": a ring filling up toward 20 cards, plus this week's days.
// `summary` comes from homeSummary() in utils/format.js.
export default function DailyGoal({ summary }) {
  const { todayReviewed, goalProgress, cardsToGoal, week } = summary;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your daily rhythm</Text>
          <Text style={styles.subtitle}>Small steps add up.</Text>
        </View>
        <Ionicons name="locate-outline" size={20} color={colors.purple} />
      </View>

      <View style={styles.body}>
        <View
          style={styles.ringWrap}
          accessible
          accessibilityLabel={`${todayReviewed} of ${DAILY_GOAL} cards reviewed today`}
        >
          <Svg width={SIZE} height={SIZE}>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={colors.ringTrack}
              strokeWidth={STROKE}
              fill="none"
            />
            {goalProgress > 0 ? (
              <Circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke={colors.ring}
                strokeWidth={STROKE}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${goalProgress * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              />
            ) : null}
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={styles.ringValue}>
              {todayReviewed}
              <Text style={styles.ringOf}> / {DAILY_GOAL}</Text>
            </Text>
            <Text style={styles.ringLabel}>cards today</Text>
          </View>
        </View>

        <Text style={styles.message}>
          <Text style={styles.messageStar}>✦ </Text>
          {cardsToGoal === 0
            ? 'Daily goal reached. Look at you go!'
            : `${cardsToGoal} more ${cardsToGoal === 1 ? 'card' : 'cards'} to your daily goal.`}
        </Text>
      </View>

      <View style={styles.week}>
        {week.map((day, index) => (
          <View
            key={index}
            style={styles.day}
            accessible
            accessibilityLabel={`${day.label} ${day.day}${day.practiced ? ', studied' : ''}${day.isToday ? ', today' : ''}`}
          >
            <Text style={styles.dayLabel}>{day.label}</Text>
            <View
              style={[
                styles.dayCircle,
                day.practiced && styles.dayPracticed,
                day.isToday && styles.dayToday,
              ]}
            >
              {day.practiced ? (
                <Ionicons name="checkmark" size={15} color={colors.purple} />
              ) : (
                <Text style={[styles.dayNumber, day.isToday && styles.dayNumberToday]}>
                  {day.day}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
