/**
 * 학생 전용 고유 접속 코드(Access Code) 생성 및 관리 유틸리티
 * 
 * 보안 강화 요구사항:
 * - 접두사: 이름 이니셜 2글자 (예: 김민준 -> mj, 박서연 -> sy, 이도윤 -> dy)
 * - 구분자: '-'
 * - 접미사: 무작위 영숫자 5글자 (예: 7k3xp, 9pef1, 2m8qa)
 * -> 최종 형태: **-xxxxx (예: mj-7k3xp, sy-9w4af, tk-9pef1)
 */

/**
 * 학생 이름으로부터 2글자 영문 이니셜(Prefix) 추출
 * 예:
 * - 김민준 -> mj (민: m, 준: j)
 * - 박서연 -> sy (서: s, 연: y)
 * - 이도윤 -> dy (도: d, 윤: y)
 * - 최하은 -> he (하: h, 은: e)
 * - 정시우 -> su (시: s, 우: u)
 * - 박토끼 -> tk (토: t, 끼: k)
 * - 개똥이 -> ti 또는 gt (똥: t, 이: i)
 */
export function getStudentInitials(name: string): string {
  if (!name || typeof name !== 'string') return 'st';
  const cleanName = name.trim().replace(/\s+/g, '');
  if (cleanName.length === 0) return 'st';

  // 한글 초성/중성 로마자 매핑 테이블
  const CHOSUNG_ROMAN = [
    'g', 'k', 'n', 'd', 't', 'r', 'm', 'b', 'p', 's',
    's', '', 'j', 'j', 'ch', 'k', 't', 'p', 'h'
  ];
  const JUNGSEONG_ROMAN = [
    'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa',
    'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'
  ];

  const getCharRoman = (char: string): string => {
    const code = char.charCodeAt(0) - 0xac00;
    if (code >= 0 && code <= 11171) {
      const choIndex = Math.floor(code / 588);
      const jungIndex = Math.floor((code % 588) / 28);
      const cho = CHOSUNG_ROMAN[choIndex];
      if (cho !== '') {
        return cho.charAt(0);
      }
      // 초성이 'ㅇ'인 경우 모음의 첫 글자(a, e, o, u, y 등)
      const jung = JUNGSEONG_ROMAN[jungIndex] || 'a';
      return jung.charAt(0);
    }
    // 영문인 경우 소문자 반환
    if (/[a-zA-Z]/.test(char)) {
      return char.toLowerCase();
    }
    return '';
  };

  // 1. 한국어 이름 (3글자 이상): 성(1글자) + 이름(2글자) 구조인 경우 이름 2글자 우선 (예: 김민준 -> mj, 박서연 -> sy)
  if (cleanName.length >= 3) {
    const c1 = getCharRoman(cleanName.charAt(1));
    const c2 = getCharRoman(cleanName.charAt(2));
    const result = (c1 + c2).slice(0, 2);
    if (result.length === 2) return result;
  }

  // 2. 2글자 이름 (예: 김민, 이하): 첫 2글자
  if (cleanName.length === 2) {
    const c1 = getCharRoman(cleanName.charAt(0));
    const c2 = getCharRoman(cleanName.charAt(1));
    const result = (c1 + c2).slice(0, 2);
    if (result.length === 2) return result;
  }

  // 3. 1글자 또는 기타
  const first = getCharRoman(cleanName.charAt(0));
  if (first) return (first + 'x').slice(0, 2);

  return 'st';
}

/**
 * 5글자 무작위 영숫자(소문자+숫자) 생성
 * 보안 강화를 위해 암호학적 난수(crypto)를 지원하며 혼동하기 쉬운 문자 배제
 * 예: 7k3xp, 9pef1, 2m8qa 등
 */
export function generateRandomCodeSuffix(length: number = 5): string {
  // 가독성과 보안성을 겸비한 32자리 영숫자 풀
  const chars = '23456789abcdefghjkmnpqrstuvwxyz';
  let result = '';

  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const values = new Uint8Array(length);
    window.crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += chars.charAt(values[i] % chars.length);
    }
    return result;
  }

  // Fallback
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 학생별 보안 강화 고유 접속 코드 생성
 * 형태: **-xxxxx (예: mj-7k3xp, sy-9w4af, dy-3m8qz, tk-9pef1)
 */
export function generateStudentAccessCode(studentName: string): string {
  const prefix = getStudentInitials(studentName);
  const suffix = generateRandomCodeSuffix(5);
  return `${prefix}-${suffix}`;
}

/**
 * 기존 코드가 구형 형식(예: mj-2026 등 -2026으로 끝나거나 st-로 시작하는 경우)인지 판별
 */
export function isLegacyAccessCode(code?: string): boolean {
  if (!code) return true;
  // -2026 형태이거나, st- 로 시작하거나, 길이가 형식에 안 맞는 경우
  if (code.endsWith('-2026')) return true;
  if (code.startsWith('st-')) return true;
  // 표준 형식: 2글자-5글자 (총 8글자, 가운데 '-')
  const match = code.match(/^[a-z]{2}-[a-z0-9]{5}$/i);
  return !match;
}
