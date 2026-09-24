export interface CourseToRegister {
  courseId: string;
  code: string;
  title: string;
  creditUnits: number;
  prerequisiteCourseId?: string;
  prerequisiteCode?: string;
}

export interface RegistrationValidationInput {
  hasPaidSchoolFees: boolean;
  selectedCourses: CourseToRegister[];
  passedCourseIds: Set<string>;
  minCreditLoad?: number; // default 15
  maxCreditLoad?: number; // default 24
}

export interface RegistrationValidationResult {
  isValid: boolean;
  totalCreditUnits: number;
  errors: string[];
}

export class CourseRegistrationEngine {
  /**
   * Validate student course registration payload against institutional regulations
   */
  static validateRegistration(input: RegistrationValidationInput): RegistrationValidationResult {
    const minLoad = input.minCreditLoad ?? 15;
    const maxLoad = input.maxCreditLoad ?? 24;
    const errors: string[] = [];

    // 1. Fee Payment Gate
    if (!input.hasPaidSchoolFees) {
      errors.push('Course registration locked: Student must possess a verified Bursary fee payment record for the current session.');
    }

    // 2. Calculate Total Credit Units
    const totalCreditUnits = input.selectedCourses.reduce((sum, c) => sum + c.creditUnits, 0);

    if (totalCreditUnits < minLoad) {
      errors.push(`Registered credit units (${totalCreditUnits}) is below the required minimum threshold of ${minLoad} units.`);
    }

    if (totalCreditUnits > maxLoad) {
      errors.push(`Registered credit units (${totalCreditUnits}) exceeds the statutory maximum limit of ${maxLoad} units.`);
    }

    // 3. Prerequisite Checks
    for (const course of input.selectedCourses) {
      if (course.prerequisiteCourseId && !input.passedCourseIds.has(course.prerequisiteCourseId)) {
        errors.push(`Prerequisite not met for ${course.code}: You must first pass antecedent course ${course.prerequisiteCode || 'prerequisite'}.`);
      }
    }

    return {
      isValid: errors.length === 0,
      totalCreditUnits,
      errors,
    };
  }
}
