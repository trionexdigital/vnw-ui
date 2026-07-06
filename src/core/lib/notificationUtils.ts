export interface NotificationMeta {
  patientId?: number;
  patientName?: string;
  testType?: string;
  testId?: number;
}

export interface ParsedNotification {
  text: string;
  meta: NotificationMeta | null;
}

const META_PREFIX = '<!--meta:';
const META_SUFFIX = '-->';

const TEST_REPORT_ROUTES: Record<string, string> = {
  PTA:  '/pure-tone-audiometry/report',
  SA:   '/speech-audiometry/report',
  TYMP: '/tympanometry/report',
  ABR:  '/auditory-brainstem-response/report',
  OAE:  '/otoacoustic-emissions/report',
  GC:   '/general-consult/report',
};

const TEST_LABELS: Record<string, string> = {
  PTA:  'PTA Report',
  SA:   'Speech Report',
  TYMP: 'Tympanometry Report',
  ABR:  'ABR Report',
  OAE:  'OAE Report',
  GC:   'GC Report',
};

export function buildNotificationMessage(
  text: string,
  meta: NotificationMeta
): string {
  return `${text}${META_PREFIX}${JSON.stringify(meta)}${META_SUFFIX}`;
}

export function parseNotificationMessage(message: string): ParsedNotification {
  if (!message) return { text: '', meta: null };

  const metaStart = message.indexOf(META_PREFIX);
  if (metaStart === -1) {
    return { text: message, meta: null };
  }

  const jsonStart = metaStart + META_PREFIX.length;
  const jsonEnd = message.indexOf(META_SUFFIX, jsonStart);
  if (jsonEnd === -1) {
    return { text: message, meta: null };
  }

  const text = message.substring(0, metaStart).trim();
  try {
    const meta = JSON.parse(message.substring(jsonStart, jsonEnd)) as NotificationMeta;
    return { text, meta };
  } catch {
    return { text: message.substring(0, metaStart).trim(), meta: null };
  }
}

export function getTestReportPath(testType: string): string | null {
  return TEST_REPORT_ROUTES[testType] || null;
}

export function getTestLabel(testType: string): string {
  return TEST_LABELS[testType] || `${testType} Report`;
}

export function getTestNavState(
  testType: string,
  testId: number,
  patientId: number
): Record<string, any> {
  const base: Record<string, any> = { patientId };

  switch (testType) {
    case 'PTA':  base.ptaId = testId; break;
    case 'SA':   base.saId = testId; break;
    case 'TYMP': base.tympId = testId; break;
    case 'ABR':  base.abrId = testId; break;
    case 'OAE':  base.oaeId = testId; break;
    case 'GC':   base.consultId = testId; break;
  }

  return base;
}
