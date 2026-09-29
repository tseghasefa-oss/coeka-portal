import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  Pin,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Globe2,
  Layout,
  Users,
  GraduationCap,
  Briefcase,
  UserCheck,
  ShieldAlert,
  Clock,
  ExternalLink,
  ChevronRight,
  Check,
  X,
  Sparkles,
  ArrowRight,
  Monitor,
  Smartphone,
  Info,
} from 'lucide-react';
import {
  useBulletinStore,
  INITIAL_BULLETINS,
} from '../../stores/useBulletinStore';
import {
  InstitutionalBulletin,
  BulletinPlacement,
  BulletinAudience,
  BulletinCategory,
  BulletinPriority,
} from '../../../types/bulletin';

const PLACEMENT_OPTIONS: { id: BulletinPlacement; label: string; icon: React.FC<{ className?: string }>; description: string }[] = [
  { id: 'WEBSITE_TICKER', label: 'Website Top Strip (Ticker)', icon: Radio, description: 'Live rotating bar at top of website' },
  { id: 'WEBSITE_NOTICEBOARD', label: 'Campus Notice Board', icon: Globe2, description: 'Public news & official bulletins section' },
  { id: 'STUDENT_DASHBOARD', label: 'Student SIMS Dashboard', icon: GraduationCap, description: 'In-app student dashboard newsfeed' },
  { id: 'STAFF_PORTAL', label: 'Staff & Lecturer Portal', icon: Briefcase, description: 'Faculty & non-academic staff workspace' },
  { id: 'ADMISSIONS_PORTAL', label: 'Admissions Gateway', icon: UserCheck, description: 'Candidate screening & application portal' },
];

const AUDIENCE_OPTIONS: { id: BulletinAudience; label: string; icon: React.FC<{ className?: string }>; description: string }[] = [
  { id: 'ALL', label: 'Everyone (Public)', icon: Globe2, description: 'All visitors and registered portal accounts' },
  { id: 'STUDENTS', label: 'Enrolled Students', icon: GraduationCap, description: 'NCE, Degree, Secondary & Primary students' },
  { id: 'STAFF', label: 'Staff & Faculty', icon: Briefcase, description: 'Lecturers, HODs, Deans & Administrators' },
  { id: 'APPLICANTS', label: 'Prospective Applicants', icon: UserCheck, description: 'Fresh candidates undergoing admission screening' },
  { id: 'ADMIN', label: 'Administrators Only', icon: ShieldAlert, description: 'SuperAdmins and Governance Officers' },
];

const CATEGORY_OPTIONS: BulletinCategory[] = [
  'Admissions',
  'Academic',
  'Hostel',
  'Bursary',
  'General',
  'Emergency',
];

export const BulletinManager: React.FC = () => {
  const {
    bulletins,
    addBulletin,
    updateBulletin,
    deleteBulletin,
    togglePublish,
    togglePin,
    resetToDefaults,
  } = useBulletinStore();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlacement, setFilterPlacement] = useState<BulletinPlacement | 'ALL'>('ALL');
  const [filterAudience, setFilterAudience] = useState<BulletinAudience | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<BulletinCategory | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');

  // Modal States
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingBulletin, setEditingBulletin] = useState<InstitutionalBulletin | null>(null);
  const [previewingBulletin, setPreviewingBulletin] = useState<InstitutionalBulletin | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State for Composer
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<BulletinCategory>('General');
  const [formPriority, setFormPriority] = useState<BulletinPriority>('NORMAL');
  const [formAuthor, setFormAuthor] = useState('Office of the Registrar');
  const [formDate, setFormDate] = useState('September 29, 2026');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formPlacements, setFormPlacements] = useState<BulletinPlacement[]>(['WEBSITE_TICKER', 'WEBSITE_NOTICEBOARD']);
  const [formAudiences, setFormAudiences] = useState<BulletinAudience[]>(['ALL']);
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formPinToTop, setFormPinToTop] = useState(false);
  const [simulatorDevice, setSimulatorDevice] = useState<'desktop' | 'mobile'>('desktop');

  const openCreateModal = () => {
    setEditingBulletin(null);
    setFormTitle('');
    setFormCategory('General');
    setFormPriority('NORMAL');
    setFormAuthor('Office of the Registrar');
    setFormDate(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
    setFormSummary('');
    setFormContent('');
    setFormPlacements(['WEBSITE_TICKER', 'WEBSITE_NOTICEBOARD']);
    setFormAudiences(['ALL']);
    setFormIsPublished(true);
    setFormPinToTop(false);
    setComposerOpen(true);
  };

  const openEditModal = (bulletin: InstitutionalBulletin) => {
    setEditingBulletin(bulletin);
    setFormTitle(bulletin.title);
    setFormCategory(bulletin.category);
    setFormPriority(bulletin.priority);
    setFormAuthor(bulletin.author);
    setFormDate(bulletin.date);
    setFormSummary(bulletin.summary);
    setFormContent(bulletin.content);
    setFormPlacements(bulletin.placements);
    setFormAudiences(bulletin.audiences);
    setFormIsPublished(bulletin.isPublished);
    setFormPinToTop(bulletin.pinToTop);
    setComposerOpen(true);
  };

  const handleSaveBulletin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingBulletin) {
      updateBulletin(editingBulletin.id, {
        title: formTitle.trim(),
        category: formCategory,
        priority: formPriority,
        author: formAuthor.trim() || 'Office of the Registrar',
        date: formDate,
        summary: formSummary.trim(),
        content: formContent.trim(),
        placements: formPlacements.length > 0 ? formPlacements : ['WEBSITE_NOTICEBOARD'],
        audiences: formAudiences.length > 0 ? formAudiences : ['ALL'],
        isPublished: formIsPublished,
        pinToTop: formPinToTop,
      });
    } else {
      addBulletin({
        title: formTitle.trim(),
        category: formCategory,
        priority: formPriority,
        author: formAuthor.trim() || 'Office of the Registrar',
        date: formDate,
        summary: formSummary.trim(),
        content: formContent.trim(),
        placements: formPlacements.length > 0 ? formPlacements : ['WEBSITE_NOTICEBOARD'],
        audiences: formAudiences.length > 0 ? formAudiences : ['ALL'],
        isPublished: formIsPublished,
        pinToTop: formPinToTop,
      });
    }
    setComposerOpen(false);
  };

  const togglePlacementSelection = (placement: BulletinPlacement) => {
    if (formPlacements.includes(placement)) {
      setFormPlacements(formPlacements.filter((p) => p !== placement));
    } else {
      setFormPlacements([...formPlacements, placement]);
    }
  };

  const toggleAudienceSelection = (audience: BulletinAudience) => {
    if (formAudiences.includes(audience)) {
      if (formAudiences.length > 1) {
        setFormAudiences(formAudiences.filter((a) => a !== audience));
      }
    } else {
      setFormAudiences([...formAudiences, audience]);
    }
  };

  // Filtered Bulletins
  const filteredBulletins = bulletins.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.summary.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlacement = filterPlacement === 'ALL' || b.placements.includes(filterPlacement);
    const matchesAudience = filterAudience === 'ALL' || b.audiences.includes(filterAudience) || b.audiences.includes('ALL');
    const matchesCategory = filterCategory === 'ALL' || b.category === filterCategory;
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'PUBLISHED' && b.isPublished) ||
      (filterStatus === 'DRAFT' && !b.isPublished);

    return matchesSearch && matchesPlacement && matchesAudience && matchesCategory && matchesStatus;
  });

  // KPI calculations
  const totalCount = bulletins.length;
  const activeCount = bulletins.filter((b) => b.isPublished).length;
  const tickerCount = bulletins.filter((b) => b.isPublished && b.placements.includes('WEBSITE_TICKER')).length;
  const highPriorityCount = bulletins.filter((b) => b.isPublished && (b.priority === 'HIGH' || b.priority === 'URGENT')).length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* ===================================================================== */}
      {/* 1. SUITE HEADER BANNER                                                */}
      {/* ===================================================================== */}
      <div className="bg-[#0B192C] text-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-amber-300 text-xs font-bold tracking-wide">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Campus Broadcast & Notification Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Institutional Bulletin & Broadcast Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
            Create, schedule, and broadcast official announcements across target touchpoints. Select granularly where bulletins appear (website ticker, notice boards, SIMS) and target specific viewer groups.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10">
          <button
            type="button"
            onClick={resetToDefaults}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer"
            title="Reset to default COEKA institutional bulletins"
          >
            Reset Defaults
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs text-[#0B192C] bg-amber-400 hover:bg-amber-300 shadow-md shadow-amber-400/20 hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#0B192C]" />
            <span>Compose New Bulletin</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. STATS & KPI RIBBON                                                 */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Bulletins</span>
          <div className="text-2xl sm:text-3xl font-black text-[#0B192C] mt-2">{totalCount}</div>
          <span className="text-[11px] text-slate-400 font-medium mt-1">Archived & Active</span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Live Broadcasts</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">{activeCount}</div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1">Publicly Visible</span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Website Tickers</span>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 mt-2">{tickerCount}</div>
          <span className="text-[11px] text-blue-700 font-semibold mt-1">Top Bar Rotation</span>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">High / Urgent Alerts</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">{highPriorityCount}</div>
          <span className="text-[11px] text-amber-700 font-semibold mt-1">Priority Attention</span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. SEARCH & CHANNEL FILTERS                                           */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search bulletins by title, author, keyword..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e: any) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="PUBLISHED">Published Only</option>
              <option value="DRAFT">Drafts Only</option>
            </select>

            {/* Filter by Category */}
            <select
              value={filterCategory}
              onChange={(e: any) => setFilterCategory(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Channel Placement Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-500 text-[11px] mr-1 flex items-center gap-1">
            <Layout className="w-3.5 h-3.5 text-blue-600" />
            <span>Channel Placement:</span>
          </span>

          <button
            type="button"
            onClick={() => setFilterPlacement('ALL')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              filterPlacement === 'ALL'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Channels
          </button>

          {PLACEMENT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilterPlacement(opt.id)}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                filterPlacement === opt.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <opt.icon className="w-3 h-3" />
              <span>{opt.label.split('(')[0].trim()}</span>
            </button>
          ))}
        </div>

        {/* Audience Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 text-[11px] mr-1 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Target Audience:</span>
          </span>

          <button
            type="button"
            onClick={() => setFilterAudience('ALL')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              filterAudience === 'ALL'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Viewers
          </button>

          {AUDIENCE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilterAudience(opt.id)}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                filterAudience === opt.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <opt.icon className="w-3 h-3" />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. BULLETIN LISTING / TABLE                                           */}
      {/* ===================================================================== */}
      <div className="space-y-3">
        {filteredBulletins.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
            <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Bulletins Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No institutional bulletins match your search criteria. Try modifying your filters or compose a new announcement.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B192C] text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Compose Bulletin</span>
            </button>
          </div>
        ) : (
          filteredBulletins.map((bulletin) => (
            <div
              key={bulletin.id}
              className={`bg-white rounded-2xl p-5 border transition-all shadow-xs hover:shadow-md ${
                bulletin.isPublished ? 'border-slate-200/90' : 'border-dashed border-slate-300 bg-slate-50/50'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Left: Info & Metadata */}
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Priority Badge */}
                    {bulletin.priority === 'URGENT' && (
                      <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                        URGENT
                      </span>
                    )}
                    {bulletin.priority === 'HIGH' && (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                        HIGH PRIORITY
                      </span>
                    )}
                    {bulletin.priority === 'NORMAL' && (
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                        NORMAL
                      </span>
                    )}

                    {/* Category Tag */}
                    <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full text-[10px] uppercase">
                      {bulletin.category}
                    </span>

                    {/* Pin indicator */}
                    {bulletin.pinToTop && (
                      <span className="text-amber-600 bg-amber-50 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Pin className="w-2.5 h-2.5" />
                        <span>Pinned</span>
                      </span>
                    )}

                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 font-medium text-[11px]">{bulletin.date}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-semibold text-[11px]">{bulletin.author}</span>
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-[#0B192C] leading-snug">
                      {bulletin.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {bulletin.summary || bulletin.content}
                    </p>
                  </div>

                  {/* Target Placement & Audience Badges */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-400 font-bold uppercase text-[9.5px]">Appears in:</span>
                      {bulletin.placements.map((p) => {
                        const opt = PLACEMENT_OPTIONS.find((item) => item.id === p);
                        return (
                          <span
                            key={p}
                            className="bg-slate-100 border border-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[10px] inline-flex items-center gap-1"
                          >
                            {opt && <opt.icon className="w-2.5 h-2.5 text-blue-600" />}
                            <span>{opt ? opt.label.split('(')[0].trim() : p}</span>
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-400 font-bold uppercase text-[9.5px]">Audience:</span>
                      {bulletin.audiences.map((a) => (
                        <span
                          key={a}
                          className="bg-emerald-50 border border-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-md font-semibold text-[10px]"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Status Switch & Action Controls */}
                <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {/* Publish Switch */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => togglePublish(bulletin.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        bulletin.isPublished ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                      title={bulletin.isPublished ? 'Click to unpublish (Set to Draft)' : 'Click to publish live'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          bulletin.isPublished ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-bold text-slate-700">
                      {bulletin.isPublished ? 'Live' : 'Draft'}
                    </span>
                  </div>

                  {/* Pin to Top */}
                  <button
                    type="button"
                    onClick={() => togglePin(bulletin.id)}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                      bulletin.pinToTop
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-white hover:bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                    title={bulletin.pinToTop ? 'Unpin from top' : 'Pin to top of listings'}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>

                  {/* Preview Modal */}
                  <button
                    type="button"
                    onClick={() => setPreviewingBulletin(bulletin)}
                    className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                    title="Preview full bulletin card"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => openEditModal(bulletin)}
                    className="p-2 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer"
                    title="Edit bulletin details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => setDeletingId(bulletin.id)}
                    className="p-2 rounded-xl bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 transition-colors cursor-pointer"
                    title="Delete bulletin"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* ===================================================================== */}
      {/* 5. COMPOSER & EDIT MODAL WITH LIVE SIMULATOR                          */}
      {/* ===================================================================== */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0B192C]">
                    {editingBulletin ? 'Edit Institutional Bulletin' : 'Compose New Official Bulletin'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure content, channel placements, and target audience segmentation.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2 Columns (Form + Simulator) */}
            <form onSubmit={handleSaveBulletin} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Form Fields (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bulletin Headline / Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. 2026/2027 Academic Session Admissions Exercise Commences"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>

                {/* Category & Priority Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e: any) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:outline-none"
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
                    <select
                      value={formPriority}
                      onChange={(e: any) => setFormPriority(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:outline-none"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High Priority</option>
                      <option value="URGENT">Urgent / Emergency</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Publish Date</label>
                    <input
                      type="text"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      placeholder="e.g. September 29, 2026"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Author Designation */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Author / Issuing Authority
                  </label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="e.g. Office of the Registrar, Directorate of Student Affairs"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none"
                  />
                </div>

                {/* ========================================================= */}
                {/* WHERE IT WILL APPEAR (CHANNEL PLACEMENT SELECTION)        */}
                {/* ========================================================= */}
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                      <Layout className="w-3.5 h-3.5 text-blue-700" />
                      <span>Where it will appear (Placements)</span>
                    </label>
                    <span className="text-[10px] text-blue-700 font-semibold">Select all that apply</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PLACEMENT_OPTIONS.map((opt) => {
                      const isSelected = formPlacements.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          onClick={() => togglePlacementSelection(opt.id)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border shrink-0 ${
                            isSelected ? 'bg-white text-blue-700 border-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold leading-tight flex items-center gap-1">
                              <opt.icon className="w-3 h-3 shrink-0" />
                              <span className="truncate">{opt.label}</span>
                            </div>
                            <div className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                              {opt.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ========================================================= */}
                {/* WHO CAN SEE IT (AUDIENCE TARGETING)                       */}
                {/* ========================================================= */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Who can see it (Target Audience)</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold">Audience filtering</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AUDIENCE_OPTIONS.map((opt) => {
                      const isSelected = formAudiences.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          onClick={() => toggleAudienceSelection(opt.id)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border shrink-0 ${
                            isSelected ? 'bg-white text-emerald-700 border-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold leading-tight flex items-center gap-1">
                              <opt.icon className="w-3 h-3 shrink-0" />
                              <span className="truncate">{opt.label}</span>
                            </div>
                            <div className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                              {opt.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Short Summary (1-2 sentences for tickers and cards)
                  </label>
                  <textarea
                    rows={2}
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    placeholder="Brief description that displays on the home ticker and card summaries..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                {/* Full Content */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Complete Bulletin Content & Directives <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Enter complete institutional circular, eligibility criteria, schedules, guidelines..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                    required
                  />
                </div>

                {/* Publication Controls */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={formPinToTop}
                      onChange={(e) => setFormPinToTop(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                    />
                    <span>Pin to top of listings</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={formIsPublished}
                      onChange={(e) => setFormIsPublished(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Publish live immediately</span>
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setComposerOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0B192C] font-black text-xs shadow-md transition-all cursor-pointer"
                  >
                    <span>{editingBulletin ? 'Update Bulletin' : 'Broadcast Bulletin'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

              {/* Right Column: Live Multi-Device Simulator (5 Cols) */}
              <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Live Multi-Device Simulator
                    </span>
                  </div>

                  <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setSimulatorDevice('desktop')}
                      className={`px-2 py-1 rounded-md font-bold flex items-center gap-1 ${
                        simulatorDevice === 'desktop' ? 'bg-[#0B192C] text-white' : 'text-slate-500'
                      }`}
                    >
                      <Monitor className="w-3 h-3" />
                      <span>Desktop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatorDevice('mobile')}
                      className={`px-2 py-1 rounded-md font-bold flex items-center gap-1 ${
                        simulatorDevice === 'mobile' ? 'bg-[#0B192C] text-white' : 'text-slate-500'
                      }`}
                    >
                      <Smartphone className="w-3 h-3" />
                      <span>Mobile</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Simulates how your bulletin appears on live target channels as you edit.
                </p>

                {/* 1. Website Ticker Simulation */}
                {formPlacements.includes('WEBSITE_TICKER') && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Channel: Website Top Ticker Strip
                    </span>
                    <div className="bg-[#0B192C] text-white p-2 rounded-xl border border-slate-800 flex items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0">
                          Bulletin
                        </span>
                        <span className="text-[11px] text-slate-200 truncate font-medium">
                          {formTitle || 'Sample Bulletin Headline'}
                        </span>
                      </div>
                      <span className="text-[9px] text-amber-400 font-bold hidden sm:inline shrink-0">
                        Read →
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. Notice Board / SIMS Card Simulation */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Channel: Campus Notice Board & SIMS Card
                  </span>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                        {formCategory}
                      </span>
                      <span className="text-slate-400">{formDate}</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {formTitle || 'Headline will appear here'}
                    </h4>

                    <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                      {formSummary || formContent || 'Enter content to preview description...'}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{formAuthor}</span>
                      <span className="text-blue-600 font-bold">Read Full Notice</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200/80 text-[11px] text-blue-900 leading-relaxed flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    Changes made here propagate instantaneously to Cloudflare D1 and are reflected across website and portal consumers.
                  </span>
                </div>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. FULL BULLETIN PREVIEW MODAL                                        */}
      {/* ===================================================================== */}
      {previewingBulletin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  {previewingBulletin.category}
                </span>
                <span className="text-xs text-slate-400">• {previewingBulletin.date}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingBulletin(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#0B192C]">
                {previewingBulletin.title}
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Issued by: {previewingBulletin.author} • College of Education, Katsina-Ala
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
              {previewingBulletin.content}
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="font-bold">Target Placements:</span>
                <span>{previewingBulletin.placements.join(', ')}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingBulletin(null)}
                className="px-4 py-2 rounded-xl bg-[#0B192C] text-white font-bold text-xs hover:bg-slate-800"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. DELETE CONFIRMATION MODAL                                          */}
      {/* ===================================================================== */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-black text-slate-900">Remove Bulletin Broadcast?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This action will permanently delete this bulletin across all targeted channels (Website Ticker, Campus Notice Board, and SIMS Dashboards). Are you sure you wish to proceed?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteBulletin(deletingId);
                  setDeletingId(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-xs transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
