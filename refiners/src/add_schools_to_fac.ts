import * as faculties from "../../data/json/raw/faculties.json";
import * as courses from "../../data/json/raw/courses.json";
import _ from "lodash";
import * as fs from "fs";

type Courses = Record<string, Course>;
type ScrapedCourses = Record<string, ScrapedCourse>;
type ScrapedCourse = Partial<Course>;
type Course = {
  name: string;
  uoc: string;
  overview: string;
  prereqs: string;
  equivalent_courses: string[];
  exclusion_courses: string[];
  is_gen_ed: boolean;
  is_intro: boolean;
  is_multi_term: boolean;
  faculty: string;
  school: string;
  study_level: string;
  offering_terms: string;
  campus: string;
  academic_calendar: string;
  field_of_education: string;
};

type ProcessedCourse = {
  name: string;
  uoc: number;
  overview: string;
  school: string;
  terms_available: string[];
  equivalent_courses: string[];
  exclusion_courses: string[];
  
  // prereqs: courses (and or or), courses w wam reqs, degree wam reqs, programs

  unlocked_by: string[];
  unlocks: string[];
  is_intro: boolean;
  is_gen_ed: boolean;
  is_multi_term: boolean;
}

const main = (): void => {
  const filled_courses: any = fill_courses();
  add_schools_to_facs(filled_courses);
  return;
}

const fill_courses = (): Courses => {
  let courses_dc: any = _.cloneDeep(courses);
  let filled_courses: any = {};
  for (let [key, val] of Object.entries(courses_dc)){
    if (key === 'default') continue;
    let filled_course: Course = fill_empty_course_attrs(key, val);
    filled_courses = {...filled_courses, ...filled_course};
  }
  //fs.writeFileSync('../data/json/courses_test.json', JSON.stringify(filled_courses,null,2));
  return filled_courses;
}

const add_schools_to_facs = (filled_courses: Courses): void => {
  let fac_name_abbr: any = {};
  let facs_dc: any = _.cloneDeep(faculties)
  // build object showing relationship of faculty codes and full names
  for (let [key, val] of Object.entries(facs_dc)) { 
    if (key === 'default') continue;
    let f_val: any = val;
    fac_name_abbr = {...fac_name_abbr, ...{[f_val['name']]: key}};
    facs_dc[key] = {...facs_dc[key], ...{'schools': []}};  
  }
  delete facs_dc['default'];
  
  // fill schools array in faculty by traversing all courses
  for (let [key, val] of Object.entries(filled_courses)) {
    const c_fac = val['faculty'];
    if (c_fac === "") continue;
    const c_sch = val['school'];
    const fac_code = fac_name_abbr[c_fac];
    let fac_school_arr: string[] = facs_dc[fac_code]['schools'];
    if (!fac_school_arr.includes(c_sch) && c_sch !== "") {
      fac_school_arr.push(c_sch);
      facs_dc[fac_code]['schools'] = fac_school_arr;
    }
  }
  //console.log(JSON.stringify(facs_dc,null,2))
  fs.writeFileSync('../data/json/faculties.json', JSON.stringify(facs_dc,null,2));
  return;
}

// could expand upon this if 2022 hb is even more cooked
const fill_empty_course_attrs = (course_code: string, course_attrs: any): any => {
  let filled_course_attrs: any = _.cloneDeep(course_attrs);
  let nonexistent_attrs: string[] = ['campus', 'school', 'offering_terms'];
  nonexistent_attrs.forEach(n_attr => {
    if (!(n_attr in course_attrs)) {
      filled_course_attrs = {...filled_course_attrs, ...{[n_attr]: ""}};
    }
  })
  let filled_course: any = {[course_code]: filled_course_attrs};
  return filled_course;
}

main();