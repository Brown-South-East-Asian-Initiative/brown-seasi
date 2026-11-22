// Student works live in content/student-works/*.json. Read them with useCollection(STUDENT_WORKS_FOLDER).

export interface StudentWork {
  slug: string
  title: string
  students: string
  year: number
  type: string
  blurb?: string
  link?: string
  image?: string
  imageAlt?: string
}

export const STUDENT_WORKS_FOLDER = 'content/student-works'
export const STUDENT_WORKS_PAGE = 'content/pages/student-works.json'

/** Choices editors get for a work's type. */
export const STUDENT_WORK_TYPES = ['Oral History', 'Research', 'Archive', 'Creative', 'Other']

/** Newest first. */
export function sortStudentWorks<T extends { data: StudentWork }>(works: T[]) {
  return [...works].sort((a, b) => (b.data.year ?? 0) - (a.data.year ?? 0) || (a.data.title ?? '').localeCompare(b.data.title ?? ''))
}
