/**
 * Interpolate URL with params
 * @param url
 * @param params
 */
export const interpolateUrl = (
  url: string,
  params?: Record<string, unknown>,
) => {
  if (!params) {
    return url;
  }

  if (Array.isArray(params)) {
    return url;
  }

  return url.replace(/{(.*?)}/g, (_, key) => {
    const value = params[key];
    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (typeof value === 'boolean') {
      return value.toString();
    }

    return `{${key}}`;
  });
};
