"use client";
import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import HeroBanner from '@/components/layout/Banner';
import resultData from "@/data/Summer-result.json";

// --- Types ---
interface ResultItem {
  registrationId: string;
  name: string;
  institute: string;
  score: number;
  rank: number;
  selected: boolean;
}

interface RawResultItem {
  "Enrolment.No": string;
  "Name": string;
  "institution_name": string;
  "Total_Marks": string | number;
}

interface ApiResponse {
  data: ResultItem[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

// --- Constants ---
const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 300;
const SELECTION_CUTOFF = 50.7;

// --- API Cache ---
let cachedData: ResultItem[] | null = null;
const cachedFilterCache = new Map<string, ResultItem[]>();

function toNumericScore(value: string | number): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number.parseFloat(String(value).trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeResults(raw: RawResultItem[]): ResultItem[] {
  return raw.map((item, index) => {
    const score = toNumericScore(item["Total_Marks"]);

    return {
      registrationId: String(item["Enrolment.No"] || "").trim(),
      name: String(item["Name"] || "").trim(),
      institute: String(item["institution_name"] || "").trim(),
      score,
      rank: index + 1,
      selected: score >= SELECTION_CUTOFF,
    };
  });
}

// --- API Simulation ---
const fetchResultsApi = async (
  page: number,
  limit: number,
  query: string,
  signal?: AbortSignal
): Promise<ApiResponse> => {
  try {
    if (!cachedData) {
      const rawResults = (Array.isArray(resultData) ? resultData : []) as RawResultItem[];
      cachedData = normalizeResults(rawResults);
    }

    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const cacheKey = query.toLowerCase();
    let filtered = cachedFilterCache.get(cacheKey);

    if (!filtered) {
      if (!query) {
        filtered = cachedData!;
      } else {
        const lowerQuery = query.toLowerCase();
        filtered = cachedData!.filter((item) =>
          [item.name, item.registrationId, item.institute, item.score.toFixed(2)].some(
            (field) => field?.toLowerCase().includes(lowerQuery)
          )
        );
      }
      cachedFilterCache.set(cacheKey, filtered);
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const totalPages = Math.ceil(filtered.length / safeLimit);
    const start = (safePage - 1) * safeLimit;

    return {
      data: filtered.slice(start, start + safeLimit),
      total: filtered.length,
      page: safePage,
      totalPages,
      hasMore: safePage < totalPages,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    console.error("API Error:", err);
    return {
      data: [],
      total: 0,
      page,
      totalPages: 0,
      hasMore: false,
    };
  }
};

// --- Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// --- Announcement Card ---
const AnnouncementCard = memo(() => (
  <div className="bg-gray-900 rounded-lg p-8 border border-gray-600 mb-8 shadow-md">
    <h3 className="text-center mb-3 py-5 text-white text-2xl font-bold">
      Result Declaration – Written Test (held on Summer 2026)
    </h3>
    <p className="text-gray-400 text-center sm:text-left">
      The following candidates have been selected for the Def-Space Summer
      Internship Technical Training Program 2026 in order of merit based
      on their performance in the written examination:
    </p>
    <h5 className="mt-6 text-blue-500 font-semibold text-lg">
      Cut-off for selection:
    </h5>
    <p className="text-gray-400">
      The candidate placed last in the merit list has secured 50.70 marks. This
      is the minimum qualifying score for direct selection in this examination.
    </p>
    <h5 className="mt-6 text-blue-500 font-semibold text-lg">
      Important Notes:
    </h5>
    <ul className="text-gray-400 list-disc pl-5 space-y-2 mt-2">
      <li>
        Candidates who scored below 50.70 marks but are still interested in the
        program may apply through the lateral entry process (details will be
        shared separately).
      </li>
      <li>
        Candidates who were unable to appear for the exam due to
        server/technical issues are requested to wait for further communication.
        A re-examination will be conducted on Saturday. All affected candidates
        will receive an official email with the exact date, time, and login
        instructions shortly.
      </li>
    </ul>
    <p className="mt-6 text-white font-medium py-2">
      We congratulate all selected candidates and wish everyone the very best!
    </p>
    <p className="text-gray-400 text-sm mt-1 py-3">
      <strong>
        Team – Bharat Space Education Research Centre
      </strong>
      <br />
      Date: 2026
    </p>
  </div>
));
AnnouncementCard.displayName = "AnnouncementCard";

// --- Pagination ---
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalResults: number;
}

const Pagination = memo(
  ({ currentPage, totalPages, onPageChange, totalResults }: PaginationProps) => {
    const pageNumbers = useMemo(() => {
      const pages: (number | string)[] = [];
      const maxVisible = 5;

      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1, "...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...", totalPages);
      }

      return pages;
    }, [currentPage, totalPages]);

    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
        <p className="text-gray-400 text-sm" aria-live="polite">
          Showing{" "}
          <span className="text-white font-medium">{totalResults}</span> results
        </p>

        <div
          className="flex items-center space-x-2"
          role="navigation"
          aria-label="Pagination"
        >
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="px-4 py-2 bg-gray-800 border border-gray-600 text-gray-300 rounded-lg
                       hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Previous
          </button>

          <div className="hidden sm:flex items-center space-x-1">
            {pageNumbers.map((page, index) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-gray-500"
                  aria-hidden="true"
                >
                  ...
                </span>
              ) : (
                <button
                  key={`page-${page}`}
                  onClick={() => onPageChange(page as number)}
                  aria-current={page === currentPage ? "page" : undefined}
                  aria-label={`Page ${page}`}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    page === currentPage
                      ? "bg-blue-600 text-white font-semibold"
                      : "bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {page}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className="px-4 py-2 bg-gray-800 border border-gray-600 text-gray-300 rounded-lg
                       hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Next
          </button>
        </div>

        <p className="sm:hidden text-gray-400 text-sm">
          Page <span className="text-white font-medium">{currentPage}</span> of{" "}
          <span className="text-white font-medium">{totalPages}</span>
        </p>
      </div>
    );
  }
);
Pagination.displayName = "Pagination";

// --- Results Table ---
const ResultsTable: React.FC = () => {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, DEBOUNCE_DELAY);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const loadResults = useCallback(async (pageNum: number, query: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await fetchResultsApi(
        pageNum,
        ITEMS_PER_PAGE,
        query,
        abortControllerRef.current.signal
      );

      setResults(response.data);
      setTotalPages(response.totalPages);
      setTotalResults(response.total);
      setPage(response.page);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Failed to fetch results", err);
      setError("Failed to load results. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset to page 1 on new search
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Fetch on page or search change
  useEffect(() => {
    loadResults(page, debouncedSearch);
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [page, debouncedSearch, loadResults]);

  const EmptyStateIcon = useMemo(
    () => (
      <svg
        className="mx-auto h-12 w-12 text-gray-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    []
  );

  const SearchIcon = useMemo(
    () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
    []
  );

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 shadow-xl">
      <h2 className="text-center mb-6 text-white text-2xl font-bold tracking-wide">
        Def-Space Summer Internship 2026 Result
      </h2>

      {/* Search Input */}
      <div className="mb-6 relative">
        <label htmlFor="search-input" className="sr-only">
          Search results
        </label>
        <input
          id="search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-4 bg-gray-800 border border-gray-600 text-white rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-500 transition-all duration-200"
          placeholder="Search by Name, Registration ID, Institute, or Score..."
          aria-describedby="search-hint"
        />
        <div className="absolute right-4 top-4 text-gray-500 pointer-events-none">
          {SearchIcon}
        </div>
        <p id="search-hint" className="sr-only">
          Type to filter results. Search is debounced for performance.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div
          className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm"
          role="alert"
        >
          {error}
          <button
            onClick={() => loadResults(page, debouncedSearch)}
            className="ml-2 underline hover:text-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full divide-y divide-gray-700" role="table">
          <thead className="bg-gray-800">
            <tr>
              {["Rank", "Registration ID", "Name", "Institute", "Score"].map(
                (header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-4 py-4 text-left text-xs font-medium text-blue-400 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div
                    className="flex justify-center items-center space-x-2 text-gray-400"
                    aria-live="polite"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.6s]"></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">Loading results...</p>
                </td>
              </tr>
            ) : results.length > 0 ? (
              results.map((item) => (
                <tr
                  key={item.registrationId}
                  className="hover:bg-gray-800 transition-colors duration-150"
                >
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white font-bold">
                    #{item.rank}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                    {item.registrationId}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white font-medium">
                    {item.name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                    {item.institute}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="font-bold text-green-400">{item.score.toFixed(2)}</div>
                    <div className="mt-2">
                      {item.selected ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300">
                          Selected
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-900 text-rose-300">
                          Not Selected
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  {EmptyStateIcon}
                  <p className="mt-2">
                    {searchQuery
                      ? `No results found for "${searchQuery}"`
                      : "No results available"}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalResults={totalResults}
      />
    </div>
  );
};

// --- Main Page ---
const ResultsPage: React.FC = () => {
  return (
    <>
      <HeroBanner
        title="Internship Results"
        backgroundImage="/img/about-hero-v2.webp"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Careers', href: '/' },
          { label: 'About', isActive: true },
        ]}
      />

      <div className="min-h-screen bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center">
            <div className="w-full lg:w-10/12">
              <AnnouncementCard />
              <ResultsTable />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResultsPage;
