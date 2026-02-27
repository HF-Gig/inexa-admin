import * as Yup from 'yup';

export const baseInitialValues = {
  title: "",
  key: "",
  subject: [],
  owner: "",
  staff: [],
  facilitator: [],
  enrollment_count: 0,
  outcome: '',
  languages: [],
  provider: "",
  duration_value: 0,
  duration_unit: "",
  availability: "",
  course_level: "",
  start_date: "",
  // end_date: "",
  short_description: "",
  breakdown_description: "",
  image_url: null,
  degree_pdf_path: null,
  estimated_hours: "",
  transcript_languages: [],
  price: "",
  self_cost: "",
  self_caption: "",
  interactive_cost: "",
  interactive_caption: "",
  payment_type_self: "",
  payment_type_interactive: "",
  card_short: "",
  degree_detail_short_desc: "",
  admission_steps: "",
  admission_steps_desc: "",
  course_modules: "",
  min_effort: "",
  max_effort: "",
  pacing_type: "",
  order: 0,
  disclaimer: false,
  course_snapshot: "",
  isCobranding: true,
};

export const getInitialValues = (page: string) => {
  if (page === "program") {
    return {
      ...baseInitialValues,
      industry_insights: "",
      courses: [],
      program_type: [],
    };
  }
  // Default (courses)
  return {
    ...baseInitialValues,
    skills: [],
    prerequisites: "",
  };
};

export const baseValidation = {
  title: Yup.string().trim().min(3, "Title must be at least 3 characters"), // .required("Title is required"),
  key: Yup.string(), // .required("Slug is required"),
  subject: Yup.array(), // .required("Subject is required"),
  owner: Yup.mixed(), // .required("Owner is required"),
  languages: Yup.array(), // .min(1, "At least one language is required"),
  provider: Yup.mixed(),
  duration_value: Yup.string(), // .required("Duration value is required"),
  duration_unit: Yup.string(), // .required("Duration unit is required"),
  availability: Yup.string(), // .required("Availability is required"),
  short_description: Yup.string().nullable(), // .required("Short description is required"),
  breakdown_description: Yup.string().nullable(),
  outcome: Yup.string().nullable(),
  image_url: Yup.mixed().nullable()
    .test(
      "fileSize",
      "Image must be less than or equal to 2MB",
      value => {
        if (value === null || value === undefined) return true;
        if (typeof value === "string") return true;
        if (typeof File !== 'undefined' && value instanceof File) {
          return value.size <= 2 * 1024 * 1024;
        }
        return false;
      }
    ),
  estimated_hours: Yup.number().nullable(),
  transcript_languages: Yup.array(), // .min(1, "At least one transcript language is required"),
  self_cost: Yup.number().nullable(),
  self_caption: Yup.string().nullable(),
  interactive_cost: Yup.number().nullable(),
  interactive_caption: Yup.string().nullable(),
  payment_type_self: Yup.string().nullable(),
  payment_type_interactive: Yup.string().nullable(),
  min_effort: Yup.number(), // .required("Min effort is required"),
  max_effort: Yup.number(),
  // .min(0, "Max effort must be positive")
  // // .required("Max effort is required")
  // .test(
  //   "max-greater-than-min",
  //   "Max effort must be greater than min effort",
  //   function (value) {
  //     const { min_effort } = this.parent;
  //     if (typeof value === "number" && typeof min_effort === "number") {
  //       return value > min_effort;
  //     }
  //     return true;
  //   }
  // ),
  pacing_type: Yup.string().nullable(),
  order: Yup.number().nullable(),
};

export const getValidationSchema = (page: string) => {
  if (page === "program") {
    return Yup.object({
      ...baseValidation,
      industry_insights: Yup.string().nullable(),
      courses: Yup.array(), // .min(1, "At least one course is required"),
      program_type: Yup.string(), // .required("Program type is required"),
    });
  }
  // Default (courses)
  return Yup.object({
    ...baseValidation,
    course_modules: Yup.string().nullable(),
    start_date: Yup.string(), // .required("Start date is required"),
    // end_date: Yup.string()
    //   .nullable()
    //   .test(
    //     "end-after-start",
    //     "End date must be after or equal to start date",
    //     function (value) {
    //       const { start_date } = this.parent;
    //       if (!value || !start_date) return true;
    //       return new Date(value) >= new Date(start_date);
    //     }
    //   ),
    course_level: Yup.string(), // .required('Course level is required'),
    skills: Yup.array(), // .min(1, "At least one skill is required"),
    prerequisites: Yup.string().nullable(),
    staff: Yup.array(), // .min(1, "At least one staff member is required"),
    facilitator: Yup.array(),
    enrollment_count: Yup.number().nullable(),
  });
};
