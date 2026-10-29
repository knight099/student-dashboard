import data from '../data/dashboard.json' with { type: 'json' };

export function buildContext(filters = {}, question = '') {
  const cohort = filters.cohort ?? 'ALL';
  const mode = filters.mode ?? 'ALL';
  if (!['ALL', ...data.cohorts.map(c => c.cohort_id)].includes(cohort) || !['ALL', 'Online', 'Hybrid'].includes(mode)) {
    throw new Error('Invalid dashboard filter.');
  }
  const matches = row => (cohort === 'ALL' || row.c === cohort) && (mode === 'ALL' || row.m === mode);
  const sessions = data.sessions.filter(matches);
  const students = data.students.filter(matches);
  function summary(rows, people = []) {
    const totals = rows.reduce((a, r) => ({present:a.present+r.p, late:a.late+r.l, absent:a.absent+r.a, excused:a.excused+r.e, minutes:a.minutes+r.min}), {present:0,late:0,absent:0,excused:0,minutes:0});
    const attended = totals.present + totals.late;
    const expected = attended + totals.absent;
    return {...totals, attended, expected, attendanceRate:expected ? attended/expected : 0,
      averageMinutes:attended ? totals.minutes/attended : 0, lateArrivalRate:attended ? totals.late/attended : 0,
      sessions:new Set(rows.map(r => r.id)).size, students:people.length,
      studentsUnder75:people.filter(s => s.sch && s.att/s.sch < .75).length};
  }
  const student = s => ({id:s.id, cohort:s.c, mode:s.m, attended:s.att, expected:s.sch,
    attendanceRate:s.sch ? s.att/s.sch : 0, score:s.sc, completion:s.cp, risk:s.tier,
    riskScore:s.rk, daysInactive:s.ina, averageMinutes:s.att ? s.min/s.att : 0,
    composite:(s.sa+s.sc+s.cp)/3});
  const ids = question.match(/S-\d{4}/gi) || [];
  return {
    source:'Randomly generated mock data from student_analytics_mock_data.xlsx; not real student records.',
    period:'3 August to 25 October 2026, 12 weeks',
    definitions:{attendanceRate:'(present + late) / (present + late + absent); excused excluded',
      studentAttendanceRate:'attended / scheduled', composite:'mean of source attendance score, average score and completion; fractions from 0 to 1'},
    filters:{cohort, mode}, summary:summary(sessions, students),
    cohorts:data.cohorts, courses:data.courses,
    byCohort:data.cohorts.filter(c => cohort==='ALL' || c.cohort_id===cohort).map(c => ({cohort:c.cohort_id,...summary(sessions.filter(r=>r.c===c.cohort_id),students.filter(s=>s.c===c.cohort_id))})),
    globalCohortComparison:data.cohorts.map(c=>({cohort:c.cohort_id,...summary(data.sessions.filter(r=>r.c===c.cohort_id && (mode==='ALL'||r.m===mode)), data.students.filter(s=>s.c===c.cohort_id && (mode==='ALL'||s.m===mode)))})),
    byWeek:Array.from({length:12},(_,i)=>({week:i+1,...summary(sessions.filter(r=>r.w===i+1))})),
    byMode:['Online','Hybrid'].filter(m=>mode==='ALL'||m===mode).map(m=>({mode:m,...summary(sessions.filter(r=>r.m===m),students.filter(s=>s.m===m))})),
    byCourse:data.courses.map(c=>({course:c.course_name,...summary(sessions.filter(r=>r.k===c.course_id))})),
    byWeekday:['Mon','Wed','Fri'].map(day=>({day,...summary(sessions.filter(r=>r.d===day))})),
    bySessionType:['Live lecture','Lab','Workshop'].map(type=>({type,...summary(sessions.filter(r=>r.t===type))})),
    byRisk:['Low','Medium','High'].map(risk=>{
      const people=students.filter(s=>s.tier===risk && s.sch);
      return {risk,students:people.length,averageAttendanceRate:people.length?people.reduce((a,s)=>a+s.att/s.sch,0)/people.length:0};
    }),
    followUp:students.filter(s=>s.sch).sort((a,b)=>a.att/a.sch-b.att/b.sch||b.ina-a.ina).slice(0,15).map(student),
    topPerformers:students.slice().sort((a,b)=>(b.sa+b.sc+b.cp)-(a.sa+a.sc+a.cp)).slice(0,10).map(student),
    requestedStudents:data.students.filter(s=>ids.includes(s.id)).map(student)
  };
}
