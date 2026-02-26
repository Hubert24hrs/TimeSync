import { colors } from '../theme/colors';
import { ChronotypeResult } from '../types';

export const chronotypes: Record<string, ChronotypeResult> = {
    lion: {
        type: 'lion',
        confidence: 0.85,
        peakHours: [6, 7, 8, 9, 10],
        description: 'Early riser. You thrive in the morning hours with peak focus between 6-10 AM. Your energy naturally dips in the afternoon.',
        emoji: '🦁',
        color: colors.chronotype.lion,
    },
    bear: {
        type: 'bear',
        confidence: 0.82,
        peakHours: [10, 11, 12, 13, 14],
        description: 'You follow the solar cycle naturally. Your peak productivity is mid-morning to early afternoon, 10 AM - 2 PM.',
        emoji: '🐻',
        color: colors.chronotype.bear,
    },
    wolf: {
        type: 'wolf',
        confidence: 0.88,
        peakHours: [17, 18, 19, 20, 21],
        description: 'Night owl at heart. You come alive in the evening with peak creativity and focus from 5-9 PM.',
        emoji: '🐺',
        color: colors.chronotype.wolf,
    },
    dolphin: {
        type: 'dolphin',
        confidence: 0.78,
        peakHours: [10, 11, 15, 16],
        description: 'Light sleeper with irregular patterns. Your energy spikes are unpredictable but you excel in bursts of intense focus.',
        emoji: '🐬',
        color: colors.chronotype.dolphin,
    },
};

export const chronotypeQuizOptions = [
    {
        type: 'lion' as const,
        emoji: '🦁',
        title: 'Lion',
        subtitle: 'Early Bird',
        description: 'I wake up before the alarm and feel most productive in the morning',
        color: colors.chronotype.lion,
    },
    {
        type: 'bear' as const,
        emoji: '🐻',
        title: 'Bear',
        subtitle: 'Solar Cycle',
        description: 'I follow a normal sleep schedule and peak around mid-morning',
        color: colors.chronotype.bear,
    },
    {
        type: 'wolf' as const,
        emoji: '🐺',
        title: 'Wolf',
        subtitle: 'Night Owl',
        description: 'I come alive at night and do my best work in the evening',
        color: colors.chronotype.wolf,
    },
    {
        type: 'dolphin' as const,
        emoji: '🐬',
        title: 'Dolphin',
        subtitle: 'Light Sleeper',
        description: 'I have irregular sleep and energy patterns with burst productivity',
        color: colors.chronotype.dolphin,
    },
];
