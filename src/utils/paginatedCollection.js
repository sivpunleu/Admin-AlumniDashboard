const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_MAX_PAGES = 50;

export const getCollectionItems = (root, payload) => {
  const data =
    payload?.items ||
    payload?.data?.items ||
    root?.items ||
    root?.data?.items ||
    payload?.data ||
    payload ||
    [];

  return Array.isArray(data) ? data : [];
};

const pickNumber = (sources, keys) => {
  for (const source of sources) {
    for (const key of keys) {
      const value = source?.[key];
      if (value !== undefined && value !== null && value !== "") {
        const numberValue = Number(value);
        if (Number.isFinite(numberValue)) {
          return numberValue;
        }
      }
    }
  }

  return undefined;
};

export const getPaginationMeta = (root, payload) => {
  const sources = [
    payload?.meta,
    root?.meta,
    payload?.pagination,
    root?.pagination,
    payload,
    root,
  ];

  return {
    total: pickNumber(sources, ["total", "totalItems", "total_items"]),
    pages: pickNumber(sources, [
      "last_page",
      "lastPage",
      "totalPages",
      "total_pages",
      "pageCount",
    ]),
  };
};

export const fetchPaginatedCollection = async (
  api,
  endpoint,
  { params = {}, pageSize = DEFAULT_PAGE_SIZE, maxPages = DEFAULT_MAX_PAGES } = {},
) => {
  const items = [];
  let page = 1;

  while (page <= maxPages) {
    const response = await api.get(endpoint, {
      params: {
        ...params,
        _page: page,
        _per_page: pageSize,
      },
    });
    const root = response.data ?? {};
    const payload = root?.data ?? root;

    items.push(...getCollectionItems(root, payload));

    const { pages } = getPaginationMeta(root, payload);
    if (!pages) break;

    if (page >= Math.min(pages, maxPages)) break;
    page += 1;
  }

  return items;
};
