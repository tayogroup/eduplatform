export interface StudentJourneyData {
  runId: string;
  student: {
    firstName: string;
    middleName: string;
    lastName: string;
    displayName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
  };
  guardian: {
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
    phone: string;
    relationship: string;
  };
  finance: {
    paymentReference: string;
    transcriptReason: string;
  };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function timestamp(date = new Date()): string {
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    '-',
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
  ].join('');
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

function numericToken(value: string, length: number): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash * 31) + value.charCodeAt(index)) % 1_000_000_000;
  }

  return String(hash).padStart(length, '0').slice(-length);
}

export function createRunId(date = new Date()): string {
  return `sqa-journey-${timestamp(date)}-${randomSuffix()}`;
}

export function buildStudentJourneyData(runId = createRunId()): StudentJourneyData {
  const token = runId.replace(/[^a-zA-Z0-9]/g, '').slice(-18).toLowerCase();
  const phoneToken = numericToken(runId, 9);
  const emailDomain = 'example.test';

  return {
    runId,
    student: {
      firstName: 'Sqa',
      middleName: 'Journey',
      lastName: token,
      displayName: `Sqa Journey ${token}`,
      email: `student.${token}@${emailDomain}`,
      phone: `+1555${phoneToken}`,
      dateOfBirth: '2014-01-15',
    },
    guardian: {
      firstName: 'Guardian',
      lastName: token,
      displayName: `Guardian ${token}`,
      email: `guardian.${token}@${emailDomain}`,
      phone: `+1556${phoneToken}`,
      relationship: 'parent',
    },
    finance: {
      paymentReference: `manual-${runId}`,
      transcriptReason: `SQA journey official transcript issue for ${runId}`,
    },
  };
}
