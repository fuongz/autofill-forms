const MAPPING_KEY = '__autofill_forms_mapping_data';

export function getStoredMapping(): Record<string, string> {
  const rawValue = localStorage.getItem(MAPPING_KEY);
  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue) as Record<string, string>;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function mergeStoredMapping(data: Record<string, string>): Record<string, string> {
  const nextValue = { ...getStoredMapping(), ...data };
  localStorage.setItem(MAPPING_KEY, JSON.stringify(nextValue));
  return nextValue;
}
