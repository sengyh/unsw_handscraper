
// COURSES
export type Courses = Record<string, Course>;
export type ScrapedCourses = Record<string, ScrapedCourse>;
export type ScrapedCourse = Partial<Course>;
export type Course = {
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

export type ProcessedCourse = {
  name: string;
  uoc: number;
  level: number;
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
};



export type Subject = {
  code: string;
  name: string;
  courses: string[];
};

export type Faculties = Record<string, Faculty>;
export type Faculty = {
  name: string;
  overview: string;
  Programs?: string[];
  'Double Degrees'?: string[];
  Specialisations?: {
    Major?: string[];
    Minor?: string[];
    Honours?: string[];
  };
  schools?: string[];
};