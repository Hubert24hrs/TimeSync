import { User, TeamMember, CalendarEvent, EnergyForecast, CulturalHoliday, ScheduleSuggestion, ChatMessage, OnboardingSlide } from '../types';
import { colors } from '../theme/colors';

export const currentUser: User = {
    id: 'user-001',
    name: 'Alex Chen',
    email: 'alex.chen@timesync.io',
    timezone: 'America/New_York',
    chronotype: 'wolf',
    avatar: undefined,
};

export const teamMembers: TeamMember[] = [
    { id: 'tm-001', name: 'Sarah Johnson', email: 'sarah@team.io', timezone: 'America/New_York', chronotype: 'lion', status: 'online', localTime: '10:30 AM', role: 'Product Manager', latitude: 40.7, longitude: -74.0 },
    { id: 'tm-002', name: 'James Williams', email: 'james@team.io', timezone: 'Europe/London', chronotype: 'bear', status: 'online', localTime: '3:30 PM', role: 'Backend Developer', latitude: 51.5, longitude: -0.1 },
    { id: 'tm-003', name: 'Yuki Tanaka', email: 'yuki@team.io', timezone: 'Asia/Tokyo', chronotype: 'dolphin', status: 'busy', localTime: '12:30 AM', role: 'UI Designer', latitude: 35.7, longitude: 139.7 },
    { id: 'tm-004', name: 'Priya Sharma', email: 'priya@team.io', timezone: 'Asia/Kolkata', chronotype: 'bear', status: 'online', localTime: '9:00 PM', role: 'ML Engineer', latitude: 28.6, longitude: 77.2 },
    { id: 'tm-005', name: 'Carlos Santos', email: 'carlos@team.io', timezone: 'America/Sao_Paulo', chronotype: 'wolf', status: 'away', localTime: '12:30 PM', role: 'iOS Developer', latitude: -23.5, longitude: -46.6 },
    { id: 'tm-006', name: 'Fatima Al-Rahman', email: 'fatima@team.io', timezone: 'Asia/Dubai', chronotype: 'lion', status: 'offline', localTime: '7:30 PM', role: 'QA Lead', latitude: 25.2, longitude: 55.3 },
    { id: 'tm-007', name: 'Emma Davis', email: 'emma@team.io', timezone: 'Australia/Sydney', chronotype: 'bear', status: 'online', localTime: '2:30 AM', role: 'Frontend Developer', latitude: -33.9, longitude: 151.2 },
    { id: 'tm-008', name: 'Kwame Asante', email: 'kwame@team.io', timezone: 'Africa/Lagos', chronotype: 'lion', status: 'online', localTime: '4:30 PM', role: 'DevOps Engineer', latitude: 6.5, longitude: 3.4 },
];

const today = new Date();
const formatDate = (d: Date): string => d.toISOString();
const dayOffset = (days: number, hours: number = 0, mins: number = 0): Date => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    d.setHours(hours, mins, 0, 0);
    return d;
};

export const calendarEvents: CalendarEvent[] = [
    {
        id: 'evt-001', title: 'Sprint Planning', description: 'Weekly sprint planning and task allocation', startTime: formatDate(dayOffset(0, 9, 0)), endTime: formatDate(dayOffset(0, 10, 0)),
        timezone: 'America/New_York', attendees: [{ id: 'tm-001', name: 'Sarah Johnson', email: 'sarah@team.io', status: 'accepted' }, { id: 'tm-002', name: 'James Williams', email: 'james@team.io', status: 'accepted' }],
        energyCost: 6, status: 'confirmed', color: colors.primary.main,
    },
    {
        id: 'evt-002', title: 'Design Review', description: 'Review new dashboard mockups', startTime: formatDate(dayOffset(0, 11, 30)), endTime: formatDate(dayOffset(0, 12, 30)),
        timezone: 'America/New_York', attendees: [{ id: 'tm-003', name: 'Yuki Tanaka', email: 'yuki@team.io', status: 'accepted' }],
        energyCost: 4, status: 'confirmed', color: colors.secondary.main,
    },
    {
        id: 'evt-003', title: 'AI Model Training Sync', description: 'Discuss latest ML model performance', startTime: formatDate(dayOffset(0, 14, 0)), endTime: formatDate(dayOffset(0, 14, 45)),
        timezone: 'America/New_York', attendees: [{ id: 'tm-004', name: 'Priya Sharma', email: 'priya@team.io', status: 'accepted' }],
        energyCost: 5, status: 'confirmed', color: colors.accent.pink,
    },
    {
        id: 'evt-004', title: 'Code Review Session', description: 'Review pull requests for v2.0', startTime: formatDate(dayOffset(1, 10, 0)), endTime: formatDate(dayOffset(1, 11, 0)),
        timezone: 'America/New_York', attendees: [{ id: 'tm-005', name: 'Carlos Santos', email: 'carlos@team.io', status: 'pending' }, { id: 'tm-007', name: 'Emma Davis', email: 'emma@team.io', status: 'accepted' }],
        energyCost: 4, status: 'tentative', color: colors.accent.yellow,
    },
    {
        id: 'evt-005', title: 'Global Standup', description: 'Cross-timezone daily standup', startTime: formatDate(dayOffset(1, 8, 0)), endTime: formatDate(dayOffset(1, 8, 30)),
        timezone: 'America/New_York', attendees: teamMembers.slice(0, 4).map((m) => ({ id: m.id, name: m.name, email: m.email, status: 'accepted' as const })),
        energyCost: 3, status: 'confirmed', color: colors.primary.light,
    },
    {
        id: 'evt-006', title: '1:1 with Sarah', description: 'Weekly one-on-one catch-up', startTime: formatDate(dayOffset(2, 15, 0)), endTime: formatDate(dayOffset(2, 15, 30)),
        timezone: 'America/New_York', attendees: [{ id: 'tm-001', name: 'Sarah Johnson', email: 'sarah@team.io', status: 'accepted' }],
        energyCost: 2, status: 'confirmed', color: colors.status.success,
    },
    {
        id: 'evt-007', title: 'Product Demo', description: 'Demo new features to stakeholders', startTime: formatDate(dayOffset(3, 13, 0)), endTime: formatDate(dayOffset(3, 14, 0)),
        timezone: 'America/New_York', attendees: teamMembers.slice(0, 6).map((m) => ({ id: m.id, name: m.name, email: m.email, status: 'accepted' as const })),
        energyCost: 8, status: 'confirmed', color: colors.accent.coral,
    },
    {
        id: 'evt-008', title: 'Focus Time', description: 'Protected deep work block', startTime: formatDate(dayOffset(0, 15, 0)), endTime: formatDate(dayOffset(0, 17, 0)),
        timezone: 'America/New_York', attendees: [],
        energyCost: 0, status: 'confirmed', color: colors.status.info,
    },
];

export const energyForecast: EnergyForecast[] = Array.from({ length: 7 }, (_, dayIdx) => ({
    date: formatDate(dayOffset(dayIdx)),
    hourly: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        level: Math.round(Math.max(1, Math.min(10,
            5 + 3 * Math.sin((hour - 14) * Math.PI / 12) + (Math.random() - 0.5) * 2
        ))),
    })),
    peakHours: [10, 11, 14, 15],
    lowHours: [6, 7, 22, 23],
    averageLevel: 6.5 + (Math.random() - 0.5),
}));

export const culturalHolidays: CulturalHoliday[] = [
    { id: 'ch-001', name: 'Lunar New Year', date: '2026-01-29', religion: 'Cultural', country: '🇨🇳 China / 🇻🇳 Vietnam', description: 'Celebration of the new year on the traditional Chinese calendar', observanceLevel: 'major', emoji: '🧧' },
    { id: 'ch-002', name: 'Maha Shivaratri', date: '2026-02-15', religion: 'Hindu', country: '🇮🇳 India', description: 'The great night of Lord Shiva, observed with fasting and prayer', observanceLevel: 'major', emoji: '🙏' },
    { id: 'ch-003', name: 'Purim', date: '2026-03-01', religion: 'Jewish', country: '🇮🇱 Israel', description: 'Celebrates the deliverance of the Jewish people from Haman', observanceLevel: 'major', emoji: '🎭' },
    { id: 'ch-004', name: 'Holi', date: '2026-03-10', religion: 'Hindu', country: '🇮🇳 India', description: 'Festival of Colors celebrating the arrival of spring', observanceLevel: 'major', emoji: '🎨' },
    { id: 'ch-005', name: 'Ramadan Start', date: '2026-02-18', religion: 'Islam', country: '🌍 Global', description: 'The holy month of fasting from dawn to sunset', observanceLevel: 'major', emoji: '🌙' },
    { id: 'ch-006', name: 'Easter', date: '2026-04-05', religion: 'Christian', country: '🌍 Global', description: 'Celebration of the resurrection of Jesus Christ', observanceLevel: 'major', emoji: '🐣' },
    { id: 'ch-007', name: 'Eid al-Fitr', date: '2026-03-20', religion: 'Islam', country: '🌍 Global', description: 'Festival marking the end of Ramadan fasting', observanceLevel: 'major', emoji: '🕌' },
    { id: 'ch-008', name: 'Vesak', date: '2026-05-12', religion: 'Buddhist', country: '🇹🇭 Thailand / 🇱🇰 Sri Lanka', description: "Celebrates Buddha's birth, enlightenment, and death", observanceLevel: 'major', emoji: '🪷' },
    { id: 'ch-009', name: 'Diwali', date: '2026-10-20', religion: 'Hindu', country: '🇮🇳 India', description: 'Festival of Lights celebrating the victory of light over darkness', observanceLevel: 'major', emoji: '🪔' },
    { id: 'ch-010', name: 'Yom Kippur', date: '2026-09-23', religion: 'Jewish', country: '🇮🇱 Israel', description: 'Day of Atonement, the holiest day in Judaism', observanceLevel: 'major', emoji: '✡️' },
    { id: 'ch-011', name: "International Women's Day", date: '2026-03-08', religion: 'Cultural', country: '🌍 Global', description: 'Celebrates women achievements and advocates for gender equality', observanceLevel: 'minor', emoji: '♀️' },
    { id: 'ch-012', name: 'Golden Week', date: '2026-04-29', religion: 'Cultural', country: '🇯🇵 Japan', description: 'Collection of national holidays in late April to early May', observanceLevel: 'major', emoji: '🏯' },
    { id: 'ch-013', name: 'Thanksgiving', date: '2026-11-26', religion: 'Cultural', country: '🇺🇸 USA', description: 'National holiday of giving thanks for the harvest', observanceLevel: 'major', emoji: '🦃' },
    { id: 'ch-014', name: 'Day of the Dead', date: '2026-11-01', religion: 'Cultural', country: '🇲🇽 Mexico', description: 'Honoring deceased loved ones with altars and offerings', observanceLevel: 'major', emoji: '💀' },
    { id: 'ch-015', name: 'Christmas', date: '2026-12-25', religion: 'Christian', country: '🌍 Global', description: 'Celebration of the birth of Jesus Christ', observanceLevel: 'major', emoji: '🎄' },
    { id: 'ch-016', name: 'Kwanzaa', date: '2026-12-26', religion: 'Cultural', country: '🇺🇸 USA', description: 'Week-long celebration of African heritage and culture', observanceLevel: 'minor', emoji: '🕯️' },
    { id: 'ch-017', name: 'Mid-Autumn Festival', date: '2026-10-03', religion: 'Cultural', country: '🇨🇳 China / 🇻🇳 Vietnam', description: 'Harvest festival celebrating the full moon with mooncakes', observanceLevel: 'major', emoji: '🥮' },
    { id: 'ch-018', name: 'Nowruz', date: '2026-03-20', religion: 'Cultural', country: '🇮🇷 Iran', description: 'Persian New Year marking the first day of spring', observanceLevel: 'major', emoji: '🌷' },
];

export const scheduleSuggestions: ScheduleSuggestion[] = [
    { id: 'sug-001', startTime: formatDate(dayOffset(1, 10, 0)), endTime: formatDate(dayOffset(1, 11, 0)), fairnessScore: 92, energyScore: 87, timezone: 'UTC', pros: ['Everyone is in peak hours', 'No cultural conflicts'], cons: ['Early for São Paulo'], confidence: 0.91 },
    { id: 'sug-002', startTime: formatDate(dayOffset(1, 14, 0)), endTime: formatDate(dayOffset(1, 15, 0)), fairnessScore: 85, energyScore: 74, timezone: 'UTC', pros: ['Good for most timezones', 'Post-lunch energy spike'], cons: ['Late for Tokyo', 'Lower energy for London'], confidence: 0.84 },
    { id: 'sug-003', startTime: formatDate(dayOffset(2, 8, 0)), endTime: formatDate(dayOffset(2, 9, 0)), fairnessScore: 78, energyScore: 91, timezone: 'UTC', pros: ['High energy window', 'Async option available'], cons: ['Very early for US West Coast', 'Late for Sydney'], confidence: 0.79 },
    { id: 'sug-004', startTime: formatDate(dayOffset(2, 16, 0)), endTime: formatDate(dayOffset(2, 17, 0)), fairnessScore: 88, energyScore: 68, timezone: 'UTC', pros: ['Fair rotation slot', 'Works for 6 of 8 members'], cons: ['Post-peak energy for most', 'Night for Tokyo'], confidence: 0.82 },
    { id: 'sug-005', startTime: formatDate(dayOffset(3, 12, 0)), endTime: formatDate(dayOffset(3, 13, 0)), fairnessScore: 95, energyScore: 82, timezone: 'UTC', pros: ['Optimal fairness', 'Mid-day for majority', 'No conflicts detected'], cons: ['Early morning for US West'], confidence: 0.93 },
];

export const initialChatMessages: ChatMessage[] = [
    {
        id: 'msg-001',
        text: "Hey! 👋 I'm TimeSync AI, your smart scheduling assistant. I can help you find the perfect meeting time, analyze your energy patterns, or resolve scheduling conflicts. What can I do for you today?",
        sender: 'ai',
        timestamp: formatDate(new Date()),
        quickReplies: ['Schedule a meeting', 'Find best time for team', 'Check my energy', 'Show conflicts'],
    },
];

export const onboardingSlides: OnboardingSlide[] = [
    { id: 'slide-1', title: 'Smart Scheduling', description: 'AI-powered scheduling that finds the perfect time for everyone, across all timezones.', icon: '📅', gradient: colors.gradients.cosmic },
    { id: 'slide-2', title: 'Energy Aware', description: 'Track your energy patterns and schedule meetings when you and your team are at peak performance.', icon: '⚡', gradient: colors.gradients.ocean },
    { id: 'slide-3', title: 'Global Teams', description: 'Visualize your team across the world with cultural awareness and fair timezone rotation.', icon: '🌍', gradient: colors.gradients.sunset },
    { id: 'slide-4', title: 'AI Assistant', description: 'Just tell me what you need in plain English and I\'ll handle the rest — scheduling, conflicts, and optimization.', icon: '🤖', gradient: colors.gradients.primary },
];
