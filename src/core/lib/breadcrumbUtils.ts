
export interface BreadcrumbItem {
  label: string;
  href?: string;
  state?: any;
}

/**
 * Generates breadcrumbs based on the current page and navigation state.
 * If patientId and patientName are present in the state, it prepends 
 * Home > Patients > [Patient Name] to the breadcrumbs.
 * If fromAllTests is present, it prepends Home > All Tests.
 */
export const getBreadcrumbs = (
  items: BreadcrumbItem[],
  locationState?: any
): BreadcrumbItem[] => {
  const patientId = locationState?.patientId;
  const patientName = locationState?.patientName;
  const fromAllTests = locationState?.fromAllTests;
  const fromList = locationState?.fromList;
  const listLabel = locationState?.listLabel;
  const listHref = locationState?.listHref;

  let base: BreadcrumbItem[] = [];

  if (fromAllTests) {
    base = [{ label: "All Tests", href: "/all-tests" }];
  } else if (fromList && listLabel && listHref) {
    base = [{ label: listLabel, href: listHref }];
  } else if (patientId && patientName) {
    base = [
      { label: "Patients", href: "/patients" },
      { label: patientName, href: "/patients/details", state: { patientId } },
    ];
  }

  return [...base, ...items];
};
