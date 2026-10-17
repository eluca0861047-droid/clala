import React, { useState, useMemo } from 'react';
import { useReservation } from '../../context/ReservationContext';
import { DayOfWeek } from '../../types';
import { DAY_NAMES, TIME_SLOTS } from '../../utils/dateUtils';
import {
  Plus,
  Trash2,
  Calendar,
  Phone,
  UserPlus,
  X,
  Share2,
  ExternalLink,
  Search,
} from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const {
    students,
    addRegularSlots,
    removeRegularSlot,
    createStudent,
    deleteStudent,
    getStudentShareUrl,
    addToast,
  } = useReservation();

  // 정렬 및 검색 상태
  const [sortBy, setSortBy] = useState<'name' | 'grade'>('name');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 학년 정렬 가중치 계산 (유치부 < 초1~초6 < 중1~중3 < 고등 < 성인)
  const getGradeRank = (gradeStr?: string): number => {
    if (!gradeStr) return 999;
    const g = gradeStr.trim();
    if (g.includes('유치') || g.includes('6세') || g.includes('7세')) return 0;
    const matchCho = g.match(/초\s*([1-6])/);
    if (matchCho) return parseInt(matchCho[1], 10);
    const matchJung = g.match(/중\s*([1-3])/);
    if (matchJung) return 10 + parseInt(matchJung[1], 10);
    const matchGo = g.match(/고\s*([1-3])/);
    if (matchGo) return 20 + parseInt(matchGo[1], 10);
    if (g.includes('성인')) return 30;
    return 100;
  };

  // 검색 및 정렬된 원생 목록
  const displayedStudents = useMemo(() => {
    let list = [...students];

    // 1. 이름 또는 학년 검색 필터링
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.grade.toLowerCase().includes(q) ||
          s.phone.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, ''))
      );
    }

    // 2. 정렬 (가나다순 vs 학년순)
    if (sortBy === 'grade') {
      list.sort((a, b) => {
        const rankDiff = getGradeRank(a.grade) - getGradeRank(b.grade);
        if (rankDiff !== 0) return rankDiff;
        return a.name.localeCompare(b.name, 'ko');
      });
    } else {
      // 기본: 가나다순
      list.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    }

    return list;
  }, [students, searchQuery, sortBy]);

  // 신규 원생 등록 모달
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState('초3');
  const [newPhone, setNewPhone] = useState('010-');

  // 정규 수업 추가 모달
  const [selectedStudentForSlot, setSelectedStudentForSlot] = useState<string | null>(null);
  const [slotDays, setSlotDays] = useState<DayOfWeek[]>([1]);
  const [slotTime, setSlotTime] = useState<string>('15:00');
  const [slotError, setSlotError] = useState<string | null>(null);

  const toggleSlotDay = (d: DayOfWeek) => {
    setSlotDays((prev) => {
      if (prev.includes(d)) {
        if (prev.length === 1) return prev; // 최소 1개는 유지
        return prev.filter((item) => item !== d);
      } else {
        return [...prev, d].sort((a, b) => a - b);
      }
    });
  };

  const handleSelectDaysPreset = (preset: 'mon_wed_fri' | 'tue_thu' | 'all') => {
    if (preset === 'mon_wed_fri') setSlotDays([1, 3, 5]);
    if (preset === 'tue_thu') setSlotDays([2, 4]);
    if (preset === 'all') setSlotDays([1, 2, 3, 4, 5]);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createStudent(newName.trim(), newGrade, newPhone.trim());
    setNewName('');
    setNewGrade('초3');
    setNewPhone('010-');
    setIsNewStudentModalOpen(false);
  };

  const handleAddSlotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForSlot) return;
    if (slotDays.length === 0) {
      setSlotError('최소 1개 이상의 요일을 선택해주세요.');
      return;
    }
    setSlotError(null);

    const res = addRegularSlots(selectedStudentForSlot, slotDays, slotTime);
    if (res.success) {
      setSelectedStudentForSlot(null);
      setSlotDays([1]);
    } else {
      setSlotError(res.error || '수업 추가에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-5">
      {/* 상단 액션 바 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#1d1d1f]">원생 및 정규 수업 관리</h3>
          <p className="text-xs text-[#86868b] mt-0.5">
            학생별 매주 정규 수업 시간을 설정하고 학부모 1:1 안심 예약 링크를 발급합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewStudentModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-[16px] bg-[#0071e3] hover:bg-[#0077ed] active:scale-95 text-white text-xs font-semibold shadow-[0_4px_12px_rgba(0,113,227,0.3)] transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>신규 원생 등록</span>
        </button>
      </div>

      {/* 검색 & 정렬 툴바 (Apple macOS Style Capsule Toolbar) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-xl px-4 py-2.5 rounded-[20px] border border-black/[0.06] shadow-xs">
        {/* 좌측: 정렬 세그먼트 (가나다순 / 학년순) & 총 인원 카운트 */}
        <div className="flex items-center gap-3">
          <div className="bg-black/[0.04] p-1 rounded-[14px] flex items-center border border-black/[0.02]">
            <button
              type="button"
              onClick={() => setSortBy('name')}
              className={`px-3 py-1 rounded-[10px] text-xs font-semibold transition-all cursor-pointer ${
                sortBy === 'name'
                  ? 'bg-white text-[#1d1d1f] shadow-xs font-bold'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              가나다순
            </button>
            <button
              type="button"
              onClick={() => setSortBy('grade')}
              className={`px-3 py-1 rounded-[10px] text-xs font-semibold transition-all cursor-pointer ${
                sortBy === 'grade'
                  ? 'bg-white text-[#1d1d1f] shadow-xs font-bold'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              학년순
            </button>
          </div>

          <span className="text-xs text-[#86868b] font-medium">
            총 <strong className="text-[#1d1d1f] font-bold">{displayedStudents.length}</strong>명
          </span>
        </div>

        {/* 우측: 콤팩트한 애플 검색 캡슐 (Compact Search Pill) */}
        <div className="relative w-full sm:w-56 md:w-64">
          <Search className="w-3.5 h-3.5 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="원생 검색"
            className="w-full pl-9 pr-7 py-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.06] focus:bg-white text-xs font-medium text-[#1d1d1f] placeholder:text-[#86868b] border border-black/[0.06] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 focus:outline-none transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-black/10 hover:bg-black/20 text-[#86868b] hover:text-[#1d1d1f] cursor-pointer transition-colors"
              title="검색어 지우기"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 원생 카드 그리드 (Apple macOS Style Grid) */}
      {displayedStudents.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] p-12 text-center border border-black/[0.06] text-[#86868b] text-xs">
          <p className="font-semibold text-sm text-[#1d1d1f] mb-1">검색 결과가 없습니다</p>
          <p>'{searchQuery}'에 해당하는 원생을 찾을 수 없습니다.</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-3 text-xs text-[#0071e3] font-semibold hover:underline cursor-pointer"
          >
            검색어 초기화
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedStudents.map((student) => {
          return (
            <div
              key={student.id}
              className="bg-white/90 backdrop-blur-xl rounded-[24px] p-5 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                {/* 학생 프로필 헤더 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[16px] bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center font-bold text-base shadow-xs">
                      {student.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-[#1d1d1f] text-base">{student.name}</h4>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-black/[0.04] text-[#1d1d1f] border border-black/[0.04]">
                          {student.grade}
                        </span>
                      </div>
                      <p className="text-xs text-[#86868b] mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{student.phone}</span>
                      </p>
                    </div>
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`${student.name} 학생을 정말 삭제하시겠습니까? 관련 예약도 모두 삭제됩니다.`)) {
                        deleteStudent(student.id);
                      }
                    }}
                    className="text-[#86868b] hover:text-[#ff3b30] p-1.5 rounded-full hover:bg-black/[0.05] transition-colors"
                    title="원생 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 학부모 전용 예약 링크 (Apple Privacy Capsule) */}
                <div className="mt-3.5 p-3.5 bg-[#0071e3]/[0.06] rounded-[18px] border border-[#0071e3]/15 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#0071e3] flex items-center gap-1">
                      <span>🔗 학부모 전용 안심 링크</span>
                      <span className="text-[10px] text-[#0071e3] font-semibold bg-white/80 px-1.5 py-0.2 rounded-full border border-[#0071e3]/20">
                        타 학생 차단
                      </span>
                    </span>
                    <span className="text-[10px] font-mono text-[#0071e3]/80">
                      코드: {student.accessCode || student.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const url = getStudentShareUrl(student);
                        navigator.clipboard.writeText(url);
                        addToast(
                          'success',
                          '전용 링크 복사 완료',
                          `${student.name} 학부모 전용 링크가 클립보드에 복사되었습니다! 카카오톡으로 전송하세요.`
                        );
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-[12px] bg-[#0071e3] hover:bg-[#0077ed] active:scale-95 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>카톡 전송용 링크 복사</span>
                    </button>

                    <a
                      href={getStudentShareUrl(student)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-[12px] bg-white/80 hover:bg-white text-[#0071e3] border border-[#0071e3]/20 text-xs font-semibold transition-all flex items-center justify-center shadow-xs"
                      title="학부모 화면 새 탭에서 열어보기"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* 매주 정규 수업 목록 */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1d1d1f] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#0071e3]" />
                      <span>매주 정규 수업</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentForSlot(student.id);
                        setSlotDays([1]);
                        setSlotError(null);
                      }}
                      className="text-[11px] font-bold text-[#0071e3] hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>추가</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 min-h-[48px]">
                    {student.regularSlots.length === 0 ? (
                      <span className="text-xs text-[#86868b] py-2">배정된 정규 수업이 없습니다.</span>
                    ) : (
                      student.regularSlots
                        .slice()
                        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                        .map((slot) => (
                          <div
                            key={`${slot.dayOfWeek}-${slot.time}`}
                            className="bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3] px-2.5 py-1 rounded-[12px] text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>
                              {DAY_NAMES[slot.dayOfWeek as DayOfWeek]} {slot.time}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeRegularSlot(student.id, slot.dayOfWeek, slot.time)}
                              className="text-[#0071e3]/60 hover:text-[#ff3b30] transition-colors"
                              title="삭제"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}

      {/* 모달 1: 신규 학생 등록 (Apple Action Sheet) */}
      {isNewStudentModalOpen && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/35 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="bg-white/95 backdrop-blur-2xl w-full max-w-md rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-black/[0.08] overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-black/[0.05] flex items-center justify-between bg-black/[0.01]">
              <h3 className="font-bold text-[#1d1d1f] text-base">신규 원생 등록</h3>
              <button
                onClick={() => setIsNewStudentModalOpen(false)}
                className="text-[#86868b] hover:text-[#1d1d1f] p-1.5 rounded-full hover:bg-black/[0.05] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1d1d1f] block mb-1">학생 이름 *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="예: 최서준"
                  className="w-full text-xs p-3 rounded-[14px] bg-black/[0.03] border border-black/[0.06] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1d1d1f] block mb-1">학년 / 연령 *</label>
                <input
                  type="text"
                  required
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  placeholder="예: 초3, 7세"
                  className="w-full text-xs p-3 rounded-[14px] bg-black/[0.03] border border-black/[0.06] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1d1d1f] block mb-1">학부모 연락처</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  className="w-full text-xs p-3 rounded-[14px] bg-black/[0.03] border border-black/[0.06] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewStudentModalOpen(false)}
                  className="px-4 py-2.5 rounded-[14px] text-xs font-semibold text-[#1d1d1f] bg-black/[0.05] hover:bg-black/[0.08]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-[14px] text-xs font-bold bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-[0_2px_8px_rgba(0,113,227,0.3)] active:scale-95"
                >
                  원생 등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 모달 2: 정규 시간표 추가 (복수 요일 중복 선택 지원) */}
      {selectedStudentForSlot && (() => {
        const targetStudent = students.find((s) => s.id === selectedStudentForSlot);
        return (
          <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/35 backdrop-blur-md animate-in fade-in duration-200">
            <div
              className="bg-white/95 backdrop-blur-2xl w-full max-w-sm rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-black/[0.08] overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-black/[0.05] flex items-center justify-between bg-black/[0.01]">
                <div>
                  <h3 className="font-bold text-[#1d1d1f] text-base">매주 정규 수업 추가</h3>
                  {targetStudent && (
                    <p className="text-xs text-[#86868b] mt-0.5">
                      대상 원생: <span className="font-semibold text-[#1d1d1f]">{targetStudent.name}</span> ({targetStudent.grade || '학년 미지정'})
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudentForSlot(null)}
                  className="text-[#86868b] hover:text-[#1d1d1f] p-1.5 rounded-full hover:bg-black/[0.05] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSlotSubmit} className="p-6 space-y-4">
                {slotError && (
                  <div className="p-3 bg-[#ff3b30]/10 border border-[#ff3b30]/20 text-[#ff3b30] text-xs rounded-[14px] font-semibold leading-relaxed">
                    {slotError}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#1d1d1f]">
                      요일 선택 <span className="text-[11px] font-normal text-[#86868b]">(중복 선택 가능)</span>
                    </label>
                    <span className="text-[11px] font-semibold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-full">
                      {slotDays.length}개 요일 선택됨
                    </span>
                  </div>

                  {/* 5개 요일 토글 버튼 */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {([1, 2, 3, 4, 5] as DayOfWeek[]).map((d) => {
                      const isSelected = slotDays.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleSlotDay(d)}
                          className={`py-2 rounded-[12px] text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                            isSelected
                              ? 'border-[#0071e3] bg-[#0071e3] text-white shadow-xs scale-[1.02]'
                              : 'border-black/[0.06] bg-black/[0.02] text-[#1d1d1f] hover:bg-black/[0.05]'
                          }`}
                        >
                          <span className="text-[13px]">{DAY_NAMES[d]}</span>
                          <span className={`text-[9px] font-medium ${isSelected ? 'text-white/80' : 'text-[#86868b]'}`}>
                            {isSelected ? '✓ 선택' : '미선택'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 빠른 선택 단축 버튼 (월수금 / 화목 / 매일) */}
                  <div className="mt-2.5 flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-[#86868b] font-medium shrink-0">빠른 선택:</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleSelectDaysPreset('mon_wed_fri')}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                          slotDays.length === 3 && slotDays.includes(1) && slotDays.includes(3) && slotDays.includes(5)
                            ? 'bg-[#0071e3]/15 text-[#0071e3] border-[#0071e3]/30 font-bold'
                            : 'bg-black/[0.03] text-[#86868b] hover:text-[#1d1d1f] border-black/[0.05]'
                        }`}
                      >
                        월·수·금
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectDaysPreset('tue_thu')}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                          slotDays.length === 2 && slotDays.includes(2) && slotDays.includes(4)
                            ? 'bg-[#0071e3]/15 text-[#0071e3] border-[#0071e3]/30 font-bold'
                            : 'bg-black/[0.03] text-[#86868b] hover:text-[#1d1d1f] border-black/[0.05]'
                        }`}
                      >
                        화·목
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectDaysPreset('all')}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                          slotDays.length === 5
                            ? 'bg-[#0071e3]/15 text-[#0071e3] border-[#0071e3]/30 font-bold'
                            : 'bg-black/[0.03] text-[#86868b] hover:text-[#1d1d1f] border-black/[0.05]'
                        }`}
                      >
                        매일(월~금)
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#1d1d1f] block mb-1">시간 선택 (30분 단위)</label>
                  <select
                    value={slotTime}
                    onChange={(e) => setSlotTime(e.target.value)}
                    className="w-full text-xs p-3 rounded-[14px] bg-black/[0.03] border border-black/[0.06] font-bold text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                  >
                    {TIME_SLOTS.map((t) => {
                      const counts = slotDays.map((d) =>
                        students.filter((s) =>
                          s.regularSlots.some((slot) => slot.dayOfWeek === d && slot.time === t)
                        ).length
                      );
                      const maxCount = Math.max(...counts, 0);
                      const isAnyFull = maxCount >= 4;
                      return (
                        <option key={t} value={t} disabled={isAnyFull}>
                          {t} ~ {t.split(':')[0]}:{t.split(':')[1] === '00' ? '30' : '00'}{' '}
                          {slotDays.length === 1
                            ? `(현재 ${counts[0]}/4명${isAnyFull ? ' 만석' : ''})`
                            : `(선택 요일 최대 ${maxCount}/4명${isAnyFull ? ' 만석 포함' : ''})`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedStudentForSlot(null)}
                    className="px-4 py-2.5 rounded-[14px] text-xs font-semibold text-[#1d1d1f] bg-black/[0.05] hover:bg-black/[0.08] cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-[14px] text-xs font-bold bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-[0_2px_8px_rgba(0,113,227,0.3)] active:scale-95 cursor-pointer"
                  >
                    {slotDays.length > 1 ? `${slotDays.length}개 요일 일괄 배정` : '수업 배정'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
