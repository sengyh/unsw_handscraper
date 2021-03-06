import { is_double_nested, check_if_val_name_eq_key, is_object, is_specialisation_block, has_disciplinary_component, num_objects_in_obj } from "./pstruct_helpers";
import { construct_refined_spec_obj, construct_refined_program_structure, construct_refined_course_obj } from "./pstruct_constructors";
import type {ProcessedProgramStructure, ProcessedPCourseObj, SpecElem, OtherInfoElem} from '../custom_types';
import * as _ from 'lodash'

export const process_structure = (program_structure: any): ProcessedProgramStructure => {
  // initialise 
  let refined_prog_structure: ProcessedProgramStructure = construct_refined_program_structure();
  refined_prog_structure.program_structure_overview = program_structure.overview;
  const disciplinary_component_exists: boolean = has_disciplinary_component(program_structure);
  const struct_keys: string[] = Object.keys(program_structure); 
  struct_keys.forEach(key => {
    const struct_obj = program_structure[key];
    if (is_object(struct_obj)) {
      if (is_double_nested(struct_obj)) {
        refined_prog_structure = process_double_nested_obj(key, struct_obj, refined_prog_structure, disciplinary_component_exists);
      } else {    
        refined_prog_structure = process_single_nested_obj(key, struct_obj, refined_prog_structure, disciplinary_component_exists);
      }
    }
  })
  //console.log(JSON.stringify(refined_prog_structure, null, 2))
  //console.log('\n')
  return refined_prog_structure;
}

const process_double_nested_obj = (key: string, struct_obj: any, 
  refined_prog_structure: ProcessedProgramStructure, 
  disciplinary_component_exists: boolean): ProcessedProgramStructure => {

  if (key === 'Disciplinary Component') {
    refined_prog_structure.core_structure_uoc = parseInt(struct_obj.uoc);
    refined_prog_structure.core_structure_desc = struct_obj.requirements;
    refined_prog_structure = process_disciplinary_component(struct_obj, refined_prog_structure);
  } else {
    refined_prog_structure = process_misc_double_nested_obj(key, struct_obj, refined_prog_structure, disciplinary_component_exists);
  }  
  return refined_prog_structure
}

const process_single_nested_obj = (key: string, struct_obj: any, 
  refined_prog_structure: ProcessedProgramStructure, 
  disciplinary_component_exists: boolean): ProcessedProgramStructure => {

  if (is_specialisation_block(struct_obj)) {
    const refined_spec_obj: SpecElem = construct_refined_spec_obj(key, struct_obj);
    if (key.match(/^Optional/gm)) {
      refined_prog_structure.optional_specialisations.push(refined_spec_obj);
    } else {
      refined_prog_structure.core_specialisations.push(refined_spec_obj);
    }
  } else {
    // is a course obj, if no uoc and courses move to more_information
    const is_gened_or_free_elec = key.match(/^general education$|free/gmi)
    const refined_course_obj: ProcessedPCourseObj = construct_refined_course_obj(key, struct_obj);
    if ((refined_course_obj.courses.length === 0 && refined_course_obj.uoc === "") && !('course_groups' in refined_course_obj)) {
      const more_info_obj: OtherInfoElem = {
        'name': refined_course_obj.name,
        'description': refined_course_obj.description
      };
      refined_prog_structure.more_information.push(more_info_obj);
    } else {
      if (!disciplinary_component_exists) {
        // put all non free electives & gen eds into core_course_structure
        if (!is_gened_or_free_elec) {
          refined_prog_structure.core_course_component.push(refined_course_obj);
        } else {
          refined_prog_structure.misc_course_components.push(refined_course_obj);
        }
      } else {
        refined_prog_structure.misc_course_components.push(refined_course_obj);
      }
    }
  }
  return refined_prog_structure;
}

const process_disciplinary_component = (struct_obj: any, refined_prog_structure: ProcessedProgramStructure): ProcessedProgramStructure => {
  const struct_keys_lv2: string[] = Object.keys(struct_obj);
  struct_keys_lv2.forEach(key => {
    const struct_obj_lv2: any = struct_obj[key];
    if (is_object(struct_obj_lv2)) {
      // now check if there are specialistion objects inside
      if (is_specialisation_block(struct_obj_lv2)) {
        const spec_block_req: string = struct_obj_lv2.requirements.replaceAll(/\n{2,}/gm, '\n');
        const sbr_first_line: string = spec_block_req.split('\n')[0];
        const refined_spec_obj: SpecElem = construct_refined_spec_obj(key, struct_obj_lv2);
        // assigns spec block from disc component into either core or optional spec
        if (sbr_first_line.match(/may/gm)) {
          refined_prog_structure.optional_specialisations.push(refined_spec_obj);
        } else {
          refined_prog_structure.core_specialisations.push(refined_spec_obj);
        }
      } else {
        // process course blocks
        const refined_course_obj: ProcessedPCourseObj = construct_refined_course_obj(key, struct_obj_lv2);
        if ((refined_course_obj.courses.length === 0 && refined_course_obj.uoc === "") && !('course_groups' in refined_course_obj)) {
          // move to more information
          const more_info_obj: OtherInfoElem = {
            'name': refined_course_obj.name,
            'description': refined_course_obj.description
          };
          refined_prog_structure.more_information.push(more_info_obj);
        } else {
          refined_prog_structure.core_course_component.push(refined_course_obj);
        }
      }
    }
  })
  //console.log(JSON.stringify(refined_prog_structure, null, 2));
  return refined_prog_structure;
}

const process_misc_double_nested_obj = (key: string, struct_obj: any, 
    refined_prog_structure: ProcessedProgramStructure,
    disciplinary_component_exists: boolean): ProcessedProgramStructure => {
  if (num_objects_in_obj(struct_obj) === 1) {
    const lv2_keys: string[] = Object.keys(struct_obj);
    lv2_keys.forEach(lv2_key => {
      if (is_object(struct_obj[lv2_key])) {
        const lv2_struct_obj: any = struct_obj[lv2_key];
        // this is pretty much for 3778 (i had to, this was my degree)
        if (is_specialisation_block(lv2_struct_obj)) {
          const new_spec_obj: SpecElem = construct_refined_spec_obj(lv2_key, lv2_struct_obj);
          refined_prog_structure.optional_specialisations.push(new_spec_obj);
          struct_obj.courses = [];
          const new_course_obj: ProcessedPCourseObj = 
          construct_refined_course_obj(key, struct_obj)
          refined_prog_structure.misc_course_components.push(new_course_obj)
        } else {
          // transplant struct_obj's uoc and requirements to lv2_struct_obj
          lv2_struct_obj.uoc = struct_obj.uoc;
          lv2_struct_obj.requirements = struct_obj.requirements;
          const new_course_obj: ProcessedPCourseObj = construct_refined_course_obj(lv2_key, lv2_struct_obj);
          if (disciplinary_component_exists) {
            refined_prog_structure.misc_course_components.push(new_course_obj);
          } else {
            refined_prog_structure.core_course_component.push(new_course_obj);
          }
        }
      }
    });
  } else if (num_objects_in_obj(struct_obj) > 1) {
    // absolutely horrendous
    if (num_objects_in_obj(struct_obj) === 2) {
      const lv2_keys: string[] = Object.keys(struct_obj);
      lv2_keys.forEach(lv2_key => {
        const lv2_struct_obj: any = struct_obj[lv2_key];
        if (is_object(lv2_struct_obj)) {
          if (is_specialisation_block(lv2_struct_obj)) {
            const new_spec_obj: SpecElem = construct_refined_spec_obj(lv2_key, lv2_struct_obj);
            refined_prog_structure.optional_specialisations.push(new_spec_obj);
          } else {
            // edge case for program 4405 (damn you canberra)
            if (lv2_key.match(/^Maximum/gm)) {
              const new_more_info_obj: OtherInfoElem = {
                'name': lv2_struct_obj.name,
                'description': lv2_struct_obj.requirements + '\n' + lv2_struct_obj.courses[0]
              }
              refined_prog_structure.more_information.push(new_more_info_obj);
            } else if (lv2_key.match(/^Minimum/gm)) {
              const new_course_obj: ProcessedPCourseObj = construct_refined_course_obj(lv2_key, lv2_struct_obj);
              refined_prog_structure.misc_course_components.push(new_course_obj);
              struct_obj.courses = [];
              const free_elec_course_obj: ProcessedPCourseObj = construct_refined_course_obj(key, struct_obj);
              refined_prog_structure.misc_course_components.push(free_elec_course_obj);
            } else {
              lv2_struct_obj.uoc = struct_obj.uoc;
              if (lv2_struct_obj.requirements === "") {
                lv2_struct_obj.requirements = struct_obj.requirements;
              }
              const new_course_obj: ProcessedPCourseObj = construct_refined_course_obj(lv2_key, lv2_struct_obj);
              refined_prog_structure.misc_course_components.push(new_course_obj);
            }
          }
        }
      });
      // pretty much will only be used for program 7004
      if (!(key.match(/^free electives$/gmi))) {
        const new_more_info_obj: OtherInfoElem = {
          'name': key,
          'description': struct_obj.requirements
        }
        refined_prog_structure.more_information.push(new_more_info_obj);
      }
    } else if (num_objects_in_obj(struct_obj) === 7) {
      const lv2_keys: string[] = Object.keys(struct_obj);
      lv2_keys.forEach(lv2_key => {
        const lv2_struct_obj: any = struct_obj[lv2_key];
        if (is_object(lv2_struct_obj)) {
          const new_course_obj: ProcessedPCourseObj = construct_refined_course_obj(lv2_key, lv2_struct_obj);
          refined_prog_structure.misc_course_components.push(new_course_obj);
        }
      });
      const new_more_info_obj: OtherInfoElem = {
        'name': key,
        'description': struct_obj.requirements
      }
      refined_prog_structure.more_information.push(new_more_info_obj);
    }
  }
  return refined_prog_structure;
}