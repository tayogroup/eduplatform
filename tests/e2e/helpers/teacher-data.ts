import { createRunId } from './student-data';

export interface TeacherJourneyData {
  runId: string;
  teacher: {
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
    phone: string;
    username: string;
    country: string;
    city: string;
    cityOther: string;
    timezone: string;
    primaryLanguage: string;
    courseKey: string;
    level: string;
    experience: string;
    education: string;
    teachingStyle: string;
    bio: string;
    desiredServices: string;
    notes: string;
  };
}

function numericToken(value: string, length: number): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash * 31) + value.charCodeAt(index)) % 1_000_000_000;
  }

  return String(hash).padStart(length, '0').slice(-length);
}

export function buildTeacherJourneyData(runId = createRunId().replace('sqa-journey', 'sqa-teacher')): TeacherJourneyData {
  const token = runId.replace(/[^a-zA-Z0-9]/g, '').slice(-18).toLowerCase();
  const phoneToken = numericToken(runId, 9);

  return {
    runId,
    teacher: {
      firstName: 'Teacher',
      lastName: token,
      displayName: `Teacher ${token}`,
      email: `teacher.${token}@example.test`,
      phone: `+1557${phoneToken}`,
      username: `teacher.${token}`,
      country: 'Other',
      city: 'Other',
      cityOther: 'SQA Teacher City',
      timezone: 'Africa/Nairobi',
      primaryLanguage: 'English',
      courseKey: 'pre_quraan',
      level: 'Pre-quraan Course',
      experience: `Automated SQA teacher experience for ${runId}.`,
      education: `Automated SQA education and qualifications for ${runId}.`,
      teachingStyle: `Automated SQA teaching style for ${runId}.`,
      bio: `Automated SQA teacher profile summary for ${runId}.`,
      desiredServices: 'Institution workspace classes, live sessions, and marketplace profile.',
      notes: `Automated SQA teacher intake notes for ${runId}.`,
    },
  };
}
