import React, { useState } from 'react';
import {
  Sparkles,
  Star,
  Award,
  Sun,
  BookOpen,
  Heart,
  Palette,
  Clock,
  Printer,
  Smile,
  CheckCircle2,
  Calendar,
  Coffee,
  HelpCircle,
  Apple,
} from 'lucide-react';
import { useStudentProfile } from '../../hooks/useStudentData';

export const PrimaryAcademicView: React.FC = () => {
  const { data: profile } = useStudentProfile();
  const [activeModule, setActiveModule] = useState<'report' | 'schedule' | 'badges'>('report');
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

  // Simplified Subject Progress with Star Ratings
  const primarySubjects = [
    {
      subject: 'Reading & Phonics Adventures',
      stars: 5,
      ratingText: 'Super Reader!',
      note: 'Reads clearly with fantastic expression and finished 12 storybooks this term.',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      badgeColor: 'text-amber-500',
    },
    {
      subject: 'Fun with Numbers & Math',
      stars: 5,
      ratingText: 'Math Wizard!',
      note: 'Understands times tables, fun fractions, and geometry shapes with ease.',
      color: 'bg-sky-50 text-sky-900 border-sky-200',
      badgeColor: 'text-sky-500',
    },
    {
      subject: 'Nature, Science & Discovery',
      stars: 4,
      ratingText: 'Curious Explorer!',
      note: 'Loved the plant germination experiment and class weather chart.',
      color: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      badgeColor: 'text-emerald-500',
    },
    {
      subject: 'Creative Art & Handcrafts',
      stars: 5,
      ratingText: 'Star Artist!',
      note: 'Very neat pencil grip, beautiful color shading, and creative paper origami.',
      color: 'bg-purple-50 text-purple-900 border-purple-200',
      badgeColor: 'text-purple-500',
    },
    {
      subject: 'Good Habits, Kindness & Sharing',
      stars: 5,
      ratingText: 'Helpful Friend!',
      note: 'Always shares stationery with peers and greets teachers with cheerful enthusiasm.',
      color: 'bg-rose-50 text-rose-900 border-rose-200',
      badgeColor: 'text-rose-500',
    },
    {
      subject: 'Play, Sports & Games',
      stars: 5,
      ratingText: 'Energetic Champ!',
      note: 'Fast runner on sports day and demonstrates wonderful team spirit.',
      color: 'bg-teal-50 text-teal-900 border-teal-200',
      badgeColor: 'text-teal-500',
    },
  ];

  // Daily Schedule for Primary Kids
  const dailyLessons = [
    {
      time: '08:00 - 08:30 AM',
      activity: 'Morning Assembly & School Anthems',
      desc: 'Singing inspiring songs, morning prayers, and healthy posture exercise.',
      icon: Sun,
      bgColor: 'bg-amber-100 text-amber-800',
    },
    {
      time: '08:30 - 09:30 AM',
      activity: 'Phonics & Storybook Reading',
      desc: 'Adventure stories, letter blending, vowel sounds, and picture vocabulary.',
      icon: BookOpen,
      bgColor: 'bg-sky-100 text-sky-800',
    },
    {
      time: '09:30 - 10:30 AM',
      activity: 'Fun with Numbers & Addition',
      desc: 'Counting colorful blocks, fun shape puzzles, and multiplication songs.',
      icon: Sparkles,
      bgColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      time: '10:30 - 11:15 AM',
      activity: 'Snack Break & Playground Recess',
      desc: 'Eating fruits & snacks, swings, slides, and outdoor laughter with friends.',
      icon: Apple,
      bgColor: 'bg-rose-100 text-rose-800',
    },
    {
      time: '11:15 - 12:15 PM',
      activity: 'Nature, Animals & Science Wonders',
      desc: 'Discovering birds, garden insects, rainfall, and sunshine experiments.',
      icon: Heart,
      bgColor: 'bg-teal-100 text-teal-800',
    },
    {
      time: '12:15 - 01:00 PM',
      activity: 'Painting, Play-Doh & Crafts',
      desc: 'Creative drawing, molding funny animals, and coloring paper rainbows.',
      icon: Palette,
      bgColor: 'bg-purple-100 text-purple-800',
    },
    {
      time: '01:00 - 01:30 PM',
      activity: 'Closing Circle & Pack Up for Home',
      desc: 'Story of the day recap, star stickers giveaway, and packing school bags.',
      icon: Smile,
      bgColor: 'bg-amber-100 text-amber-800',
    },
  ];

  // Achievement Badges
  const badgesList = [
    {
      id: 'star-pupil',
      title: 'Star Pupil of the Month',
      desc: 'Awarded for overall academic excellence, cheerful participation, and great manners.',
      badgeEmoji: '🌟',
      color: 'bg-amber-100 border-amber-300 text-amber-950',
      awardedDate: 'September 2026',
    },
    {
      id: 'golden-pencil',
      title: 'Golden Pencil Award',
      desc: 'Recognized for remarkably neat cursive handwriting and clean homework books.',
      badgeEmoji: '✏️',
      color: 'bg-sky-100 border-sky-300 text-sky-950',
      awardedDate: 'September 2026',
    },
    {
      id: 'kindness-hero',
      title: 'Kindness & Friendship Medal',
      desc: 'Awarded for helping younger classmates tie shoelaces and sharing snacks willingly.',
      badgeEmoji: '💖',
      color: 'bg-rose-100 border-rose-300 text-rose-950',
      awardedDate: 'September 2026',
    },
    {
      id: 'reading-champ',
      title: 'Reading Tree Champion',
      desc: 'Successfully read 12 illustrated storybooks during library reading hours.',
      badgeEmoji: '📚',
      color: 'bg-emerald-100 border-emerald-300 text-emerald-950',
      awardedDate: 'September 2026',
    },
    {
      id: 'early-bird',
      title: 'Early Bird Attendance Pin',
      desc: 'Arrived at the school gate before the first morning bell every single day!',
      badgeEmoji: '⏰',
      color: 'bg-teal-100 border-teal-300 text-teal-950',
      awardedDate: 'September 2026',
    },
    {
      id: 'maths-whiz',
      title: 'Number Magic Trophy',
      desc: 'Achieved 100% in weekly mental math flashcards and shape recognition quizzes.',
      badgeEmoji: '🏆',
      color: 'bg-indigo-100 border-indigo-300 text-indigo-950',
      awardedDate: 'September 2026',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Primary Header Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-amber-200/60 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
              <span>🌟</span>
              <span>COEKA Staff Primary School</span>
            </span>
            <span className="text-xs font-semibold text-slate-500">Basic 4 Learning Garden</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0B192C] tracking-tight mt-1 flex items-center gap-2">
            <span>Primary Pupil Academic Garden</span>
            <span className="text-lg">🎈</span>
          </h2>
        </div>

        {/* 3 Playful Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-amber-50/80 rounded-2xl border border-amber-200 self-start sm:self-auto overflow-x-auto max-w-full">
          {[
            { id: 'report', label: 'My Star Report', icon: Star },
            { id: 'schedule', label: 'Daily Lesson Fun', icon: Calendar },
            { id: 'badges', label: 'Reward Badges', icon: Award },
          ].map((m) => {
            const Icon = m.icon;
            const active = activeModule === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveModule(m.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#0B192C] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-amber-100/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-amber-400' : 'text-amber-600'}`} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODULE 1: SIMPLIFIED VISUAL STAR REPORT CARD */}
      {activeModule === 'report' && (
        <div className="space-y-6 animate-fade-in">
          {/* Playful Banner for Parent & Child */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-slate-900 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 border border-amber-300">
            <div className="space-y-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/70 text-slate-900 font-mono">
                First Term 2026/2027 Progress Card
              </span>
              <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                <span>Great Job, {profile?.fullName || 'Pri Test'}!</span>
                <span>🎉</span>
              </h3>
              <p className="text-xs text-slate-800 max-w-lg leading-relaxed">
                You are growing brilliantly every day! Here is your official teacher progress card with stars and stickers.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white shrink-0 shadow-xs">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Class Standing</span>
                <span className="text-3xl font-black text-amber-700 font-mono">5.0 ★</span>
                <span className="text-[10px] text-emerald-700 font-bold block">Excellent Pupil</span>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0B192C] text-white hover:bg-slate-900 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Card</span>
              </button>
            </div>
          </div>

          {/* Child Identity Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white border border-amber-200/70 text-xs shadow-2xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Pupil's Name</span>
              <span className="font-black text-slate-900 block">{profile?.fullName || 'Pri Test'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Roll / Pupil ID</span>
              <span className="font-mono font-bold text-slate-900 block">{profile?.matricNumber || 'SPS/2026/PRI/904'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Class & Grade</span>
              <span className="font-bold text-amber-800 block">Basic 4 — Sunshine Garden</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Head Teacher</span>
              <span className="font-bold text-emerald-800 block">Mrs. Eunice Ikyur</span>
            </div>
          </div>

          {/* Subject Star Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {primarySubjects.map((s, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-3xl border shadow-xs transition-all hover:scale-[1.01] ${s.color} space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black tracking-tight">{s.subject}</h4>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white/80 shadow-2xs">
                    {s.ratingText}
                  </span>
                </div>

                {/* Stars visual display */}
                <div className="flex items-center gap-1.5 text-lg">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={i < s.stars ? s.badgeColor : 'text-slate-300 opacity-40'}
                    >
                      ★
                    </span>
                  ))}
                  <span className="text-xs font-bold font-mono ml-2">({s.stars} / 5 Stars)</span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-white/60 p-2.5 rounded-xl border border-white/80">
                  {s.note}
                </p>
              </div>
            ))}
          </div>

          {/* Teacher's Heartfelt Note */}
          <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 shadow-xs flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl shrink-0">
              💌
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase text-amber-900 tracking-wider">
                Teacher's Personal Encouragement Note
              </span>
              <p className="text-xs text-slate-800 italic leading-relaxed">
                "Pri is an absolute delight in Basic 4! Always raising hands with a cheerful bright smile. Excellent effort in reading comprehension and mental math. Parents should encourage reading two pages every bedtime."
              </p>
              <div className="flex items-center gap-2 pt-2 text-[11px] font-bold text-slate-600">
                <span>— Mrs. Eunice Ikyur (Basic 4 Lead Educator)</span>
                <span>•</span>
                <span className="text-emerald-700">Official Gold Star Awarded ⭐</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: DAILY LESSON SCHEDULE */}
      {activeModule === 'schedule' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>Our Daily School Day Fun</span>
                  <span>⏰</span>
                </h3>
                <p className="text-xs text-slate-500">Timetable of today's learning and playtime adventures</p>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                Bell Rings: 08:00 AM - 01:30 PM
              </span>
            </div>

            <div className="space-y-3">
              {dailyLessons.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-amber-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.bgColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-black text-slate-900 block text-sm">{item.activity}</span>
                        <span className="text-slate-600 text-[11px]">{item.desc}</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-600 bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-[11px] self-start sm:self-auto shrink-0 shadow-2xs">
                      {item.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: ACHIEVEMENT BADGES & REWARDS */}
      {activeModule === 'badges' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>Pri's Achievement Badges & Gold Medals</span>
                  <span>🏆</span>
                </h3>
                <p className="text-xs text-slate-500">Collect awards and merit stickers for outstanding habits</p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                6 of 6 Badges Unlocked!
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badgesList.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBadge(b.id)}
                  className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col items-center text-center space-y-2.5 hover:scale-105 shadow-xs ${b.color}`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/90 flex items-center justify-center text-3xl shadow-xs border border-white">
                    {b.badgeEmoji}
                  </div>
                  <h4 className="font-black text-sm">{b.title}</h4>
                  <p className="text-xs text-slate-700 leading-snug">{b.desc}</p>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-white/80 rounded-full">
                    Awarded: {b.awardedDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
